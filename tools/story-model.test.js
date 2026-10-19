import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARTIFACTS, NICKNAMES, STORY_TALKS } from '../prototype/src/story-data.js';
import { createStory, discover, observe, chooseClue, nextArtifact, classifyUnknown, makeExhibit, parseExhibit, saveExhibit, loadExhibit } from '../prototype/src/story-model.js';

function solve(s) {const a=ARTIFACTS[s.index];discover(s);for(const o of a.observations)observe(s,o.id);assert.equal(chooseClue(s,a.answer),'solved');}
function complete() {const s=createStory();for(let i=0;i<3;i++){solve(s);if(i<2)nextArtifact(s);}return s;}

test('발굴과 두 관찰을 거치기 전에는 단서를 얻거나 다음 구역으로 갈 수 없다',()=>{
 const s=createStory();assert.equal(chooseClue(s,0),'locked');assert.equal(nextArtifact(s),false);
 observe(s,ARTIFACTS[0].observations[0].id);assert.equal(s.observed.length,0);
 discover(s);observe(s,ARTIFACTS[0].observations[0].id);observe(s,ARTIFACTS[0].observations[0].id);
 assert.equal(s.observed.length,1);assert.equal(chooseClue(s,ARTIFACTS[0].answer),'locked');
});
test('다른 유물 관찰과 범위 밖 선택은 진행을 바꾸지 않는다',()=>{
 const s=createStory();discover(s);observe(s,'없는-관찰');assert.deepEqual(s.observed,[]);
 for(const o of ARTIFACTS[0].observations)observe(s,o.id);
 assert.equal(chooseClue(s,99),'locked');assert.equal(s.attempts,0);
});
test('오답 뒤 다시 고를 수 있고 단서는 중복해서 쌓이지 않는다',()=>{
 const s=createStory();discover(s);for(const o of ARTIFACTS[0].observations)observe(s,o.id);
 assert.equal(chooseClue(s,1-ARTIFACTS[0].answer),'retry');assert.equal(s.clues.length,0);
 assert.equal(chooseClue(s,ARTIFACTS[0].answer),'solved');chooseClue(s,ARTIFACTS[0].answer);assert.equal(s.clues.length,1);
});
test('금관 뒤 말다래, 유리잔으로 이어지고 마지막 뒤에 새 발굴이 생기지 않는다',()=>{
 const s=createStory();solve(s);assert.equal(nextArtifact(s),true);assert.equal(ARTIFACTS[s.index].id,'saddle');
 assert.equal(s.found,false);assert.deepEqual(s.observed,[]);solve(s);nextArtifact(s);solve(s);
 assert.deepEqual(s.clues,['crown','saddle','glass']);assert.equal(nextArtifact(s),false);
});
test('모르는 이름을 구분해야 전시가 완성되며 별명은 실제 이름으로 저장하지 않는다',()=>{
 const s=complete();assert.equal(makeExhibit(s,NICKNAMES[0]),null);
 assert.equal(classifyUnknown(s,'known-name'),false);assert.equal(classifyUnknown(s,'unknown-name'),true);
 const e=makeExhibit(s,NICKNAMES[0]);assert.equal(e.nickname,NICKNAMES[0]);assert.equal(e.realNameKnown,false);
 assert.equal(makeExhibit(s,'임의의 왕 이름'),null);
});
test('전시 저장값이 손상되거나 일부 유물이 빠졌으면 안전하게 거부한다',()=>{
 const s=complete();classifyUnknown(s,'unknown-name');const e=makeExhibit(s,NICKNAMES[1]);
 assert.deepEqual(parseExhibit(JSON.stringify(e)),e);assert.equal(parseExhibit('{'),null);
 assert.equal(parseExhibit(JSON.stringify({...e,items:['crown']})),null);
 assert.equal(parseExhibit(JSON.stringify({...e,realNameKnown:true})),null);
});
test('저장 거부 환경에서도 예외 없이 플레이를 마칠 수 있다',()=>{
 const s=complete();classifyUnknown(s,'unknown-name');const e=makeExhibit(s,NICKNAMES[0]);
 const storage={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};
 assert.equal(saveExhibit(storage,e),false);assert.equal(loadExhibit(storage),null);
});
test('이야기 데이터는 세 유물, 두 관찰과 두 선택지를 가지며 대사는 40자 이내다',()=>{
 assert.equal(ARTIFACTS.length,3);
 for(const a of ARTIFACTS){assert.equal(a.observations.length,2);assert.equal(a.options.length,2);assert.ok(a.answer===0||a.answer===1);}
 for(const lines of Object.values(STORY_TALKS))for(const line of lines){assert.ok(['frog','snake','turtle'].includes(line.who));assert.ok(line.text.length<=40,line.text);}
});
