import {createConversationState,replyToMessage} from './conversation.js';
import {createLocalModel} from './local-model.js';

export function createChatController({locale='en',copy,loadModel=createLocalModel,onChange=()=>{}}){
 let conversation=createConversationState(locale),messages=[],model=null,modelStatus='off',progress=0,generating=false,assessment=null;
 let token=0,queue=Promise.resolve(),disposed=false;
 const snapshot=()=>({conversation,messages:[...messages],modelStatus,progress,generating,assessment});
 const emit=()=>{if(!disposed)onChange(snapshot());};
 const localize=key=>copy.conversation.responses[key]||(key.startsWith('reason.')?copy.reasons[key.slice(7)]:null)||(key.startsWith('question.')?copy.questions[key.slice(9)]?.title:null)||'';
 function invalidate(){token++;if(generating)model?.interrupt();generating=false;}
 return {
  snapshot,
  async enableModel(){
   if(disposed||modelStatus==='loading'||modelStatus==='ready')return;
   if(model){await model.dispose?.();model=null;}
   modelStatus='loading';progress=0;emit();
   try{
    const loaded=await loadModel({onProgress:value=>{progress=value;emit();}});
    if(disposed){await loaded.dispose?.();return;}
    model=loaded;modelStatus='ready';
   }catch(error){modelStatus=error.name==='QuotaExceededError'||/quota/i.test(error.message)?'storage':/WebGPU unavailable/.test(error.message)?'unavailable':'error';}
   emit();
  },
  async send(raw){
   const text=String(raw??'').trim().slice(0,1000);if(!text||disposed)return;
   invalidate();const ownToken=token;
   const turn=replyToMessage(conversation,text,copy);conversation=turn.state;assessment=turn.result;
   let guidance=turn.messageKeys.map(localize).filter(Boolean).join('\n\n');
   if(turn.kind==='summary'){
    const recorded=messages.filter(m=>m.role==='user').map(m=>m.content).slice(-8);
    guidance=[copy.ui.summary,conversation.vehicle,...recorded,...turn.brief.checklist.map(item=>copy.advisor.checklistItems[item])].filter(Boolean).join('\n');
   }
   // The urgency is always visible independently of generated text.
   if(!guidance.includes(copy.ui.actions[assessment.level]))guidance+='\n\n'+copy.ui.actions[assessment.level];
   if(assessment.emergency)guidance+='\n\n'+copy.ui.emergency;
   for(const possibility of assessment.possibilities.slice(0,2)){
    const cause=copy.causes[possibility.id];if(cause)guidance+=`\n\n${cause.title}: ${cause.explain}\n${cause.check}`;
   }
   messages.push({role:'user',content:text},{role:'assistant',content:guidance,kind:turn.kind==='safety'?'safety':'advisor'});
   emit();
   if(turn.kind==='summary'||!model||modelStatus!=='ready'||(assessment.level>=3&&!assessment.historical))return;
   const context={locale,vehicle:conversation.vehicle,messages:messages.slice(0,-1).map(({role,content})=>({role,content})),assessment,guidance};
   generating=true;emit();
   // Serialize GPU work; newer input invalidates any older completion.
   const task=queue.catch(()=>{}).then(async()=>{
    if(ownToken!==token||disposed)return;
    try{
     const content=await model.reply(context);
     if(ownToken===token&&!disposed)messages.push({role:'assistant',kind:'model',content});
    }catch{
     if(ownToken===token&&!disposed)modelStatus='error';
    }finally{if(ownToken===token){generating=false;emit();}}
   });
   queue=task;await task;
  },
  reset(){invalidate();conversation=createConversationState(locale);messages=[];assessment=null;emit();},
  async dispose(){disposed=true;invalidate();await queue.catch(()=>{});await model?.dispose?.();}
 };
}
