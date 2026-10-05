import { locales } from './locales.js';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
// Deliberately bounded interpretation: ambiguous wording asks for clarification.
const patterns={
 safety:{fire:/flames|on fire|llamas|着火/,control:/cannot (?:stop|steer)|brakes fail|no puedo frenar|失灵/,smoke:/smoke|humo|冒烟/,fuel:/fuel|gasoline|gasolina|汽油/},
 timing:{past:/yesterday|earlier|not now|ayer|antes|昨天|之前/,now:/now|today|currently|ahora|hoy|现在|今天/},
 brakes:{vibrate:/shak|vibrat|tiemb|抖|震/,pedal:/soft|floor|bland|软|到底/,failure:/not working|fail|no funcionan|失灵/,grind:/grind|metal|磨/,squeal:/squeal|squeak|chirr|rechin|尖叫/},
 tires:{flat:/flat|pinchad|爆胎/,damage:/bulge|cord|bulto|鼓包|露线/,pressure:/pressure|presion|胎压/,speed:/speed|highway|velocidad|高速/,wear:/wear|desgast|磨损/},
 steering:{loss:/cannot steer|locked|no puedo girar|失灵/,unstable:/unstable|inestable|不稳/,pull:/pull|desvia|跑偏/,clunk:/clunk|bump|golpe|颠簸/},
 start:{click:/click|clic|咔哒/,slow:/slow|lento|缓慢/,silent:/silent|nothing|nada|无反应/,crank:/crank.*(?:normal|but)|normal.*crank|gira.*normal|转动正常/,intermittent:/sometimes|intermittent|a veces|间歇/},
 engine:{idle:/idle|ralenti|怠速/,stall:/stall|apaga|熄火/,power:/power|potencia|动力/,shift:/shift|transmission|cambio|变速|顿挫/},
 heat:{hot:/overheat|hot|temperature|sobrecalienta|过热|高温/,steam:/steam|vapor|蒸汽/,loss:/loss|low coolant|perdida|减少/},
 lights:{oil:/oil pressure|presion de aceite|机油压力/,brake:/brake warning|luz.*freno|制动警告/,flash:/flash|parpade|闪/,steady:/steady|solid|fija|常亮/,battery:/battery|charging|bateria|电池|充电/,abs:/\babs\b/,airbag:/airbag|气囊/,reminder:/reminder|service|recordatorio|保养/},
 leaks:{large:/large|rapid|much|grande|大量/,fuel:/fuel|gasoline|gasolina|汽油/,water:/water|agua|清水/,small:/small|slow|drip|pequen|滴|少量/},
 smell:{fire:/fire|flame|fuego|着火/,smoke:/smoke|humo|烟/,fuel:/fuel|gasoline|gasolina|汽油/,burn:/burn|quemado|焦味/,exhaust:/exhaust|escape|尾气/},
 climate:{warm:/warm|not cold|caliente|no enfria|不冷/,heat:/no heat|heater|calefaccion|暖风/,fan:/weak|airflow|fan|poco aire|风量|风机/,fog:/fog|desempan|雾/},
 maintenance:{oil:/oil|aceite|机油/,inspect:/inspect|used car|inspeccion|检查/,trip:/trip|viaje|出行/,interval:/interval|schedule|programa|周期/},
 noise:{knock:/knock|golpeteo|敲击/,belt:/belt|correa|皮带/,wheel:/wheel|rueda|车轮/,exhaust:/exhaust|escape|排气/},
 startingClick:{rapid:/rapid|bunch|multiple|many|repeated|muchos|varios|连续/,single:/single|one|solo un|uno|一次|一声/,none:/no click|silent|sin clic|没有/},
 electricalClue:{dim:/dim|weak|tenue|debiles|变暗|暗淡/,normal:/normal|bright|brillante|正常/,dark:/dark|nothing|off|apagado|全黑|不亮/},
 vibrationWhen:{braking:/brak|fren|刹车/,speed:/speed|highway|velocidad|高速/,accel:/accel|aceler|加速/,idle:/idle|ralenti|怠速/},
 vibrationWhere:{steering:/steer|volante|方向盘/,pedal:/pedal|踏板/,seat:/seat|asiento|座椅/,whole:/whole|everywhere|todo|全车/},
 brakeTiming:{morning:/morning|first|manana|早晨|早上/,always:/always|every time|siempre|每次/,afterwork:/work|repair|service|reparacion|维修/},
 roughWhen:{idle:/idle|stopped|ralenti|怠速/,accel:/accel|aceler|加速/,all:/all|always|siempre|一直/},
 heatWhen:{idle:/idle|traffic|stopped|ralenti|trafico|怠速|堵车/,moving:/moving|highway|carretera|行驶|高速/,all:/all|always|siempre|一直/},
 airflow:{weak:/weak|little|debil|poco|小|弱/,normal:/normal|strong|fuerte|正常|强/,none:/none|no air|nothing|sin aire|没有|无风/},
 climatePattern:{idle:/idle|stopped|ralenti|停车|怠速/,always:/always|siempre|一直/,oneside:/one side|un lado|一侧/,intermittent:/sometimes|a veces|有时|间歇/},
 onset:{sudden:/sudden|de repente|突然/,gradual:/gradual|slowly|poco a poco|逐渐/,work:/repair|service|work|reparacion|维修/,impact:/impact|pothole|hit|bache|撞|坑/},
 frequency:{constant:/constant|always|siempre|一直/,sometimes:/sometimes|intermittent|a veces|有时/,cold:/cold|frio|冷/,hot:/hot|warm|caliente|热/},
 leakType:{oil:/oil|aceite|机油/,coolant:/coolant|refrigerante|冷却液/,water:/water|agua|水/,fuel:/fuel|gasoline|gasolina|汽油/},
 leakWhere:{front:/front|engine|delante|motor|前|发动机/,wheel:/wheel|rueda|轮/,middle:/middle|center|centro|中间/},
 coolantClue:{leak:/leak|loss|fuga|漏|减少/,none:/none|no leak|sin fuga|没有/,steam:/steam|vapor|蒸汽/},
 tireWear:{inside:/inside|one edge|interior|内侧/,bothEdges:/both|ambos|两侧/,center:/center|centro|中央/,patches:/patch|uneven|parches|斑|不规则/},
 steerWhen:{bumps:/bump|bache|颠簸/,turn:/turn|girar|转弯/,braking:/brak|fren|刹车/,straight:/straight|recto|直行/},
 smellWhere:{brakes:/brak|wheel|fren|rueda|刹车|车轮/,engine:/engine|hood|motor|发动机/,cabin:/cabin|inside|interior|车内/,ac:/a\/c|air condition|aire|空调/},
 noiseWhen:{turn:/turn|girar|转弯/,bumps:/bump|bache|颠簸/,speed:/speed|velocidad|速度/,start:/start|arranc|启动/},
 serviceHistory:{recent:/recent|just|reciente|刚|最近/,overdue:/overdue|never|vencido|从未|逾期/},
};
export function matchReply(question,raw){
 const text=normalize(raw.slice(0,1000));
 if(!text)return {answer:null};
 if(question!=='safety'&&/what.*(?:caus|problem)|why.*(?:happen|shake)|que.*(?:caus|problema)|什么原因|为什么/.test(text))return {answer:null,intent:'causes'};
 if(question!=='safety'&&/can i drive|safe to drive|puedo conducir|能.*开|驾驶安全/.test(text))return {answer:null,intent:'urgency'};
 for(const locale of Object.values(locales))for(const [id,label] of Object.entries(locale.questions[question]?.options||{}))if(normalize(label)===text)return {answer:id};
 if(/not sure|don.t know|unsure|no se|no estoy segur|不确定|不知道/.test(text))return {answer:'unknown'};
 if(question==='engineCode'){
  const codes=text.match(/p\d{4}/g)||[];
  const matches=[...new Set(codes.map(c=>/^p030[0-9]$/.test(c)?'misfire':/^p017[14]$/.test(c)?'lean':/^p04[23]0$/.test(c)?'catalyst':/^p04(?:4[0-9]|5[0-7])$/.test(c)?'evap':null).filter(Boolean))];
  return {answer:matches.length===1?matches[0]:/no code|no scanner|sin codigo|没有.*码/.test(text)?'none':null};
 }
 if(question==='safety'){
  if(/cannot (?:stop|steer)|can.t (?:stop|steer)|no puedo (?:frenar|girar)|失灵/.test(text))return {answer:'control'};
  if(/yesterday|earlier|used to|ayer|之前|昨天|not sure|maybe|perhaps|可能/.test(text))return {answer:null};
  const positive=text.split(/\bbut\b|\bpero\b|[,;.]|但是|但/).filter(s=>!/(?:\bno\b|\bnot\b|\bdon.t\b|\bsin\b|没有|不闻|没闻)/.test(s));
  const found=Object.entries(patterns.safety).find(([,re])=>positive.some(s=>re.test(s)));
  if(found)return {answer:found[0]};
  if(/none|no |not |sin |ningun|没有|都没有/.test(text))return {answer:'none'};
  return {answer:null};
 }
 if(/\b(?:not|don.t|sin)\b|没有/.test(text)&&!['startingClick','airflow','coolantClue','start','climate','timing'].includes(question))return {answer:null};
 const matches=Object.entries(patterns[question]||{}).filter(([,re])=>re.test(text)).map(([id])=>id);
 // Past timing often also says "not now"; explicit historical wording wins here.
 if(question==='timing'&&matches.includes('past'))return {answer:matches.includes('now')&&!/not now|no.*ahora|不是现在/.test(text)?'now':'past'};
 return {answer:matches.length===1?matches[0]:null};
}
