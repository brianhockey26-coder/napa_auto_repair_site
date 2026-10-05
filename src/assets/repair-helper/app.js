import { assess,interpret } from './engine.js';
import { questions } from './knowledge.js';
import { locales } from './locales.js';

const root=document.querySelector('#repair-helper');
if(root){
 const lang=document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang.startsWith('es')?'es':'en';
 const copy=locales[lang],ui=copy.ui;
 const mount=root.querySelector('[data-helper-mount]');
 let state={text:'',vehicle:'',topics:[],answers:{},history:[]};
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
 function reset(){state={text:'',vehicle:'',topics:[],answers:{},history:[]};renderStart();focusTitle();}
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
   if(!state.topics.length){message(ui.clarify);return;}
   const result=assess(state);
   if(result.level===3)renderResult();else renderQuestion();
  },true);
  mount.append(label,input,vehicleLabel,vehicle,group,begin);
 }
 function goBack(){
  const previous=state.history.pop();
  if(previous){delete state.answers[previous];renderQuestion();}
  else {renderStart();focusTitle();}
 }
 function renderQuestion(){
  const result=assess(state),id=result.questions[0];
  if(!id){renderResult();return;}
  clear();
  const header=node('div',{class:'rh-progress'});
  header.append(node('span',{},`${ui.step} ${state.history.length+1} / 6`),button(ui.edit,()=>{renderStart();focusTitle();}));
  const bar=node('div',{class:'rh-progress-track','aria-hidden':'true'});
  const fill=node('span');fill.style.width=`${(state.history.length+1)/6*100}%`;bar.append(fill);
  const selected=node('p',{class:'rh-selected'},state.topics.map(t=>copy.topics[t]).join(' · '));
  const group=node('fieldset',{class:'rh-options','data-question':id});
  const legend=node('legend',{tabindex:'-1'},copy.questions[id].title);group.append(legend);
  for(const option of questions[id].options){
   const label=node('label',{class:'rh-option'});
   const input=node('input',{type:'radio',name:'rh-answer',value:option});
   label.append(input,node('span',{},copy.questions[id].options[option]));group.append(label);
  }
  const controls=node('div',{class:'rh-controls'});
  controls.append(button(ui.back,goBack),button(ui.next,()=>{
   const answer=group.querySelector('input:checked')?.value;
   if(!answer){message(ui.select);return;}
   state.answers[id]=answer;state.history.push(id);
   const updated=assess(state);
   if(updated.level===3||!updated.questions.length)renderResult();else renderQuestion();
  },true));
  mount.append(header,bar,selected,group,controls);focusTitle();
 }
 function renderResult(){
  clear();const result=assess(state);
  const heading=node('h3',{class:'rh-result-title',tabindex:'-1'},ui.levels[result.level]);
  const status=node('div',{class:`rh-status rh-level-${result.level}`});
  status.append(node('span',{'aria-hidden':'true'},result.level===3?'!':result.level===2?'↗':'✓'),heading,node('p',{},ui.actions[result.level]));
  if(result.emergency)status.append(node('p',{class:'rh-emergency'},ui.emergency));
  mount.append(status);
  if(result.historical)mount.append(node('p',{class:'rh-message'},ui.past));
  if(result.conflict)mount.append(node('p',{class:'rh-message'},ui.conflict));
  if(result.unresolved.length||result.unknown)mount.append(node('p',{class:'rh-message'},ui.provisional));
  mount.append(node('h4',{},ui.reasoning));
  const reasons=node('ul',{class:'rh-reasons'});
  for(const key of result.reasons)reasons.append(node('li',{},copy.reasons[key]||copy.reasons.unknown));
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
  const answerLines=state.history.map(id=>`${copy.questions[id].title} ${copy.questions[id].options[state.answers[id]]}`);
  summary.value=[state.vehicle,state.text,state.topics.map(t=>copy.topics[t]).join(' · '),...answerLines,ui.levels[result.level]].filter(Boolean).join('\n');
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
  link.addEventListener('click',()=>{state={text:'',vehicle:'',topics:[mapping[index]],answers:{},history:[]};renderStart();focusTitle();});
  // The brakes entry is also present statically; reuse it rather than duplicating.
  const existing=details.querySelector('[data-helper-topic]');
  if(existing){existing.addEventListener('click',()=>{state={text:'',vehicle:'',topics:['brakes'],answers:{},history:[]};renderStart();focusTitle();});}
  else details.append(link);
 });
}
