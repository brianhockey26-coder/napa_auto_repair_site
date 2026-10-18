import { assess,interpret } from './engine.js';
import { buildAdvisorBrief } from './advisor.js';
import { extractChatAnswers,matchIntent,matchReply } from './chat.js';

const topicForAnswer={brakes:'brakes',tires:'tires',steering:'steering',start:'start',engine:'engine',lights:'lights',heat:'heat',leaks:'leaks',smell:'smell',climate:'climate',maintenance:'maintenance',noise:'noise'};

export function createConversationState(locale='en'){
 return {locale,text:'',vehicle:'',topics:[],answers:{},messages:[],corrections:[],pendingQuestion:null,codes:[],contextStart:0};
}

function currentText(messages){return messages.filter(({role})=>role==='user').map(({text})=>text).join('\n').slice(-1000);}
function append(state,role,text){return [...state.messages,{role,text}];}
function conversationalResult(state){return assess({text:state.text,topics:state.topics,answers:state.answers});}
function vehicleFromMessage(message){
 const year=message.match(/\b(19\d{2}|20\d{2})\b/u)?.[1];
 const mileage=message.match(/\b\d{1,3}(?:,\d{3})+\s*(?:miles?|mi)\b/ui)?.[0];
 const makeModel=message.match(/\b(?:19\d{2}|20\d{2})\s+([A-Za-z]+(?:\s+[A-Za-z0-9-]+){0,3})/u)?.[1]?.replace(/\s+(?:with|and)\b.*$/u,'');
 return year&&makeModel?`${year} ${makeModel}${mileage?` · ${mileage}`:''}`:'';
}
function response(kind,state,result,brief,messageKeys,nextQuestion=null,intent=null){
 if(nextQuestion)messageKeys=[...messageKeys,`question.${nextQuestion}`];
 const messages=append(state,'assistant',messageKeys.join(' '));
 return {state:{...state,messages,pendingQuestion:nextQuestion},kind,messageKeys,result,brief,nextQuestion,intent};
}

export function replyToMessage(previous,raw,copy){
 const message=String(raw??'').trim().slice(0,1000);
 const priorAssessment=conversationalResult(previous);
 if(/\b(?:new issue|different (?:issue|problem)|unrelated (?:issue|problem))\b|otro problema|problema diferente|另一个问题|换个问题|新的问题/ui.test(message)&&priorAssessment.level<3){
  previous={...previous,text:'',topics:[],answers:{},corrections:[],pendingQuestion:null,codes:[],contextStart:previous.messages.length};
 }
 const starting={...previous,messages:append(previous,'user',message)};
 if(!message){
  const result=conversationalResult(starting),brief=buildAdvisorBrief(result);
  return response('clarify',starting,result,brief,['clarify'],null);
 }
 const facts=extractChatAnswers(message),recognized=interpret(message);
 if(previous.pendingQuestion){
  const contextual=matchReply(previous.pendingQuestion,message);
  if(contextual.answer)facts[previous.pendingQuestion]=contextual.answer;
 }
 const intent=matchIntent(message);
 const topics=new Set([...starting.topics,...recognized.topics]);
 if(/(?:won.t|will not|cannot|can.t|doesn.t|does not) start|no arranca|无法启动|打不着/ui.test(message))topics.add('start');
 for(const question of Object.keys(facts))if(topicForAnswer[question])topics.add(topicForAnswer[question]);
 const answers={...starting.answers,...facts};
 const corrections=[...starting.corrections];
 if(intent==='correction'){
  corrections.push(message);
  if(facts.vibrationWhen==='idle')answers.brakes='vibrate';
 }
 const codes=[...new Set([...(starting.codes||[]),...(message.toUpperCase().match(/\bP\d{4}\b/g)||[])])].slice(-8);
 const state={...starting,text:currentText(starting.messages.slice(starting.contextStart||0)),vehicle:vehicleFromMessage(message)||starting.vehicle,topics:[...topics],answers,corrections,codes};
 const result=conversationalResult(state),brief=buildAdvisorBrief(result);
 if(result.level>=3)return response('safety',state,result,brief,['safety'],null,intent);
 if(vehicleFromMessage(message)&&!intent&&!recognized.topics.length&&!Object.keys(facts).length)return response('reply',state,result,brief,['vehicle'],null,'vehicle');
 if(topics.has('start')&&!answers.start&&!intent)return response('question',state,result,brief,['startDetails'],'start',intent);
 if(intent==='code'){
  const families=[...new Set(codes.map(code=>/^P030[0-9]$/.test(code)?'misfire':/^P017[14]$/.test(code)?'lean':/^P04[23]0$/.test(code)?'catalyst':/^P04(?:4[0-9]|5[0-7])$/.test(code)?'evap':'unknown'))];
  return response('reply',state,result,brief,families.map(family=>`code.${family}`),result.questions[0]||null,'code');
 }
 if(intent==='causes')return response('reply',state,result,brief,[result.possibilities.length?'causes':'needDetails'],result.questions[0]||null,intent);
 if(intent==='urgency'||intent==='inspection')return response('reply',state,result,brief,[`action.${result.level}`],result.questions[0]||null,intent);
 if(intent==='summary')return response('summary',state,result,brief,['summary'],null,intent);
 if(!recognized.topics.length&&!Object.keys(facts).length)return response('clarify',state,result,brief,['clarify'],previous.pendingQuestion||null,intent);
 const detail=result.reasons.filter(key=>key!=='unknown').map(key=>`reason.${key}`);
 return response('question',state,result,brief,[intent==='correction'?'correction':(detail[0]||'acknowledge'),`action.${result.level}`],result.questions[0]||null,intent);
}
