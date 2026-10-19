import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLearning,submitLink,submitCase,connectionsComplete,learningReport,parseLearningReport} from '../prototype/src/learning-model.js';

const connect=l=>{submitLink(l,'rank','crown',2);submitLink(l,'riding','saddle',0);submitLink(l,'exchange','glass',1);};
test('이야기에 맞는 유물만 고르고 관찰 근거를 틀리면 장면을 완성하지 못한다',()=>{
 const l=createLearning();assert.equal(submitLink(l,'rank','crown',0),'retry');assert.equal(connectionsComplete(l),false);
 assert.equal(submitLink(l,'rank','crown',2),'solved');assert.equal(l.links.rank.attempts,2);
 assert.deepEqual(l.links.rank.first,{artifact:'crown',reason:0});
 submitLink(l,'rank','glass',1);assert.equal(l.links.rank.attempts,2);
});
test('빈 선택이나 모르는 장면은 오답 기록도 만들지 않는다',()=>{
 const l=createLearning();assert.equal(submitLink(l,'rank','',2),'incomplete');assert.equal(submitLink(l,'bogus','crown',2),'incomplete');
 assert.deepEqual(l.links,{});assert.equal(learningReport(l),null);
});
test('세 연결을 마쳐야 새 사례를 판단하며 사례 순서도 건너뛰지 못한다',()=>{
 const l=createLearning();assert.equal(submitCase(l,'horse-only',1),'locked');connect(l);
 assert.equal(submitCase(l,'no-crown',2),'locked');assert.equal(learningReport(l),null);
 assert.equal(submitCase(l,'horse-only',1),'solved');assert.equal(submitCase(l,'no-crown',2),'solved');
 assert.equal(learningReport(l).cases.length,2);
});
test('새 사례의 첫 판단은 수정 후에도 남고 중복 정답으로 부풀리지 않는다',()=>{
 const l=createLearning();connect(l);submitCase(l,'horse-only',0);submitCase(l,'horse-only',1);submitCase(l,'horse-only',1);submitCase(l,'no-crown',2);
 const r=learningReport(l);assert.equal(r.cases[0].first,0);assert.equal(r.cases[0].attempts,2);assert.equal(r.cases[1].attempts,1);
 assert.deepEqual(parseLearningReport(r),r);
});
test('불완전하거나 모순된 저장 기록을 학습 완료로 읽지 않는다',()=>{
 const l=createLearning();connect(l);submitCase(l,'horse-only',1);submitCase(l,'no-crown',2);const r=learningReport(l);
 assert.equal(parseLearningReport({...r,cases:[]}),null);
 const bad=structuredClone(r);bad.links[0].artifact='glass';assert.equal(parseLearningReport(bad),null);
 const fake=structuredClone(r);fake.cases[0].attempts=0;assert.equal(parseLearningReport(fake),null);
 assert.equal(parseLearningReport(null),null);
});
