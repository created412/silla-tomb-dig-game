import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES,createAdventure,stepAdventure,switchFriend,retryAdventure} from '../prototype/src/adventure-model.js';
import {pilot} from './adventure-pilot.mjs';

const tick=(s,input,n=1)=>{for(let i=0;i<n;i++)stepAdventure(s,input,1/60);};
test('progression starts with frog and unlocks flight, shield and crawl in order',()=>{
 assert.deepEqual(ROUTES.map(r=>r.actor),['frog','bird','turtle','snake','frog']);
 assert.equal(createAdventure(0).actor,'frog');
 const s=createAdventure(0);assert.equal(switchFriend(s,'bird'),false);
 assert.equal(ROUTES.length,5);
});
test('frog jumps with a press, cannot repeat in the air, and lands on platforms',()=>{
 const s=createAdventure(0),y=s.player.y;tick(s,{action:true});assert.ok(s.player.y<y);
 tick(s,{action:true},90);assert.equal(s.player.y,y);assert.ok(s.player.grounded);
 tick(s,{},1);tick(s,{action:true});assert.ok(s.player.y<y);
});
test('bird gains height while flapping and descends on release',()=>{
 const s=createAdventure(1),y=s.player.y;tick(s,{action:true},40);assert.ok(s.player.y<y-70);
 const high=s.player.y;tick(s,{},90);assert.ok(s.player.y>high);
});
test('falling returns to the latest checkpoint without losing collected lights',()=>{
 const s=createAdventure(0);s.collected.add('light0');s.checkpoint={x:900,y:460};s.player.y=900;
 tick(s,{});assert.equal(s.failures,1);assert.equal(s.player.x,900);assert.ok(s.collected.has('light0'));
 tick(s,{},1);assert.equal(s.failures,1);
});
test('turtle blocks a rolling stone only while holding shield',()=>{
 const s=createAdventure(2);s.player.x=800;s.player.y=460;s.stones=[{x:824,y:440,vx:-150,id:'test'}];
 tick(s,{action:true});assert.equal(s.failures,0);assert.ok(s.events.some(e=>e.type==='block'));
 const b=createAdventure(2);b.player.x=800;b.player.y=460;b.stones=[{x:824,y:440,vx:-150,id:'test'}];tick(b,{});assert.equal(b.failures,1);
});
test('snake crawl opens its narrow gate; standing or other friends cannot pass',()=>{
 const s=createAdventure(3),g=s.route.gates.find(g=>g.kind==='crawl');s.player.x=g.x-25;s.player.y=460;
 tick(s,{right:true},30);assert.ok(s.player.x<g.x);assert.ok(!s.opened.has(g.id));
 tick(s,{right:true,action:true},30);assert.ok(s.opened.has(g.id));assert.ok(s.player.x>g.x);
});
test('arrival requires the route lights and gates, fires once, and retry stays playable',()=>{
 const s=createAdventure(0);s.player.x=s.route.goal;tick(s,{});assert.equal(s.status,'play');
 for(const l of s.route.lights)s.collected.add(l.id);for(const g of s.route.gates)s.opened.add(g.id);
 tick(s,{});assert.equal(s.status,'arrived');assert.equal(s.events.filter(e=>e.type==='arrive').length,1);
 tick(s,{});assert.equal(s.events.length,0);retryAdventure(s);assert.equal(s.status,'play');
});
test('large elapsed time is clamped and invalid character switches do not change actor',()=>{
 const s=createAdventure(0),x=s.player.x;stepAdventure(s,{right:true},999);assert.ok(s.player.x-x<20);
 assert.equal(switchFriend(s,'not-a-friend'),false);assert.equal(s.actor,'frog');
});
test('all five routes can be completed using movement and ability inputs alone',()=>{
 for(let i=0;i<5;i++){
  const s=createAdventure(i);
  for(let f=0;f<18000&&s.status==='play';f++){
   const a=pilot(s);if(a.actor!==s.actor)switchFriend(s,a.actor);stepAdventure(s,a.input,1/60);
  }
  assert.equal(s.status,'arrived',`route ${i}: x=${s.player.x},y=${s.player.y}, lights=${[...s.collected]}, gates=${[...s.opened]}, retries=${s.failures}`);
  assert.equal(s.collected.size,3);assert.equal(s.opened.size,s.route.gates.length);
 }
});
