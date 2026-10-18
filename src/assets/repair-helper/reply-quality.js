// Lightweight checks catch specific known bad outputs; they are not a diagnosis validator.
export function cleanModelReply(raw){
 const text=String(raw??'').trim(),seen=new Set();let changed=false;
 const sentences=text.match(/[^.!?。！？\n]+[.!?。！？]?/gu)||[];
 const unique=sentences.filter(sentence=>{
  const key=sentence.trim().toLowerCase();if(key.length<12)return true;
  if(seen.has(key)){changed=true;return false;}seen.add(key);return true;
 });
 return changed?unique.map(s=>s.trim()).join('\n'):text;
}
export function isUsableModelReply(raw){
 const text=String(raw??'').trim();if(!text||text.length>4000)return false;
 if(/\b(?:it is|it's|you are|you're) (?:perfectly |completely )?safe to drive|\byou (?:definitely|certainly) need|\bguaranteed (?:fix|repair)|puede[sn]? conducir sin riesgo|puedes conducir sin riesgo|可以放心.*驾驶|肯定.*(?:坏了|更换)/iu.test(text))return false;
 const sentences=text.toLowerCase().split(/[.!?。！？\n]+/u).map(s=>s.trim()).filter(s=>s.length>12);
 const seen=new Set();for(const sentence of sentences){if(seen.has(sentence))return false;seen.add(sentence);}
 return true;
}
