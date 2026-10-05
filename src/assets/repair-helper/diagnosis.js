// A shortlist of inspection hypotheses, never a repair verdict or probability.
const cases=[
 ['fuelLeak',['leaks=fuel','smell=fuel','leakType=fuel'],[]],
 ['rotors',['brakes=vibrate','vibrationWhen=braking'],['vibrationWhere=steering','vibrationWhere=pedal']],
 ['brakePads',['brakes=grind','brakes=squeal'],['brakeTiming=always']],
 ['brakeSurface',['brakes=squeal'],['brakeTiming=morning','brakeTiming=afterwork']],
 ['brakeHydraulic',['brakes=pedal','brakes=failure'],[]],
 ['balance',['tires=speed'],['vibrationWhen=speed','onset=work']],
 ['bentWheel',['tires=speed'],['onset=impact']],
 ['alignment',['tires=wear','steering=pull'],['tireWear=inside','steerWhen=straight']],
 ['pressure',['tires=pressure','tires=wear'],['tireWear=bothEdges','tireWear=center']],
 ['tireDamage',['tires=damage','tires=flat'],[]],
 ['suspensionWear',['steering=clunk','steering=unstable','tires=wear'],['steerWhen=bumps','tireWear=patches']],
 ['brakeDrag',['steering=pull','smell=burn'],['steerWhen=braking','smellWhere=brakes']],
 ['battery',['start=click','start=slow','start=silent'],['startingClick=rapid','electricalClue=dim','electricalClue=dark']],
 ['starter',['start=click','start=silent'],['startingClick=single','electricalClue=normal']],
 ['fuelIgnition',['start=crank','engine=stall'],[]],
 ['misfire',['engine=idle','engine=power','lights=flash','start=crank'],['engineCode=misfire','roughWhen=accel']],
 ['airLeak',['engine=idle','lights=steady'],['engineCode=lean','roughWhen=idle']],
 ['catalyst',['lights=steady'],['engineCode=catalyst']],
 ['evap',['lights=steady'],['engineCode=evap']],
 ['charging',['lights=battery'],[]],
 ['coolingFan',['heat=hot','heat=steam','climate=warm'],['heatWhen=idle','climatePattern=idle']],
 ['coolantLeak',['heat=loss','heat=hot','leaks=small','leaks=large'],['coolantClue=leak','leakType=coolant']],
 ['coolantFlow',['heat=hot','heat=steam'],['heatWhen=moving','heatWhen=all']],
 ['oilLeak',['leaks=small','leaks=large'],['leakType=oil','leakWhere=front']],
 ['condensation',['leaks=water'],['leakType=water']],
 ['refrigerant',['climate=warm'],['airflow=normal','climatePattern=always']],
 ['cabinFilter',['climate=fan'],['airflow=weak']],
 ['blower',['climate=fan'],['airflow=none']],
 ['blendDoor',['climate=heat','climate=warm'],['climatePattern=oneside']],
 ['wheelBearing',['noise=wheel','tires=speed'],['noiseWhen=speed','noiseWhen=turn']],
 ['beltDrive',['noise=belt'],['noiseWhen=start']],
 ['exhaustLeak',['noise=exhaust','smell=exhaust'],[]],
];
const needsDetail=new Set(['catalyst','evap','oilLeak','brakeDrag','coolingFan','wheelBearing','blendDoor']);
function matches(token,answers){const [q,a]=token.split('=');return answers[q]===a;}
export function possibleProblems(answers){
 return cases.flatMap(([id,anchors,support])=>{
  if(['oilLeak','coolantLeak','condensation'].includes(id)&&answers.leakType&&!['unknown',id==='oilLeak'?'oil':id==='coolantLeak'?'coolant':'water'].includes(answers.leakType))return [];
  if(id==='bentWheel'&&answers.onset!=='impact')return [];
  if(id==='rotors'&&answers.vibrationWhen&&!['braking','unknown'].includes(answers.vibrationWhen))return [];
  const base=anchors.filter(t=>matches(t,answers)),detail=support.filter(t=>matches(t,answers));
  if(!base.length||(needsDetail.has(id)&&!detail.length))return [];
  const evidence=[...new Set([...base,...detail].map(t=>t.split('=')[0]))];
  return [{id,evidence,score:base.length+detail.length*3}];
 }).sort((a,b)=>b.score-a.score).slice(0,3).map(({score,...result})=>result);
}
