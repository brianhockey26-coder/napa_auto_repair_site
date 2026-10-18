import test from 'node:test';
import assert from 'node:assert/strict';
import { createConversationState,replyToMessage } from '../src/assets/repair-helper/conversation.js';
import { locales } from '../src/assets/repair-helper/locales.js';

const responseText=(turn,copy)=>turn.messageKeys.map(key=>copy.conversation.responses[key]||copy.reasons[key.slice(7)]||'').join(' ');

test('free-text braking vibration keeps evidence and asks one useful next question',()=>{
 const turn=replyToMessage(createConversationState('en'),'My steering wheel shakes only when I brake',locales.en);
 assert.equal(turn.kind,'question');
 assert.ok(turn.result.possibilities.some(({id})=>id==='rotors'));
 assert.equal(turn.nextQuestion,'safety');
 assert.equal(turn.state.messages.at(-1).role,'assistant');
});

test('current fuel smell interrupts a normal chat with safety-only guidance',()=>{
 const turn=replyToMessage(createConversationState('en'),'Can I drive if I smell gasoline now?',locales.en);
 assert.equal(turn.kind,'safety');
 assert.equal(turn.brief.mode,'safety');
 assert.equal(turn.nextQuestion,null);
});

test('historical smoke is not presented as a current emergency',()=>{
 const turn=replyToMessage(createConversationState('en'),'Yesterday I saw smoke, but it is not happening now',locales.en);
 assert.notEqual(turn.kind,'safety');
 assert.equal(turn.result.historical,true);
});

test('a correction replaces an earlier brake inference with the newer fact',()=>{
 let state=createConversationState('en');
 state=replyToMessage(state,'The steering wheel shakes when I brake',locales.en).state;
 const turn=replyToMessage(state,'Correction: it only shakes at idle, not when braking',locales.en);
 assert.equal(turn.state.answers.vibrationWhen,'idle');
 assert.ok(!turn.result.possibilities.some(({id})=>id==='rotors'));
});

test('a supported diagnostic code receives a focused code response',()=>{
 const turn=replyToMessage(createConversationState('en'),'My check engine light has code P0171',locales.en);
 assert.equal(turn.kind,'reply');
 assert.equal(turn.intent,'code');
 assert.equal(turn.state.answers.engineCode,'lean');
 assert.match(responseText(turn,locales.en),/air|fuel|intake/i);
 assert.match(responseText(turn,locales.en),/does not identify.*part/i);
});

test('ambiguous chat text asks for clarification instead of inventing a symptom',()=>{
 const turn=replyToMessage(createConversationState('en'),'Something feels wrong with my car',locales.en);
 assert.equal(turn.kind,'clarify');
 assert.equal(turn.result.possibilities.length,0);
});

test('plain-language no-start concern gets a specific likely-system explanation',()=>{
 const turn=replyToMessage(createConversationState('en'),'My car will not start',locales.en);
 assert.equal(turn.state.answers.start,'crank');
 assert.match(responseText(turn,locales.en),/fuel|ignition|engine/i);
});

test('common battery-dead wording identifies an electrical starting concern',()=>{
 const turn=replyToMessage(createConversationState('en'),'My battery is dead and the car will not start',locales.en);
 assert.equal(turn.state.answers.start,'silent');
 assert.match(responseText(turn,locales.en),/battery|connections|starting/i);
});

test('vehicle details are remembered across a later symptom message',()=>{
 let state=replyToMessage(createConversationState('en'),'It is a 2018 Honda Civic with 112,000 miles',locales.en).state;
 const turn=replyToMessage(state,'The steering wheel shakes when I brake',locales.en);
 assert.equal(turn.state.vehicle,'2018 Honda Civic · 112,000 miles');
 assert.ok(turn.state.messages.some(message=>message.text.includes('2018 Honda Civic')));
});

for(const [text,answer,reason] of [
 ['The engine turns over but will not fire','crank','start.crank'],
 ['My dash lights go dim and it only clicks','click','start.click'],
 ['The temperature gauge is in the red','hot','heat.hot'],
 ['There is a puddle under the engine after parking','small','leaks.small'],
 ['The wheel pulls left when I let go','pull','steering.pull'],
 ['The AC blows warm but the fan is strong','warm','climate.warm'],
])test(`expanded local phrase recognition: ${text}`,()=>{
 const turn=replyToMessage(createConversationState('en'),text,locales.en);
 assert.ok(Object.values(turn.state.answers).includes(answer));
 assert.ok(turn.messageKeys.includes(`reason.${reason}`)||turn.kind==='safety');
});

for(const [text,answer] of [
 ['El coche no arranca pero gira normal','crank'],
 ['La bateria esta muerta','silent'],
 ['踩刹车时方向盘抖动','vibrate'],
 ['高速行驶时车身发抖','speed'],
 ['堵车时水温过高','hot'],
 ['车内闻到汽油味','fuel'],
])test(`multilingual local phrase recognition: ${text}`,()=>{
 const turn=replyToMessage(createConversationState('en'),text,locales.en);
 assert.ok(Object.values(turn.state.answers).includes(answer));
});

test('conversation responses remain complete in every supported language',()=>{
 for(const locale of Object.values(locales)){
  assert.ok(locale.conversation.summaryRequest);
  assert.ok(locale.conversation.responses['code.lean']);
  assert.ok(locale.conversation.responses['action.2']);
 }
});

test('Spanish and Chinese code responses do not fall back to English',()=>{
 for(const [language,text] of [['es','Mi luz de motor tiene codigo P0171'],['zh','发动机故障灯报码 P0171']]){
  const turn=replyToMessage(createConversationState(language),text,locales[language]);
  assert.equal(turn.intent,'code');
  assert.equal(/[A-Za-z]{5,}/.test(responseText(turn,locales[language])),language==='es');
 }
});
