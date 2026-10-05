import { questions, rules, priority, topicPatterns, factPatterns } from './knowledge.js';

function normalize(text) {
 return String(text??'').slice(0,1000).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’‘]/g,"'");
}
function negated(clause,index,phrase) {
 if(/^(?:no start|no arranca|无法启动)/u.test(phrase))return false;
 const before=clause.slice(0,index);
 const prefixNegative=/(?:\bno|\bnot|\bwithout|\bsin|没有|沒有|无|無|未)(?:\s+[\p{L}]+){0,3}\s*$/u.test(before);
 // Failure phrases contain grammatical negation but assert an actual malfunction.
 const failure=/brakes? (?:not working|don.t work)|frenos? no funcionan|cannot steer|can.t steer/u.test(phrase);
 const embeddedNegative=/(?:\bnot\b|\bno\b|\bwithout\b|\bsin\b|没有|沒有|并非|並非|不曾)/u.test(phrase);
 return prefixNegative||(!failure&&embeddedNegative);
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
    let uncertain=/\b(?:maybe|might|possibly|perhaps|not sure|quizas|tal vez)\b|可能|不确定|不確定/u.test(clause);
    const past=/\b(?:yesterday|last week|previously|used to|ayer|antes)\b|昨天|之前|上周|上週/u.test(clause);
    const current=/\b(?:now|today|currently|ahora|hoy)\b|现在|現在|今天|目前/u.test(clause);
    if(question==='lights'&&answer==='oil'){
     const running=/engine (?:is )?running|while running|motor (?:encendido|en marcha)|发动机.*运转|發動機.*運轉/u.test(clause);
     const off=/engine (?:is )?off|motor apagado|发动机关闭|發動機關閉/u.test(clause);
     if(!running||off)uncertain=true;
    }
    facts.push({question,answer,uncertain,past,current}); topics.add(question);
   }
  }
 }
 return {topics:[...topics],facts};
}
export function assess({text='',topics=[],answers={}}={}) {
 const validAnswers=Object.fromEntries(Object.entries(answers).filter(([id,answer])=>questions[id]?.options.includes(answer)));
 const recognized=interpret(text);
 const selected=[...new Set([...recognized.topics,...topics])].filter(id=>questions[id]?.topic);
 const chosen={},origins={};
 for(const fact of recognized.facts){
  if(fact.uncertain)continue;
  const old=chosen[fact.question];
  const risk=rules[fact.question][fact.answer].level,oldRisk=old?rules[fact.question][old].level:-1;
  if(!old||risk>oldRisk||(risk===oldRisk&&origins[fact.question]?.past&&!fact.past)){chosen[fact.question]=fact.answer;origins[fact.question]=fact;}
 }
 // Explicit choices supersede recognition: they are the customer's confirmation.
 let conflict=false;
 for(const [id,answer] of Object.entries(validAnswers)){
  if(chosen[id]&&chosen[id]!==answer&&rules[id]?.[chosen[id]]?.level>=2)conflict=true;
  chosen[id]=answer;
 }
 const globalPast=chosen.timing==='past';
 const isPast=(id,fact=origins[id])=>id!=='safety'&&!fact?.current&&(globalPast||(!validAnswers[id]&&fact?.past));
 const historical=globalPast||recognized.facts.some(f=>f.past&&!validAnswers[f.question]);
 let level=0; const reasons=[],services=new Set(),pastReasons=new Set(); let emergency=false;
 for(const [id,answer] of Object.entries(chosen)){
  if(id!=='safety'&&(!questions[id]?.topic||!selected.includes(id)))continue;
  const rule=rules[id]?.[answer];
  if(!rule){level=Math.max(level,2);reasons.push('unknown');services.add('diagnostics');continue;}
  let risk=rule.level;
  // Safety asks about danger NOW; historical timing cannot cancel it.
  if(isPast(id)&&risk===3)risk=2;
  level=Math.max(level,risk);
  if(rule.service){services.add(rule.service);reasons.push(rule.reason);if(isPast(id))pastReasons.add(rule.reason);}
  if((id==='safety'||id==='smell')&&answer==='fire'&&risk===3)emergency=true;
 }
 if(conflict){
  level=Math.max(level,2);reasons.push('unknown');
  for(const fact of recognized.facts){
   if(!fact.uncertain&&validAnswers[fact.question]&&validAnswers[fact.question]!==fact.answer){
    const rule=rules[fact.question][fact.answer];
    level=Math.max(level,isPast(fact.question,fact)&&rule.level===3?2:rule.level);
    reasons.push(rule.reason);if(isPast(fact.question,fact))pastReasons.add(rule.reason);if(rule.service)services.add(rule.service);
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
 return {level,reasons:[...new Set(reasons)],pastReasons:[...pastReasons],services:[...services],questions:questionList,unknown,historical,emergency,conflict,topics:selected,unresolved};
}
