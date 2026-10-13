import test from 'node:test';
import assert from 'node:assert/strict';
import { createConversationState,replyToMessage } from '../src/assets/repair-helper/conversation.js';
import { locales } from '../src/assets/repair-helper/locales.js';

const responseText=(turn,copy)=>turn.messageKeys.map(key=>copy.conversation.responses[key]||'').join(' ');

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
