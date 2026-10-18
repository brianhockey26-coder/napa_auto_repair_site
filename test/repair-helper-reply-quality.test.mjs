import test from 'node:test';
import assert from 'node:assert/strict';
import {isUsableModelReply,cleanModelReply} from '../src/assets/repair-helper/reply-quality.js';
for(const text of ['The battery or its connections may be involved. A load test helps distinguish them.','La batería puede estar débil. Una revisión puede aclararlo.','可能涉及电池或连接，需要检查确认。','It is not safe to drive with failed brakes.'])test(`accepts bounded guidance: ${text}`,()=>assert.equal(isUsableModelReply(text),true));
for(const text of ['',"It's completely safe to drive.",'You definitely need a new battery.','The battery is weak. The battery is weak.','可以放心继续驾驶。','Puede conducir sin riesgo.'])test(`rejects misleading output: ${text}`,()=>assert.equal(isUsableModelReply(text),false));
test('duplicate cleanup retains the first explanation and removes only exact repeated sentences',()=>{
 const result=cleanModelReply('A battery test can help. Connections also need inspection. A battery test can help.');
 assert.equal(result.match(/A battery test can help/g).length,1);assert.match(result,/Connections also need inspection/);assert.equal(isUsableModelReply(result),true);
 assert.equal(cleanModelReply('<b>Literal text</b>'),'<b>Literal text</b>');
});
