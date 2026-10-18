import {locales} from './locales.js';
import {modelCopy} from './model-copy.js';
import {createChatController} from './chat-controller.js';

const root=document.querySelector('#repair-helper');
if(root){
 const lang=document.documentElement.lang.startsWith('zh')?'zh':document.documentElement.lang.startsWith('es')?'es':'en';
 const copy=locales[lang],mc=modelCopy[lang],mount=root.querySelector('[data-helper-mount]');
 const node=(tag,attributes={},text)=>{
  const element=document.createElement(tag);for(const [key,value]of Object.entries(attributes))element.setAttribute(key,String(value));
  if(text!==undefined)element.textContent=text;return element;
 };
 const button=(text,action,primary=false)=>{
  const element=node('button',{type:'button',class:primary?'button button-primary':'rh-secondary'},text);
  element.addEventListener('click',action);return element;
 };
 const transcript=node('div',{class:'rh-chat-transcript','data-chat-transcript':'',role:'log','aria-live':'polite','aria-label':copy.ui.title});
 const status=node('p',{role:'status','data-model-status':'',class:'rh-small'},mc.off);
 const progress=node('progress',{max:'1',value:'0','aria-label':mc.loading});progress.hidden=true;
 const thinking=node('p',{role:'status',class:'rh-small'},mc.thinking);thinking.hidden=true;
 const input=node('textarea',{id:'rh-reply',rows:'3',maxlength:'1000',placeholder:copy.ui.replyPlaceholder});
 const welcome=node('div',{class:'rh-welcome'});
 welcome.append(node('span',{class:'rh-avatar','aria-hidden':'true'},'N'),node('h3',{},copy.ui.title),node('p',{},copy.conversation.welcome));
 transcript.append(welcome);
 let rendered=0;
 const controller=createChatController({locale:lang,copy,onChange:snapshot=>{
  if(snapshot.messages.length<rendered){transcript.replaceChildren(welcome);rendered=0;}
  welcome.hidden=snapshot.messages.length>0;suggestions.hidden=snapshot.messages.length>0;
  for(const item of snapshot.messages.slice(rendered)){
   const bubble=node('div',{class:`rh-message rh-${item.role}${item.kind==='safety'?' rh-safety':''}`});
   bubble.append(node('span',{class:'rh-sender'},item.role==='user'?({en:'You',es:'Usted',zh:'您'})[lang]:'Napa Auto Repair'));
   if(item.kind==='model')bubble.append(node('strong',{class:'rh-small'},mc.label));
   bubble.append(node('p',{},item.content));transcript.append(bubble);
  }
  rendered=snapshot.messages.length;transcript.scrollTop=transcript.scrollHeight;
  status.textContent=mc[snapshot.modelStatus]||mc.off;
  if(snapshot.modelStatus==='loading')status.textContent+=` · ${Math.round(snapshot.progress*100)}%`;
  progress.hidden=snapshot.modelStatus!=='loading';progress.value=snapshot.progress;
  enable.disabled=['loading','ready'].includes(snapshot.modelStatus);
  thinking.hidden=!snapshot.generating;
  stop.hidden=!snapshot.generating;
  followups.replaceChildren(...snapshot.suggestedReplies.map(reply=>button(reply.text,()=>{void controller.send(reply.text);input.focus();})));
 }});
 const enable=button(mc.enable,()=>controller.enableModel());enable.dataset.enableModel='';
 const stop=button(mc.stop,()=>controller.stop());stop.hidden=true;stop.dataset.stopGeneration='';
 const modelPanel=node('details',{class:'rh-model-panel'});
 modelPanel.append(node('summary',{},mc.title),node('p',{class:'rh-small'},mc.disclosure),enable,status,progress);
 const send=()=>{const text=input.value.trim();if(!text)return;input.value='';void controller.send(text);input.focus();};
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send();}});
 const suggestions=node('div',{class:'rh-suggestions'});
 const followups=node('div',{class:'rh-followups',role:'group','aria-label':copy.ui.shortcuts});
 for(const prompt of mc.examples)suggestions.append(button(prompt,()=>{void controller.send(prompt);input.focus();}));
 const controls=node('div',{class:'rh-controls'});
 const call=node('a',{class:'rh-chat-call',href:'tel:+19084166132'},copy.ui.call);
 const reset=button(mc.reset,()=>{controller.reset();input.value='';input.focus();});reset.dataset.resetChat='';
 const header=node('div',{class:'rh-chat-header'});
 const identity=node('div',{class:'rh-chat-identity'});identity.append(node('span',{class:'rh-avatar','aria-hidden':'true'},'N'),node('strong',{},copy.ui.title));
 header.append(identity,reset);
 const composer=node('div',{class:'rh-composer'});
 const label=node('label',{for:'rh-reply',class:'rh-sr-only'},mc.send);
 const sendButton=button('↑',send,true);sendButton.classList.add('rh-send');sendButton.setAttribute('aria-label',mc.send);
 composer.append(label,input,sendButton);
 controls.append(call);
 mount.classList.add('rh-chat-window');
 mount.replaceChildren(header,modelPanel,transcript,suggestions,followups,thinking,stop,composer,controls);
 const mapping=['lights','maintenance','brakes','engine','steering','climate'];
 document.querySelectorAll('.service-card').forEach((card,index)=>{
  const details=card.querySelector('.service-detail');if(!details)return;
  let link=details.querySelector('[data-helper-topic]');
  if(!link){link=node('a',{href:'#repair-helper','data-helper-topic':mapping[index],class:'rh-entry'},copy.ui.serviceLink);details.append(link);}
  link.addEventListener('click',()=>{input.value=copy.topics[mapping[index]]||'';input.focus();});
 });
}
