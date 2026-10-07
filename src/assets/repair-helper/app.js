import { assess,interpret } from './engine.js';
import { questions,rules } from './knowledge.js';
import { locales } from './locales.js';
import { matchReply } from './chat.js';
import { MAX_QUESTIONS } from './quiz.js';
import { buildAdvisorBrief } from './advisor.js';

const root=document.querySelector('#repair-helper');
if(root){
 const lang=document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang.startsWith('es')?'es':'en';
 const copy=locales[lang],ui=copy.ui;
 const mount=root.querySelector('[data-helper-mount]');
 let state={text:'',vehicle:'',topics:[],answers:{},history:[]};
 let replies={},chatNotes=[];
 const node=(tag,attributes={},text)=>{
  const element=document.createElement(tag);
  for(const [key,value] of Object.entries(attributes))element.setAttribute(key,String(value));
  if(text!==undefined)element.textContent=text;
  return element;
 };
 const button=(text,action,primary=false)=>{
  const element=node('button',{type:'button',class:primary?'button button-primary':'rh-secondary'},text);
  element.addEventListener('click',action);return element;
 };
 const call=()=>node('a',{class:'button button-primary',href:'tel:+19084166132'},ui.call);
 function focusTitle(){mount.querySelector('legend,h3,textarea')?.focus({preventScroll:true});}
 function clear(){mount.replaceChildren();}
 function message(text){
  let output=mount.querySelector('[data-message]');
  if(!output){output=node('p',{'data-message':'',role:'status',class:'rh-message'});mount.append(output);}
  output.textContent=text;
 }
 function reset(){state={text:'',vehicle:'',topics:[],answers:{},history:[]};replies={};chatNotes=[];renderStart();focusTitle();}
 function renderStart(){
  clear();
  const label=node('label',{for:'rh-description',class:'rh-label'},ui.label);
  const input=node('textarea',{id:'rh-description',rows:'3',maxlength:'1000',placeholder:ui.placeholder});input.value=state.text;
  const vehicleLabel=node('label',{for:'rh-vehicle',class:'rh-label rh-small'},ui.vehicle);
  const vehicle=node('input',{id:'rh-vehicle',type:'text',maxlength:'120',placeholder:ui.vehiclePlaceholder});vehicle.value=state.vehicle;
  const group=node('fieldset',{class:'rh-topics'});group.append(node('legend',{},ui.topics));
  for(const [id,text] of Object.entries(copy.topics)){
   const choice=node('label',{class:'rh-chip'});
   const checkbox=node('input',{type:'checkbox',value:id,name:'rh-topics'});checkbox.checked=state.topics.includes(id);
   choice.append(checkbox,node('span',{},text));group.append(choice);
  }
  const begin=button(ui.begin,()=>{
   state.text=input.value.slice(0,1000);state.vehicle=vehicle.value.slice(0,120);
   const explicit=[...group.querySelectorAll('input:checked')].map(n=>n.value);
   state.topics=[...new Set([...explicit,...interpret(state.text).topics])];state.answers={};state.history=[];
   replies={};chatNotes=[];
   if(!state.topics.length){message(ui.clarify);return;}
   const result=assess(state);
   if(result.level===3)renderResult();else renderQuestion();
  },true);
  mount.append(label,input,vehicleLabel,vehicle,group,begin);
 }
 function goBack(){
  const previous=state.history.pop();
  if(previous){delete state.answers[previous];delete replies[previous];chatNotes=[];renderQuestion();}
  else {renderStart();focusTitle();}
 }
 function renderQuestion(){
  const result=assess(state),id=result.questions[0];
  if(!id){renderResult();return;}
  clear();
  const header=node('div',{class:'rh-progress'});
  header.append(node('span',{},`${ui.step} ${state.history.length+1}`),button(ui.edit,()=>{renderStart();focusTitle();}));
  const bar=node('div',{class:'rh-progress-track','aria-hidden':'true'});
  const fill=node('span');fill.style.width=`${(state.history.length+1)/MAX_QUESTIONS*100}%`;bar.append(fill);
  const selected=node('p',{class:'rh-selected'},state.topics.map(t=>copy.topics[t]).join(' · '));
  const group=node('fieldset',{class:'rh-options','data-question':id});
  const legend=node('legend',{tabindex:'-1'},copy.questions[id].title);group.append(legend);
  group.append(node('p',{class:'rh-small'},ui.shortcuts));
  for(const option of questions[id].options){
   const label=node('label',{class:'rh-option'});
   const input=node('input',{type:'radio',name:'rh-answer',value:option});
   label.append(input,node('span',{},copy.questions[id].options[option]));group.append(label);
  }
  const transcript=node('div',{class:'rh-chat',role:'log','aria-label':ui.title});
  if(state.text)transcript.append(node('p',{class:'rh-bubble rh-you'},`${ui.you}: ${state.text}`));
  for(const previous of state.history){
   transcript.append(node('p',{class:'rh-bubble'},copy.questions[previous].title),node('p',{class:'rh-bubble rh-you'},`${ui.you}: ${replies[previous]||copy.questions[previous].options[state.answers[previous]]}`));
  }
  for(const note of chatNotes)transcript.append(node('p',{class:'rh-bubble'},note));
  const replyLabel=node('label',{for:'rh-reply',class:'rh-label'},ui.reply);
  const reply=node('textarea',{id:'rh-reply',rows:'2',maxlength:'1000',placeholder:ui.replyPlaceholder});
  const submit=()=>{
   const raw=reply.value.trim();
   // New danger mentioned anywhere in the chat must not be lost in a quiz answer.
   const hazard=raw?assess({text:raw}):null;
   const safetyReply=raw?matchReply('safety',raw):{};
   if(raw&&((hazard.level===3&&!hazard.historical)||['fire','control','smoke','fuel'].includes(safetyReply.answer))){
    // Keep fresh facts in front of the engine's bounded input, and explicitly
    // confirm severe answers so an earlier mild choice cannot erase them.
    state.text=[raw,state.text].filter(Boolean).join('\n').slice(0,1000);
    state.topics=[...new Set([...state.topics,...interpret(raw).topics])];
    state.answers.timing='now';
    for(const fact of interpret(raw).facts)if(!fact.past&&!fact.uncertain&&rules[fact.question]?.[fact.answer]?.level===3)state.answers[fact.question]=fact.answer;
    if(['fire','control','smoke','fuel'].includes(safetyReply.answer))state.answers.safety=safetyReply.answer;
    renderResult();return;
   }
   const parsed=raw?matchReply(id,raw):{answer:group.querySelector('input:checked')?.value};
   if(parsed.intent){
    const current=assess(state);
    chatNotes.push(parsed.intent==='urgency'?ui.actions[current.level]:current.possibilities.length?current.possibilities.map(p=>`${copy.causes[p.id].title}: ${copy.causes[p.id].explain}`).join('\n\n')+'\n'+ui.causeLimit:ui.noCauses);
    renderQuestion();mount.querySelector('#rh-reply')?.focus();return;
   }
   if(!parsed.answer||!questions[id].options.includes(parsed.answer)){message(raw?ui.clarifyReply:ui.select);reply.focus();return;}
   state.answers[id]=parsed.answer;replies[id]=raw||copy.questions[id].options[parsed.answer];state.history.push(id);chatNotes=[];
   const updated=assess(state);
   if(updated.emergency||!updated.questions.length||(updated.level===3&&!state.continueDetails))renderResult();else renderQuestion();
  };
  reply.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit();}});
  const controls=node('div',{class:'rh-controls'});
  controls.append(button(ui.back,goBack),button(ui.next,submit,true));
  mount.append(header,bar,selected);
  if(result.level>=2)mount.append(node('p',{class:`rh-status rh-level-${result.level}`},ui.actions[result.level]));
  mount.append(transcript,group,replyLabel,reply,controls);focusTitle();
 }
 function renderResult(){
  clear();const result=assess(state);
  const brief=buildAdvisorBrief(result);
  const heading=node('h3',{class:'rh-result-title',tabindex:'-1'},ui.levels[result.level]);
  const status=node('div',{class:`rh-status rh-level-${result.level}`});
  status.append(node('span',{'aria-hidden':'true'},result.level===3?'!':result.level===2?'↗':'✓'),heading,node('p',{},ui.actions[result.level]));
  if(result.emergency)status.append(node('p',{class:'rh-emergency'},ui.emergency));
  mount.append(status);
  if(result.historical)mount.append(node('p',{class:'rh-message'},ui.past));
  if(result.conflict)mount.append(node('p',{class:'rh-message'},ui.conflict));
  if(result.unresolved.length||result.unknown)mount.append(node('p',{class:'rh-message'},ui.provisional));
  mount.append(node('h4',{},ui.possibleProblems),node('p',{class:'rh-small'},ui.causeLimit));
  if(!result.possibilities.length)mount.append(node('p',{},ui.noCauses));
  for(const possibility of result.possibilities){
   const cause=copy.causes[possibility.id];
   const card=node('article',{class:'rh-cause'});
   card.append(node('h4',{},cause.title),node('p',{},cause.explain),node('h5',{},ui.evidence));
   const evidence=node('ul');
   for(const id of possibility.evidence)evidence.append(node('li',{},`${copy.questions[id].title} ${copy.questions[id].options[state.answers[id]]||copy.questions[id].options[interpret(state.text).facts.find(f=>f.question===id)?.answer]||''}`));
   card.append(evidence,node('h5',{},ui.check),node('p',{},cause.check));mount.append(card);
  }
  const advisor=node('section',{class:`rh-advisor rh-advisor-${brief.mode}`,'aria-labelledby':'rh-advisor-title'});
  advisor.append(node('h4',{id:'rh-advisor-title'},brief.mode==='safety'?copy.advisor.caution:copy.advisor.heading));
  if(brief.mode==='safety')advisor.append(node('p',{class:'rh-advisor-caution'},copy.advisor.safety[brief.caution]));
  else {
   advisor.append(node('p',{class:'rh-advisor-service'},`${copy.advisor.service}: ${copy.services[brief.service]}`));
   const checklist=node('div',{class:'rh-advisor-group'});checklist.append(node('h5',{},copy.advisor.checklist));
   const list=node('ul');for(const item of brief.checklist)list.append(node('li',{},copy.advisor.checklistItems[item]));checklist.append(list);
   const questionsForShop=node('div',{class:'rh-advisor-group'});questionsForShop.append(node('h5',{},copy.advisor.questions));
   const questionList=node('ul');for(const item of brief.questions)questionList.append(node('li',{},copy.advisor.questionItems[item]));questionsForShop.append(questionList);
   advisor.append(checklist,questionsForShop);
   if(brief.caution)advisor.append(node('p',{class:'rh-advisor-caution'},copy.advisor.cautions[brief.caution]));
  }
  mount.append(advisor);
  if(result.questions.length&&!result.emergency)mount.append(button(ui.more,()=>{state.continueDetails=true;renderQuestion();},true));
  mount.append(node('h4',{},ui.reasoning));
  const reasons=node('ul',{class:'rh-reasons'});
  for(const key of result.reasons){
   const explanation=copy.reasons[key]||copy.reasons.unknown;
   reasons.append(node('li',{},result.pastReasons.includes(key)?`${ui.ifRecurs} ${explanation}`:explanation));
  }
  mount.append(reasons,node('h4',{},ui.possible));
  const serviceList=node('div',{class:'rh-service-list'});
  for(const id of result.services)serviceList.append(node('a',{href:'#services',class:'rh-service'},copy.services[id]));
  mount.append(serviceList);
  if(state.history.length){
   const details=node('details',{class:'rh-answer-review'});details.append(node('summary',{},ui.back));
   const list=node('dl');
   for(const id of state.history)list.append(node('dt',{},copy.questions[id].title),node('dd',{},copy.questions[id].options[state.answers[id]]));
   details.append(list);mount.append(details);
  }
  const label=node('label',{for:'rh-summary',class:'rh-label'},ui.summary);
  const summary=node('textarea',{id:'rh-summary',rows:'5'});
  const answerLines=state.history.map(id=>`${copy.questions[id].title} ${replies[id]||copy.questions[id].options[state.answers[id]]}`);
  const advisorLines=brief.mode==='safety'?[copy.advisor.safety[brief.caution]]:[`${copy.advisor.service}: ${copy.services[brief.service]}`,...brief.checklist.map(item=>copy.advisor.checklistItems[item]),...brief.questions.map(item=>copy.advisor.questionItems[item])];
  summary.value=[state.vehicle,state.text,state.topics.map(t=>copy.topics[t]).join(' · '),...answerLines,ui.possibleProblems,...result.possibilities.map(p=>copy.causes[p.id].title),ui.causeLimit,copy.advisor.heading,...advisorLines,ui.levels[result.level]].filter(Boolean).join('\n');
  const controls=node('div',{class:'rh-controls'});
  controls.append(button(ui.copy,async()=>{
   try{await navigator.clipboard.writeText(summary.value);message(ui.copied);}
   catch{summary.focus();summary.select();message(ui.copyFail);}
  }),call());
  const editControls=node('div',{class:'rh-controls rh-controls-muted'});
  editControls.append(button(ui.back,goBack),button(ui.restart,reset));
  mount.append(label,summary,controls,editControls);focusTitle();
 }
 renderStart();
 // Links are added only when enhancement succeeds; static phone actions always remain.
 const cards=document.querySelectorAll('.service-card');
 const mapping=['lights','maintenance','brakes','engine','steering','climate'];
 cards.forEach((card,index)=>{
  const details=card.querySelector('.service-detail');if(!details)return;
  const link=node('a',{href:'#repair-helper','data-helper-topic':mapping[index],class:'rh-entry'},ui.serviceLink);
  link.addEventListener('click',()=>{reset();state.topics=[mapping[index]];renderStart();focusTitle();});
  // The brakes entry is also present statically; reuse it rather than duplicating.
  const existing=details.querySelector('[data-helper-topic]');
  if(existing){existing.addEventListener('click',()=>{reset();state.topics=['brakes'];renderStart();focusTitle();});}
  else details.append(link);
 });
}
