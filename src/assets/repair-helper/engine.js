import { questions, rules, priority, topicPatterns, factPatterns } from './knowledge.js';

function normalize(text) {
 return String(text??'').slice(0,1000).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’‘]/g,"'");
}
function negated(clause,index,phrase) {
 if(/^(?:no start|no arranca|无法启动)/u.test(phrase))return false;
 const before=clause.slice(0,index);
 return /(?:\bno|\bnot|\bwithout|\bsin|没有|沒有|无|無|未)(?:\s+[\p{L}]+){0,3}\s*$/u.test(before);
}
export function interpret(text='') {
 const clauses=normalize(text).split(/[,.!?;\n，。；！？]|\b(?:but|and|pero|y)\b|但是|而且/gu);
 const topics=new Set(), facts=[];
 for(const clause of clauses){
  for(const [topic,pattern] of Object.entries(topicPatterns)){
   for(const match of clause.matchAll(pattern))if(!negated(clause,match.index,match[0]))topics.add(topic);
  }
  for(const [question,answer,pattern] of factPatterns){
   for(const match of clause.matchAll(pattern)){
    if(negated(clause,match.index,match[0]))continue;
    const uncertain=/\b(?:maybe|might|possibly|perhaps|not sure|quizas|tal vez)\b|可能|不确定|不確定/u.test(clause);
    const past=/\b(?:yesterday|last week|previously|used to|ayer|antes)\b|昨天|之前|上周|上週/u.test(clause);
    facts.push({question,answer,uncertain,past}); topics.add(question);
   }
  }
 }
 return {topics:[...topics],facts};
}
export function assess({text='',topics=[],answers={}}={}) {
 const validAnswers=Object.fromEntries(Object.entries(answers).filter(([id,answer])=>questions[id]?.options.includes(answer)));
 const recognized=interpret(text);
 const selected=[...new Set([...recognized.topics,...topics])].filter(id=>questions[id]?.topic);
 const chosen={};
 for(const fact of recognized.facts){
  if(fact.uncertain)continue;
  const old=chosen[fact.question];
  if(!old||rules[fact.question][fact.answer].level>rules[fact.question][old].level)chosen[fact.question]=fact.answer;
 }
 // Explicit choices supersede recognition: they are the customer's confirmation.
 let conflict=false;
 for(const [id,answer] of Object.entries(validAnswers)){
  if(chosen[id]&&chosen[id]!==answer&&rules[id]?.[chosen[id]]?.level>=2)conflict=true;
  chosen[id]=answer;
 }
 const historical=chosen.timing==='past'||(!chosen.timing&&recognized.facts.length>0&&recognized.facts.every(f=>f.past));
 let level=0; const reasons=[],services=new Set(); let emergency=false;
 for(const [id,answer] of Object.entries(chosen)){
  if(id!=='safety'&&(!questions[id]?.topic||!selected.includes(id)))continue;
  const rule=rules[id]?.[answer];
  if(!rule){level=Math.max(level,2);reasons.push('unknown');services.add('diagnostics');continue;}
  let risk=rule.level;
  // Safety asks about danger NOW; historical timing cannot cancel it.
  if(historical&&id!=='safety'&&risk===3)risk=2;
  level=Math.max(level,risk);
  if(rule.service){services.add(rule.service);reasons.push(rule.reason);}
  if((id==='safety'||id==='smell')&&answer==='fire'&&risk===3)emergency=true;
 }
 if(conflict){
  level=Math.max(level,2);reasons.push('unknown');
  for(const fact of recognized.facts){
   if(!fact.uncertain&&validAnswers[fact.question]&&validAnswers[fact.question]!==fact.answer){
    const rule=rules[fact.question][fact.answer];
    level=Math.max(level,historical&&rule.level===3?2:rule.level);
    reasons.push(rule.reason);if(rule.service)services.add(rule.service);
   }
  }
 }
 const sorted=priority.filter(id=>selected.includes(id));
 const followups=[];
 if(selected.some(id=>['brakes','tires','steering','noise'].includes(id)))followups.push('onset');
 if(selected.some(id=>['start','engine','climate'].includes(id)))followups.push('frequency');
 const pending=['safety','timing',...sorted,...followups].filter(id=>!Object.hasOwn(validAnswers,id));
 const questionList=pending.slice(0,Math.max(0,6-Object.keys(validAnswers).length));
 const unresolved=selected.filter(id=>!chosen[id]||chosen[id]==='unknown');
 if(unresolved.length||recognized.facts.some(f=>f.uncertain&&!validAnswers[f.question])){
  level=Math.max(level,2);if(!reasons.includes('unknown'))reasons.push('unknown');services.add('diagnostics');
 }
 const unknown=selected.length===0;
 if(unknown){level=Math.max(level,2);if(!reasons.includes('unknown'))reasons.push('unknown');services.add('diagnostics');}
 if(!reasons.length)reasons.push('unknown');
 return {level,reasons:[...new Set(reasons)],services:[...services],questions:questionList,unknown,historical,emergency,conflict,topics:selected,unresolved};
}
