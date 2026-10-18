import test from 'node:test';
import assert from 'node:assert/strict';
import {replyToMessage,createConversationState} from '../src/assets/repair-helper/conversation.js';
import {locales} from '../src/assets/repair-helper/locales.js';
const reply=(s,text)=>replyToMessage(s,text,locales.en);
test('pending detailed question accepts its exact answer without losing context',()=>{
 const s={...createConversationState(),topics:['start'],answers:{safety:'none',timing:'now',start:'click',startingClick:'single'},pendingQuestion:'electricalClue'};
 const turn=reply(s,'They stay about normal');assert.equal(turn.state.answers.electricalClue,'normal');assert.equal(turn.state.answers.start,'click');
 assert.equal(turn.state.pendingQuestion,turn.nextQuestion);
});
test('short follow-up details do not restart a known conversation',()=>{
 const s={...createConversationState(),topics:['brakes'],answers:{safety:'none',timing:'now',brakes:'squeal'},pendingQuestion:'brakeTiming'};
 const turn=reply(s,'Since a recent brake service');assert.equal(turn.state.answers.brakeTiming,'afterwork');assert.notEqual(turn.kind,'clarify');
});
test('unqualified no-start never invents normal cranking',()=>{
 const turn=reply(createConversationState(),'My car will not start');assert.equal(turn.state.answers.start,undefined);assert.equal(turn.nextQuestion,'start');assert.ok(turn.messageKeys.includes('startDetails'));
 assert.equal(turn.state.answers.safety,undefined);
});
test('follow-up can introduce an urgent hazard even while answering another question',()=>{
 const s={...createConversationState(),topics:['start'],answers:{start:'click'},pendingQuestion:'electricalClue'};
 const turn=reply(s,'The lights are normal but I smell gasoline now');assert.equal(turn.kind,'safety');
});
test('multiple codes retain exact numbers and explain each supported family',()=>{
 const turn=reply(createConversationState(),'I have P0171 and P0301 and P0171');
 assert.deepEqual(turn.state.codes,['P0171','P0301']);assert.ok(turn.messageKeys.includes('code.lean'));assert.ok(turn.messageKeys.includes('code.misfire'));
});
test('explicit different issue starts a fresh assessment while retaining vehicle details',()=>{
 let state=reply(createConversationState(),'It is a 2018 Honda Civic').state;
 state=reply(state,'The brakes squeal').state;
 const turn=reply(state,'New issue: the AC blows warm');
 assert.equal(turn.state.answers.brakes,undefined);assert.equal(turn.state.answers.climate,'warm');assert.equal(turn.state.vehicle,'2018 Honda Civic');assert.ok(!turn.state.text.includes('brakes squeal'));
});
test('an unresolved active hazard cannot be silently cleared by changing the topic',()=>{
 const state=reply(createConversationState(),'I smell gasoline now').state;
 assert.equal(reply(state,'New issue: AC blows warm').kind,'safety');
});
test('none-of-these safety answer does not invent one starter click',()=>{
 const state=reply(createConversationState(),'My car clicks but will not start').state;
 const turn=reply(state,'None of these');assert.equal(turn.state.answers.startingClick,undefined);
});
test('short yes/no answers apply only to the pending timing or safety question',()=>{
 const base={...createConversationState(),topics:['start'],answers:{start:'click',safety:'none'},pendingQuestion:'timing'};
 assert.equal(reply(base,'yes').state.answers.timing,'now');assert.equal(reply(base,'no').state.answers.timing,'past');
 const safety={...base,answers:{start:'click'},pendingQuestion:'safety'};
 assert.equal(reply(safety,'no').state.answers.safety,'none');assert.equal(reply(safety,'yes').nextQuestion,'safety');
});
test('adding a vehicle detail cannot replace an unresolved safety response',()=>{
 const s=reply(createConversationState(),'I smell gasoline now').state;
 assert.equal(reply(s,'It is a 2018 Honda Civic').kind,'safety');
});
