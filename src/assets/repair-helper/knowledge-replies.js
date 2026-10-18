// Retrieval from the same bundled, translated explanations used by the advisor.
// Educational questions never count as reports that a part has failed.
const subjects=[
 ['battery',/\bbatter(?:y|ies)\b|bateria|电池|电瓶/u],
 ['starter',/\bstarter\b|motor de arranque|启动机/u],
 ['charging',/alternator|alternador|charging system|发电机|充电系统/u],
 ['rotors',/\brotors?\b|brake disc|disco.*freno|刹车盘/u],
 ['brakePads',/brake pads?|pastillas|刹车片/u],
 ['brakeHydraulic',/brake fluid|hydraulic|liquido.*freno|制动液|液压/u],
 ['balance',/wheel balance|balanc(?:e|ing).*wheel|equilibr|balanceo|车轮平衡/u],
 ['alignment',/alignment|alineacion|车轮定位|四轮定位/u],
 ['suspensionWear',/suspension|shocks?|struts?|amortiguador|悬挂|减振/u],
 ['pressure',/tire pressure|presion.*neumatic|胎压/u],
 ['bentWheel',/bent wheel|rueda doblada|轮毂变形/u],
 ['tireDamage',/tire bulge|tire cords|bulto.*neumatic|轮胎鼓包/u],
 ['misfire',/misfire|fallo.*encendido|失火/u],
 ['airLeak',/lean mixture|air leak|vacuum leak|mezcla pobre|fuga.*admision|混合气|进气泄漏/u],
 ['catalyst',/cataly(?:tic|st)|catalizador|催化/u],
 ['evap',/\bevap\b|evaporative|fuel.vapor|evaporativ|蒸发排放/u],
 ['coolingFan',/cooling fan|radiator fan|ventilador.*radiador|冷却风扇/u],
 ['coolantFlow',/thermostat|water pump|termostato|bomba de agua|节温器|水泵/u],
 ['coolantLeak',/coolant leak|fuga.*refrigerante|冷却液泄漏/u],
 ['oilLeak',/oil leak|fuga.*aceite|漏油/u],
 ['condensation',/condensation|condensacion|冷凝水/u],
 ['refrigerant',/refrigerant|refrigerante.*aire|制冷剂/u],
 ['cabinFilter',/cabin.*filter|filtro.*cabina|空调滤芯/u],
 ['blower',/blower|ventilador.*cabina|鼓风机|风机/u],
 ['blendDoor',/blend door|compuerta|混风门/u],
 ['wheelBearing',/wheel bearing|rodamiento|车轮轴承/u],
 ['beltDrive',/belt tensioner|drive belt|serpentine|correa|皮带/u],
 ['exhaustLeak',/exhaust leak|heat shield|fuga.*escape|排气泄漏|隔热板/u],
];
const educational=/\b(?:what (?:is|are|does)|how (?:does|do)|explain|difference|meaning)\b|que (?:es|son|hace)|como (?:funciona|se)|explic|diferencia|什么是|是什么意思|解释|区别|怎么.*(?:工作|检查)|如何.*(?:工作|检查)/u;
export function isEducationalOnly(raw){
 const text=String(raw).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 if(/[?？]\s*\S/u.test(text)||/\b(?:my|our|mine|mi|nuestro)\b|我的|我家/u.test(text))return false;
 if(/\b(?:the|this|el|este)\s+(?:car|vehicle|engine|coche|auto|motor)\b[^?？]*\b(?:click\w*|won.t|will not|does not|no arranca|vibrat\w*|smell\w*|stall\w*)/u.test(text))return false;
 return /^(?:¿?\s*(?:what|how|explain|please explain|can you explain|could you explain|que|como|explica)|什么|解释|怎么|如何|请解释)/u.test(text);
}
export function lookupRepairExplanation(raw,copy,possibilities=[]){
 const text=String(raw).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(!educational.test(text))return null;
 let ids=subjects.filter(([,pattern])=>pattern.test(text)).map(([id])=>id).slice(0,2);
 if(!ids.length&&/what does (?:that|this) mean|explain (?:that|this)|que significa eso|什么意思|解释一下/u.test(text))ids=possibilities.slice(0,1).map(p=>p.id);
 ids=ids.filter(id=>copy.causes[id]);if(!ids.length)return null;
 return {ids,content:ids.map(id=>{const c=copy.causes[id];return `${c.title}\n${c.explain}\n\n${copy.ui.check}: ${c.check}`;}).join('\n\n')};
}
