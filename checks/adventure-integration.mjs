// 브라우저 연결이 없는 환경의 DOM/Canvas 통합 검사. 실제 CSS 배치·기기 검증을 대체하지 않는다.
// 검사 도구만 tmp에 설치: npm install --prefix tmp/adventure-tools --no-package-lock jsdom @napi-rs/canvas
import {JSDOM} from '../tmp/adventure-tools/node_modules/jsdom/lib/api.js';
import {createCanvas,Image as RasterImage,Path2D} from '../tmp/adventure-tools/node_modules/@napi-rs/canvas/index.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {pilot} from './adventure-pilot.mjs';
const html=await readFile(new URL('../prototype/index.html',import.meta.url),'utf8');
const dom=new JSDOM(html,{url:'https://local.invalid/prototype/',pretendToBeVisual:true}),w=dom.window,d=w.document;
let clock=0,raf=[],tid=0;const timers=new Map();
for(const key of ['window','document','HTMLElement','HTMLCanvasElement','HTMLImageElement','Event','KeyboardEvent'])globalThis[key]=key==='window'?w:key==='document'?d:w[key];
Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
globalThis.devicePixelRatio=1;globalThis.localStorage=w.localStorage;w.devicePixelRatio=1;globalThis.Path2D=Path2D;
w.matchMedia=globalThis.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
globalThis.requestAnimationFrame=w.requestAnimationFrame=fn=>{raf.push(fn);return raf.length;};
globalThis.setTimeout=(fn,delay=0)=>{timers.set(++tid,{fn,at:clock+delay,repeat:0});return tid;};
globalThis.clearTimeout=id=>timers.delete(id);
globalThis.setInterval=(fn,delay)=>{timers.set(++tid,{fn,at:clock+delay,repeat:delay});return tid;};
globalThis.clearInterval=id=>timers.delete(id);
globalThis.ResizeObserver=class{constructor(fn){this.fn=fn;}observe(){this.fn();}disconnect(){}};
globalThis.fetch=async url=>{try{const path=url instanceof URL?url:new URL(url,new URL('../prototype/',import.meta.url));const data=await readFile(path);return {ok:true,json:async()=>JSON.parse(data),text:async()=>data.toString()};}catch{return {ok:false,json:async()=>({})};}};
globalThis.Audio=class{constructor(){const a=d.createElement('audio');a.play=async()=>{};a.pause=()=>{};a.load=()=>{};return a;}};
globalThis.Image=class extends RasterImage{set src(v){const str=String(v);try{super.src=readFileSync(str.startsWith('file:')?fileURLToPath(str):fileURLToPath(new URL(str,new URL('../prototype/',import.meta.url))));}catch{}}get src(){return super.src;}};
const surfaces=new WeakMap();let sw=1440,sh=900;
function surface(el){if(!surfaces.has(el))surfaces.set(el,createCanvas(el.width||300,el.height||150));return surfaces.get(el);}
for(const prop of ['width','height']){const desc=Object.getOwnPropertyDescriptor(w.HTMLCanvasElement.prototype,prop);Object.defineProperty(w.HTMLCanvasElement.prototype,prop,{get:desc.get,set(v){desc.set.call(this,v);if(surfaces.has(this))surfaces.get(this)[prop]=v;}});}
w.HTMLCanvasElement.prototype.getContext=function(){const c=surface(this),ctx=c.getContext('2d');if(!ctx.__wrapped){const original=ctx.drawImage.bind(ctx);ctx.drawImage=(img,...args)=>original(img instanceof w.HTMLCanvasElement?surface(img):img,...args);ctx.__wrapped=true;}return ctx;};
w.HTMLElement.prototype.setPointerCapture=function(){};w.HTMLElement.prototype.releasePointerCapture=function(){};
w.HTMLElement.prototype.getBoundingClientRect=function(){
 const hidden=this.closest('.hidden');if(hidden)return {x:0,y:0,left:0,top:0,right:0,bottom:0,width:0,height:0};
 if(this.id==='dig-bounds')return {x:0,y:72,left:0,top:72,right:sw-126,bottom:sh-176,width:sw-126,height:sh-248};
 if(this.matches('#stage,#dig,#adventure,#adventure-world'))return {x:0,y:0,left:0,top:0,right:sw,bottom:sh,width:sw,height:sh};
 return {x:0,y:0,left:0,top:0,right:120,bottom:100,width:120,height:100};
};
globalThis.getComputedStyle=()=>({getPropertyValue:()=>10,bottom:'12px'});
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
const failures=[];w.addEventListener('error',e=>failures.push(e.error));
await import('../prototype/src/main.js?integration');
await new Promise(resolve=>setImmediate(resolve));
function frames(n=1){for(let i=0;i<n;i++){clock+=1000/60;for(const [id,t] of [...timers])if(t.at<=clock){if(t.repeat)t.at+=t.repeat;else timers.delete(id);t.fn();}const q=raf;raf=[];for(const f of q)f(clock);}}
const click=sel=>{const el=d.querySelector(sel);assert.ok(el,sel);assert.ok(!el.disabled,sel+' enabled');el.click();frames(1);};
const visible=sel=>!d.querySelector(sel).classList.contains('hidden');
function talks(){for(let i=0;i<15&&visible('#dialogue');i++){frames(11);click('#dialogue-next');}}
function key(name,held,repeat=false){(d.activeElement||d.body).dispatchEvent(new w.KeyboardEvent(held?'keydown':'keyup',{key:name,bubbles:true,repeat}));}
function movement(input){for(const [action,k] of [['left','ArrowLeft'],['right','ArrowRight'],['action',' ']])key(k,!!input[action]);}
async function snapshot(name){const c=surface(d.querySelector('#adventure-world'));await writeFile(new URL('../tmp/adventure-'+name+'.png',import.meta.url),c.toBuffer('image/png'));}
const readSave=()=>w.localStorage.getItem('silla-adventure-v1');
click('#btn-new-adventure');click('#btn-start');talks();
assert.equal(w.sillaDebug.phase,'explore');assert.equal(w.sillaDebug.adventure.actor,'frog');
assert.equal(d.querySelectorAll('[data-adventure-friend]').length,1);assert.equal(readSave(),null);
frames(2);await snapshot('frog');
function touch(selector,type,id){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,pointerType:'touch'});d.querySelector(selector).dispatchEvent(e);}
touch('[data-move="right"]','pointerdown',1);touch('#adventure-action','pointerdown',2);frames(8);
assert.ok(w.sillaDebug.adventure.player.x>110&&w.sillaDebug.adventure.player.y<460,'simultaneous touch moves and jumps');
touch('[data-move="right"]','pointercancel',1);touch('#adventure-action','pointerup',2);const touchX=w.sillaDebug.adventure.player.x;frames(15);assert.equal(w.sillaDebug.adventure.player.x,touchX,'cancel releases touch movement');
click('#adventure-pause');click('#adventure-retry');frames(1);
key('ArrowRight',true);frames(12);key('ArrowRight',false);const px=w.sillaDebug.adventure.player.x;assert.ok(px>110);
click('#adventure-pause');frames(60);assert.equal(w.sillaDebug.adventure.player.x,px);assert.equal(w.sillaDebug.adventurePaused,true);click('#adventure-continue');
key('Escape',true);assert.equal(w.sillaDebug.adventurePaused,true);key('Escape',true,true);assert.equal(w.sillaDebug.adventurePaused,true,'holding Escape keeps pause open');key('Escape',false);click('#adventure-continue');
let n=0;
while(w.sillaDebug.adventure.status==='play'&&n++<18000){const a=pilot(w.sillaDebug.adventure);movement(a.input);frames(1);}
movement({});assert.equal(w.sillaDebug.adventure.status,'arrived');assert.ok(visible('#adventure-modal'));assert.equal(readSave(),null);
await snapshot('arrival');click('#adventure-continue');assert.equal(w.sillaDebug.phase,'dig');assert.deepEqual(Object.keys(w.sillaDebug.challenge.powers),['frog']);
function pointer(type,i){const c=d.querySelector('#dig'),l=w.sillaDebug.layout;const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:99,pointerType:'touch',isPrimary:true,clientX:l.x0+(i%12+.5)*l.cell+(type==='pointermove'?2:0),clientY:l.y0+(Math.floor(i/12)+.5)*l.cell,buttons:type==='pointerup'?0:1});c.dispatchEvent(e);}
function drainStory(){
 talks();if(visible('#comic')){frames(100);if(d.querySelector('#comic').dataset.memoryKind==='question')click('#comic-choices [data-k="1"]');click('#comic-next');}
}
for(const i of w.sillaDebug.challenge.dig.artifactCells){
 for(const layer of ['soil','wood']){
  let steps=0;while(w.sillaDebug.challenge.dig[layer][i]>0&&steps++<10){drainStory();pointer('pointerdown',i);for(let f=0;f<70;f++){frames(1);pointer('pointermove',i);if(visible('#comic')||visible('#dialogue'))break;}pointer('pointerup',i);}
  assert.equal(w.sillaDebug.challenge.dig[layer][i],0);
 }
}
for(let i=0;i<10&&!visible('#join');i++){frames(170);drainStory();}
assert.ok(d.querySelector('#join-name').textContent.includes('새'),'crown rewards bird');click('#join-ok');
assert.equal(w.sillaDebug.phase,'result');assert.equal(readSave(),null,'completion must not autosave');
click('#btn-save-result');assert.ok(readSave());const saved=readSave();
click('#btn-next');click('#btn-start');assert.equal(w.sillaDebug.adventure.actor,'bird');assert.equal(d.querySelectorAll('[data-adventure-friend]').length,2);
key(' ',true);frames(40);key(' ',false);assert.ok(w.sillaDebug.adventure.player.y<400);await snapshot('bird');
n=0;while(w.sillaDebug.adventure.status==='play'&&n++<18000){movement(pilot(w.sillaDebug.adventure).input);frames(1);}movement({});assert.equal(w.sillaDebug.adventure.status,'arrived');
click('#adventure-home');click('#btn-new-adventure');assert.equal(readSave(),saved,'new game preserves previous save until explicit save');
assert.equal(failures.length,0,String(failures[0]));
console.log('PASS: frog movement + pause + route completion -> real crown digging + stories -> bird reward -> manual save -> bird flight + arrival -> new game preserves old save');
console.log('Canvas captures: tmp/adventure-frog.png, tmp/adventure-arrival.png, tmp/adventure-bird.png. DOM test uses synthetic geometry; CSS/mobile layout still requires a browser.');
process.exit(0);
