import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBoss,startBossStep,chooseBossFriend,hitBossTarget,nextBossStep,retryBossStep,bossUnlocked,saveBossBadge,loadBossBadge,BADGE_KEY,BOSS_STEPS} from '../prototype/src/boss-model.js';
test('boss requires all five discoveries, including returning players',()=>{assert.equal(bossUnlocked({belt:3}),false);assert.equal(bossUnlocked({crown:1,saddle:2,glass:3,ewer:1,belt:1}),true);});
test('four different powers and required targets lead to victory, never wall-clock time',()=>{
 const s=createBoss(()=>.5);assert.equal(hitBossTarget(s,'bush1').type,'ignored');
 for(let k=0;k<4;k++){startBossStep(s);assert.equal(hitBossTarget(s,'wrong').type,'choose');assert.equal(s.hearts,3);chooseBossFriend(s,BOSS_STEPS[k].who);for(const t of k===0?['bush1']:BOSS_STEPS[k].targets)hitBossTarget(s,t);assert.equal(s.phase,'clear');assert.equal(hitBossTarget(s,'wrong').type,'ignored');nextBossStep(s);}
 assert.equal(s.phase,'won');assert.equal(chooseBossFriend(s,'frog').type,'ignored');assert.equal(retryBossStep(s),false);
});
test('three mistakes fail; retry resets only this stage, duplicate targets cannot score',()=>{
 const s=createBoss(()=>0);startBossStep(s);chooseBossFriend(s,'bird');hitBossTarget(s,'bush0');nextBossStep(s);startBossStep(s);chooseBossFriend(s,'frog');hitBossTarget(s,'soil0');assert.equal(hitBossTarget(s,'soil0').type,'ignored');
 for(let k=0;k<3;k++)hitBossTarget(s,'relic');assert.equal(s.phase,'failed');assert.equal(s.hearts,0);assert.equal(chooseBossFriend(s,'frog').type,'ignored');assert.equal(retryBossStep(s),true);assert.equal(s.step,1);assert.equal(s.hearts,3);assert.deepEqual(s.done,[]);
});
test('snake must follow the path in order',()=>{const s=createBoss();s.step=3;startBossStep(s);chooseBossFriend(s,'snake');assert.equal(hitBossTarget(s,'gap2').type,'miss');assert.equal(s.done.length,0);for(const t of ['gap0','gap1','gap2'])hitBossTarget(s,t);assert.equal(s.phase,'clear');});
test('badge saving is explicit, never touches star saves, handles blocked storage',()=>{
 const m=new Map([['silla-dig-stars-v1','existing']]);const storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};const s=createBoss();assert.equal(saveBossBadge(storage,s),false);s.phase='won';assert.equal(m.has(BADGE_KEY),false);assert.equal(saveBossBadge(storage,s),true);assert.equal(loadBossBadge(storage),true);assert.equal(m.get('silla-dig-stars-v1'),'existing');assert.equal(saveBossBadge({setItem(){throw Error();}},s),false);assert.equal(loadBossBadge({getItem:()=>'{broken'}),false);
});
