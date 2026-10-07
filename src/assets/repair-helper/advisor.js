const preparation={
 diagnostics:{checklist:['vehicle','timeline','warnings'],questions:['findings','nextStep']},
 brakes:{checklist:['when','recentWork','vehicle'],questions:['cause','safety']},
 engine:{checklist:['when','warnings','vehicle'],questions:['cause','nextStep']},
 suspension:{checklist:['when','roadConditions','vehicle'],questions:['cause','nextStep']},
 electrical:{checklist:['when','warnings','vehicle'],questions:['cause','nextStep']},
 maintenance:{checklist:['vehicle','history','schedule'],questions:['interval','findings']},
};

// This layer prepares a shop conversation; it never changes the engine's risk decision.
export function buildAdvisorBrief(result={}){
 if(result.emergency||result.level>=3)return {mode:'safety',service:null,checklist:[],questions:[],caution:result.emergency?'emergency':'assistance'};
 const service=result.unresolved?.length?'diagnostics':result.services?.[0]||'diagnostics';
 const detail=preparation[service]||preparation.diagnostics;
 return {mode:'prepare',service,checklist:detail.checklist,questions:detail.questions,caution:result.level>=2?'prompt':result.historical?'historical':null};
}
