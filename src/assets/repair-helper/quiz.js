const t=(en,es,zh)=>[en,es,zh];
const q=(owner,title,options)=>({owner,title,options});
export const MAX_QUESTIONS=14;
export const detailedQuiz={
 brakeTiming:q('brakes',t('When is the brake noise most noticeable?','¿Cuándo se nota más el ruido de frenos?','刹车异响何时最明显？'),{
  morning:t('First few stops after rain or overnight','Primeras frenadas tras lluvia o una noche parado','雨后或停放一夜后的前几次刹车'),always:t('Most times I brake','Casi siempre al frenar','大多数刹车时都有'),afterwork:t('Since a recent brake service','Desde un servicio reciente de frenos','近期刹车维修后出现')}),
 vibrationWhen:q('tires',t('When does the shaking happen?','¿Cuándo ocurre la vibración?','抖动何时发生？'),{
  braking:t('Only while braking','Solo al frenar','仅刹车时'),speed:t('At a certain road speed, even without braking','A cierta velocidad, incluso sin frenar','达到某个车速时，不刹车也抖'),accel:t('Mostly under acceleration','Principalmente al acelerar','主要加速时'),idle:t('While stopped with the engine running','Detenido con el motor encendido','停车且发动机运转时')}),
 vibrationWhere:q('tires',t('Where do you feel the vibration most?','¿Dónde notas más la vibración?','哪里抖动最明显？'),{
  steering:t('Steering wheel','Volante','方向盘'),pedal:t('Brake pedal','Pedal de freno','刹车踏板'),seat:t('Seat or floor','Asiento o piso','座椅或地板'),whole:t('Whole vehicle','Todo el vehículo','整辆车')}),
 tireWear:q('tires',t('What uneven wear have you already noticed?','¿Qué desgaste irregular has observado?','您已观察到哪种轮胎磨损？'),{
  inside:t('One edge of the tread','Un borde de la banda','胎面一侧磨损'),bothEdges:t('Both edges more than the center','Ambos bordes más que el centro','两侧比中间磨损更多'),center:t('Center more than the edges','Centro más que los bordes','中间比两侧磨损更多'),patches:t('Cupped or patchy wear','Desgaste ahuecado o por parches','凹凸或斑块状磨损')}),
 steerWhen:q('steering',t('When do you notice pulling or clunking?','¿Cuándo notas desvío o golpes?','何时跑偏或出现撞击声？'),{
  bumps:t('Over bumps','En baches','经过颠簸时'),turn:t('When turning','Al girar','转弯时'),braking:t('When braking','Al frenar','刹车时'),straight:t('Driving straight','Conduciendo recto','直行时')}),
 startingClick:q('start',t('What does the clicking sound like?','¿Cómo es el clic?','咔哒声是什么样的？'),{
  rapid:t('Several rapid clicks','Varios clics rápidos','连续快速咔哒声'),single:t('One solid click','Un solo clic fuerte','单次明显咔哒声'),none:t('No clicking','No hay clics','没有咔哒声')}),
 electricalClue:q('start',t('What happens to the dash lights during the attempt?','¿Qué pasa con las luces del tablero al intentar?','尝试启动时仪表灯有什么变化？'),{
  dim:t('They dim strongly','Se atenúan mucho','明显变暗'),normal:t('They stay about normal','Se mantienen normales','基本正常'),dark:t('They are dark or go out','Están apagadas o se apagan','不亮或熄灭')}),
 engineCode:q('lights',t('Do you already have a diagnostic trouble code?','¿Ya tienes un código de diagnóstico?','是否已有故障码？'),{
  misfire:t('P0300–P0308: misfire code','P0300–P0308: fallo de encendido','P0300–P0308：失火代码'),lean:t('P0171 / P0174: lean mixture','P0171 / P0174: mezcla pobre','P0171 / P0174：混合气过稀'),catalyst:t('P0420 / P0430: catalyst efficiency','P0420 / P0430: eficiencia del catalizador','P0420 / P0430：催化效率'),evap:t('P0440–P0457: evaporative emissions','P0440–P0457: emisiones evaporativas','P0440–P0457：燃油蒸发排放'),none:t('No code read yet / a different code','No se ha leído / otro código','尚未读取或其他代码')}),
 roughWhen:q('engine',t('When is the rough running or shaking strongest?','¿Cuándo es más fuerte la marcha irregular?','运行不稳或抖动何时最明显？'),{
  idle:t('At idle, less noticeable with more engine speed','Al ralentí, menos al subir revoluciones','怠速时明显，转速提高后减轻'),accel:t('Under acceleration','Al acelerar','加速时'),all:t('Both idle and driving','Al ralentí y conduciendo','怠速和行驶时都明显')}),
 heatWhen:q('heat',t('When has the temperature tended to rise?','¿Cuándo suele subir la temperatura?','温度通常何时升高？'),{
  idle:t('In traffic or idling','En tráfico o al ralentí','堵车或怠速时'),moving:t('At road speed or on hills','A velocidad o en pendientes','正常行驶或爬坡时'),all:t('In either situation','En ambas situaciones','两种情况都会')}),
 coolantClue:q('heat',t('What cooling-system clues have you already seen? Do not open a hot coolant cap.','¿Qué señales ya has visto? No abras la tapa del refrigerante caliente.','您已看到哪些冷却系统迹象？请勿打开热的冷却液盖。'),{
  leak:t('Visible leak or repeated coolant loss','Fuga visible o pérdida repetida','明显泄漏或冷却液反复减少'),none:t('No visible leak noticed','No he visto fugas','未发现明显泄漏'),steam:t('Steam while the engine was hot','Vapor con el motor caliente','发动机高温时冒蒸汽')}),
 leakType:q('leaks',t('From what you already noticed, what does the liquid resemble? Do not touch or taste it.','¿A qué se parece el líquido observado? No lo toques ni pruebes.','根据已观察到的情况，液体像哪一种？请勿触摸或品尝。'),{
  oil:t('Oily residue','Residuo aceitoso','油状残留'),coolant:t('Colored watery fluid, possibly coolant','Líquido acuoso de color, quizá refrigerante','有色水状液体，可能是冷却液'),water:t('Clear, odorless water','Agua clara sin olor','清澈无味的水'),fuel:t('Strong gasoline or diesel smell','Olor fuerte a gasolina o diésel','强烈汽油或柴油味')}),
 leakWhere:q('leaks',t('Where did you notice the drip?','¿Dónde viste el goteo?','哪里发现滴漏？'),{
  front:t('Under the engine / front','Bajo el motor / delante','发动机下方或车头'),wheel:t('Near a wheel','Cerca de una rueda','车轮附近'),middle:t('Middle or rear of the vehicle','Centro o parte trasera','车辆中部或后部')}),
 airflow:q('climate',t('How much air comes out of the vents?','¿Cuánto aire sale de las rejillas?','出风口风量如何？'),{
  weak:t('Weak airflow','Poco flujo de aire','风量较小'),normal:t('Normal airflow, wrong temperature','Flujo normal, temperatura incorrecta','风量正常但温度不对'),none:t('No airflow','No sale aire','没有风')}),
 climatePattern:q('climate',t('Which pattern fits the temperature problem?','¿Qué patrón coincide con la temperatura?','温度异常符合哪种情况？'),{
  idle:t('A/C warmer at idle, cooler while moving','Aire más caliente parado, más frío en marcha','停车时空调较热，行驶时较冷'),always:t('Same problem all the time','Siempre igual','一直异常'),oneside:t('One side differs from the other','Un lado difiere del otro','左右两侧温度不同'),intermittent:t('Works, then stops cooling / heating','Funciona y luego deja de enfriar / calentar','有时正常，有时不制冷或不制热')}),
 smellWhere:q('smell',t('Where or when was the smell noticeable?','¿Dónde o cuándo notaste el olor?','异味从哪里发出或何时出现？'),{
  brakes:t('Near a wheel after braking','Cerca de una rueda después de frenar','刹车后车轮附近'),engine:t('From the engine area','Del área del motor','发动机区域'),cabin:t('Inside the cabin','Dentro de la cabina','车内'),ac:t('Only when A/C or fan runs','Solo con aire o ventilador','仅空调或风机运行时')}),
 noiseWhen:q('noise',t('When is the noise most noticeable?','¿Cuándo se nota más el ruido?','异响何时最明显？'),{
  turn:t('While turning','Al girar','转弯时'),bumps:t('Over bumps','En baches','经过颠簸时'),speed:t('Changes with road speed','Cambia con la velocidad','随车速变化'),start:t('At startup or with engine speed','Al arrancar o cambia con revoluciones','启动时或随发动机转速变化')}),
 serviceHistory:q('maintenance',t('What do you know about the service history?','¿Qué sabes del historial de servicio?','您了解哪些保养记录？'),{
  recent:t('Recent documented service','Servicio reciente documentado','近期有保养记录'),overdue:t('Some services may be overdue','Puede haber servicios atrasados','部分保养可能已逾期')}),
};
export function branchQuestions(a,topics){
 const result=[];
 const add=(...ids)=>result.push(...ids);
 if(topics.includes('brakes')){
  if(['squeal','grind'].includes(a.brakes))add('brakeTiming');
  if(a.brakes==='vibrate')add('vibrationWhen','vibrationWhere');
 }
 if(topics.includes('tires')){
  if(a.tires==='speed')add('vibrationWhen','vibrationWhere');
  if(a.tires==='wear')add('tireWear');
 }
 if(topics.includes('steering')&&a.steering&&a.steering!=='unknown')add('steerWhen');
 if(topics.includes('start')){
  if(['click','silent','slow'].includes(a.start))add(...(a.start==='click'?['startingClick']:[]),'electricalClue');
  if(a.start==='crank')add('engineCode');
 }
 if(topics.includes('lights')&&['steady','flash'].includes(a.lights))add('engineCode');
 if(topics.includes('engine')&&a.engine&&a.engine!=='unknown')add('roughWhen','engineCode');
 if(topics.includes('heat')&&a.heat&&a.heat!=='unknown')add('heatWhen','coolantClue');
 if(topics.includes('leaks')&&a.leaks&&a.leaks!=='unknown')add('leakType','leakWhere');
 if(topics.includes('climate')&&a.climate&&a.climate!=='unknown')add('airflow','climatePattern');
 if(topics.includes('smell')&&a.smell&&a.smell!=='unknown')add('smellWhere');
 if(topics.includes('noise')&&a.noise&&a.noise!=='unknown')add('noiseWhen');
 if(topics.includes('maintenance')&&a.maintenance&&a.maintenance!=='unknown')add('serviceHistory');
 return [...new Set(result)];
}
