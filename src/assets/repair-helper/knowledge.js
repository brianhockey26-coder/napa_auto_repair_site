// Stable IDs; translations never determine urgency. Levels: routine, soon, prompt, stop.
const data = {
 safety: {fire:[3,'diagnostics'],control:[3,'brakes'],smoke:[3,'diagnostics'],fuel:[3,'diagnostics'],none:[0,null],unknown:[2,'diagnostics']},
 timing: {now:[0,null],past:[0,null],unknown:[0,null]},
 onset: {sudden:[0,null],gradual:[0,null],work:[0,null],impact:[0,null]},
 frequency: {constant:[0,null],sometimes:[0,null],cold:[0,null],hot:[0,null]},
 brakes: {failure:[3,'brakes'],pedal:[3,'brakes'],grind:[2,'brakes'],squeal:[1,'brakes'],vibrate:[1,'brakes']},
 tires: {flat:[3,'brakes'],damage:[3,'brakes'],pressure:[2,'brakes'],speed:[1,'brakes'],wear:[1,'brakes']},
 steering: {loss:[3,'suspension'],unstable:[3,'suspension'],pull:[1,'suspension'],clunk:[1,'suspension']},
 lights: {oil:[3,'engine'],brake:[3,'brakes'],flash:[2,'diagnostics'],steady:[1,'diagnostics'],battery:[2,'electrical'],abs:[2,'brakes'],airbag:[2,'diagnostics'],reminder:[0,'maintenance']},
 heat: {hot:[3,'engine'],steam:[3,'engine'],loss:[2,'engine']},
 start: {click:[1,'electrical'],slow:[1,'electrical'],silent:[1,'electrical'],crank:[1,'diagnostics'],intermittent:[1,'diagnostics']},
 engine: {idle:[1,'engine'],stall:[2,'diagnostics'],power:[2,'diagnostics'],shift:[2,'diagnostics']},
 leaks: {large:[3,'engine'],fuel:[3,'diagnostics'],water:[0,'electrical'],small:[1,'diagnostics']},
 smell: {fire:[3,'diagnostics'],smoke:[3,'diagnostics'],fuel:[3,'diagnostics'],burn:[2,'diagnostics'],exhaust:[2,'diagnostics']},
 climate: {warm:[1,'electrical'],heat:[1,'electrical'],fan:[1,'electrical'],fog:[2,'electrical']},
 maintenance: {oil:[0,'maintenance'],inspect:[0,'diagnostics'],trip:[0,'maintenance'],interval:[0,'maintenance']},
 noise: {knock:[2,'engine'],belt:[1,'engine'],wheel:[2,'brakes'],exhaust:[1,'diagnostics']},
};
export const rules = Object.fromEntries(Object.entries(data).map(([q,items])=>[q,Object.fromEntries(Object.entries(items).map(([answer,[level,service]])=>[answer,{level,service,reason:`${q}.${answer}`}]))]));
export const questions = Object.fromEntries(Object.entries(data).map(([id,items])=>[id,{topic:['safety','timing','onset','frequency'].includes(id)?null:id,options:[...Object.keys(items),...(!('unknown' in items)?['unknown']:[])]}]));
export const priority = ['smell','heat','brakes','tires','steering','lights','leaks','engine','start','noise','climate','maintenance'];
export const topicPatterns = {
 brakes:/\bbrak(?:e|es|ing)\b|\bfrenos?\b|刹车|煞車|制动|制動/giu,
 tires:/\btire[sd]?\b|\btyres?\b|\bvibrat\w*\b|\bneumatic\w*\b|\bllantas?\b|\bvibra\w*\b|轮胎|輪胎|抖动|抖動/giu,
 steering:/\bsteer\w*\b|\bsuspension\b|\bpulling\b|\bclunk\w*\b|\bdireccion\b|方向盘|方向盤|转向|轉向|悬挂|懸掛|跑偏/giu,
 lights:/\bwarning\b|\bcheck.engine\b|\blight\b|\babs\b|\bairbag\b|\btestigo\b|\bluz\b|故障灯|故障燈|警告灯|警告燈|机油灯|機油燈|发动机灯|發動機燈/giu,
 heat:/\boverheat\w*\b|\bsteam\b|\bcoolant\b|\bsobrecalenta\w*\b|\bvapor\b|\brefrigerante\b|过热|過熱|水温|水溫|蒸汽|冷却液|冷卻液/giu,
 start:/\b(?:no|won.t|cannot|can.t).start\b|\bstart\w*\b|\bcrank\w*\b|\bbattery\b|\bclick\w*\b|\b(?:no )?arranca\w*\b|\bbateria\b|启动|啟動|打不着|打不著|电池|電池|电瓶|電瓶/giu,
 engine:/\brough\b|\bidle\b|\bstall\w*\b|\bpower.loss\b|\btransmission\b|\bshift\w*\b|\btirones\b|\bpotencia\b|怠速|熄火|动力|動力|变速|變速|发动机|發動機/giu,
 leaks:/\bleak\w*\b|\bpuddle\b|\bfuga\w*\b|\bcharco\b|漏油|漏水|泄漏|洩漏|渗漏|滲漏/giu,
 smell:/\bsmoke\b|\bsmell\b|\bfire\b|\bburning\b|\bhumo\b|\bolor\b|\bfuego\b|冒烟|冒煙|烟雾|煙霧|异味|異味|着火|著火|汽油味/giu,
 climate:/\ba\/c\b|\bac\b|\bair.condition\w*\b|\bheater\b|\bdefog\w*\b|\bclimate\b|\baire.acondicionado\b|\bcalefaccion\b|空调|空調|暖风|暖風|除雾|除霧/giu,
 maintenance:/\boil.change\b|\bmaintenance\b|\binspection\b|\broad.trip\b|\bmantenimiento\b|\bcambio.de.aceite\b|\binspeccion\b|保养|保養|换机油|換機油|检查|檢查/giu,
 noise:/\bnoise\b|\bknock\w*\b|\bbelt\b|\bexhaust\b|\bruido\b|\bcorrea\b|异响|異響|敲击|敲擊|皮带|皮帶|排气|排氣/giu,
};
export const factPatterns = [
 ['brakes','failure',/brakes? (?:not working|fail\w*|don.t work)|frenos? no funcionan|刹车失灵|煞車失靈/giu],
 ['brakes','pedal',/soft (?:brake )?pedal|pedal (?:to|on) (?:the )?floor|pedal (?:blando|al fondo)|踏板.*(?:软|軟|到底)/giu],
 ['brakes','grind',/brak\w*.*grind\w*|grind\w*.*brak\w*|frenos?.*metal|刹车.*磨|煞車.*磨/giu],
 ['brakes','squeal',/brak\w*.*squeal\w*|frenos?.*rechinan|刹车.*尖叫|煞車.*尖叫/giu],
 ['tires','damage',/tire.*bulge|tyre.*bulge|sidewall.*(?:bulge|damage)|neumatico.*bulto|轮胎.*鼓包|輪胎.*鼓包/giu],
 ['tires','flat',/flat tire|flat tyre|neumatico pinchado|llanta ponchada|爆胎/giu],
 ['steering','loss',/cannot steer|can.t steer|lost steering|steering.*(?:locked|not working)|no puedo girar|转向失灵|轉向失靈/giu],
 ['lights','oil',/oil pressure.*(?:light|warning)|low oil pressure|presion de aceite|机油压力|機油壓力/giu],
 ['lights','flash',/flash\w*.*(?:engine|light)|(?:engine|light).*flash\w*|motor.*parpadea|发动机灯.*闪|發動機燈.*閃/giu],
 ['lights','reminder',/oil.change reminder|oil.life|recordatorio.*aceite|机油保养提醒|機油保養提醒/giu],
 ['heat','hot',/overheat\w*|sobrecalenta\w*|过热|過熱|水温过高|水溫過高/giu],
 ['smell','fire',/on fire|flames|en llamas|着火|著火/giu],
 ['smell','smoke',/smoke|humo|冒烟|冒煙|烟雾|煙霧/giu],
 ['smell','fuel',/fuel smell|smell.*(?:fuel|gasoline)|olor.*gasolina|汽油味/giu],
 ['engine','stall',/stall\w*|se apaga|熄火/giu],
 ['engine','idle',/rough idle|ralenti irregular|怠速不稳|怠速不穩/giu],
];
