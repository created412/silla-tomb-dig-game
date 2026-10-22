import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadAdventureSave,saveAdventure,ADVENTURE_SAVE_KEY} from '../prototype/src/adventure-save.js';
test('reading old stars migrates in memory without writing',()=>{
 let writes=0;const storage={getItem:k=>k==='silla-dig-stars-v1'?JSON.stringify({version:1,stars:{crown:3,saddle:2}}):null,setItem:()=>writes++};
 const s=loadAdventureSave(storage);assert.equal(s.stars.crown,3);assert.equal(s.index,2);assert.equal(writes,0);
});
test('explicit save restores progress and selected route',()=>{const m=new Map(),store={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 assert.equal(saveAdventure(store,{crown:3,saddle:1},1),true);assert.ok(m.has(ADVENTURE_SAVE_KEY));assert.equal(loadAdventureSave(store).index,1);
 assert.equal(loadAdventureSave(store).stars.saddle,1);
});
test('corrupted data and storage failures are safe and do not unlock later routes',()=>{
 assert.equal(loadAdventureSave({getItem:()=>'{bad'}).index,0);
 const bad={getItem:k=>k===ADVENTURE_SAVE_KEY?JSON.stringify({version:1,stars:{crown:99},index:4}):null};
 assert.equal(loadAdventureSave(bad).index,0);assert.equal(saveAdventure({setItem:()=>{throw Error('blocked');}},{},0),false);
});
