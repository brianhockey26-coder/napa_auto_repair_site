import { assess,interpret } from './engine.js';
import { buildAdvisorBrief } from './advisor.js';
import { extractChatAnswers,matchIntent } from './chat.js';

const topicForAnswer={brakes:'brakes',tires:'tires',steering:'steering',start:'start',engine:'engine',lights:'lights',heat:'heat',leaks:'leaks',smell:'smell',climate:'climate',maintenance:'maintenance',noise:'noise'};

export function createConversationState(locale='en'){
 return {locale,text:'',vehicle:'',topics:[],answers:{},messages:[],corrections:[]};
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
 return {state:{...state,messages},kind,messageKeys,result,brief,nextQuestion,intent};
}

export function replyToMessage(previous,raw,copy){
 const message=String(raw??'').trim().slice(0,1000);
 const starting={...previous,messages:append(previous,'user',message)};
 if(!message){
  const result=conversationalResult(starting),brief=buildAdvisorBrief(result);
  return response('clarify',starting,result,brief,['clarify'],null);
 }
 const facts=extractChatAnswers(message),recognized=interpret(message);
 const intent=matchIntent(message);
 const topics=new Set([...starting.topics,...recognized.topics]);
 for(const question of Object.keys(facts))if(topicForAnswer[question])topics.add(topicForAnswer[question]);
 const answers={...starting.answers,...facts};
 const corrections=[...starting.corrections];
 if(intent==='correction'){
  corrections.push(message);
  if(facts.vibrationWhen==='idle')answers.brakes='vibrate';
 }
 const state={...starting,text:currentText(starting.messages),vehicle:vehicleFromMessage(message)||starting.vehicle,topics:[...topics],answers,corrections};
 const result=conversationalResult(state),brief=buildAdvisorBrief(result);
 if(vehicleFromMessage(message)&&!intent&&!recognized.topics.length&&!Object.keys(facts).length)return response('reply',state,result,brief,['vehicle'],null,'vehicle');
 if(result.level>=3&&!result.historical)return response('safety',state,result,brief,['safety'],null,intent);
 if(intent==='code')return response('reply',state,result,brief,[`code.${facts.engineCode||'unknown'}`],result.questions[0]||null,'code');
 if(intent==='causes')return response('reply',state,result,brief,[result.possibilities.length?'causes':'needDetails'],result.questions[0]||null,intent);
 if(intent==='urgency'||intent==='inspection')return response('reply',state,result,brief,[`action.${result.level}`],result.questions[0]||null,intent);
 if(intent==='summary')return response('summary',state,result,brief,['summary'],null,intent);
 if(!recognized.topics.length&&!Object.keys(facts).length)return response('clarify',state,result,brief,['clarify'],null,intent);
 const detail=result.reasons.filter(key=>key!=='unknown').map(key=>`reason.${key}`);
 return response('question',state,result,brief,[intent==='correction'?'correction':(detail[0]||'acknowledge'),`action.${result.level}`],result.questions[0]||null,intent);
}
