import test from 'node:test';
import assert from 'node:assert/strict';
import {extractChatAnswers} from '../src/assets/repair-helper/chat.js';
test('cause question retains simultaneous starting symptoms',()=>{
 const answers=extractChatAnswers('My car clicks rapidly and the dashboard dims when I try to start it. What could cause that?');
 assert.equal(answers.start,'click');assert.equal(answers.startingClick,'rapid');assert.equal(answers.electricalClue,'dim');
 assert.equal(answers.leaks,undefined);
});
test('vehicle make names cannot invent tire damage',()=>{
 assert.equal(extractChatAnswers('It is a 2015 Honda Accord. What should I tell the mechanic?').tires,undefined);
});
test('generic no-start wording cannot overwrite a specific click',()=>{
 assert.equal(extractChatAnswers('My car clicks but will not start').start,'click');
});
