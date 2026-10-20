import {createDig,progress,topLayer,tap} from './dig-model.js';
import {hintForLayer} from './hud.js';
import {layoutGrid} from './grid.js';
import {LINES} from './lines.js';
import {createDialogue} from './dialogue.js';
import {createRenderer} from './renderer.js';
import {createSfx} from './sfx.js';
import {attachInput} from './input.js';
import {freshAdventure,currentItem,markFound,loadAdventure,saveAdventure,importLegacy,useAid,captureDig,restoreDig} from './adventure-model.js';
import {loadExhibit} from './story-model.js';
import {createAdventureUI} from './adventure-ui.js';
import {itemById} from './adventure-data.js';
import {nextRoute} from './companion-model.js';
import {createCompanionUI} from './companion-ui.js';
import {drawHomeArt} from './home-art.js';

const $=id=>document.getElementById(id),canvas=$('dig');
const renderer=createRenderer(canvas),sfx=createSfx();
const dialogue=createDialogue({...LINES,turtleJoin:[{who:'turtle',text:'나도 도울게! 돌이 보이면 나를 불러 줘.'}],turtleHelp:[{who:'turtle',text:'내 등껍질만큼 단단하네. 톡, 톡, 톡!'}],birdHelp:[{who:'bird',text:'저기 반짝이는 자리! 살살 찾아보자.'}]});
let storage=null;try{storage=window.localStorage;}catch{/* 저장이 막혀도 놀이 가능 */}
const loadedAdventure=loadAdventure(storage);
const adventure=loadedAdventure||importLegacy(loadExhibit(storage));
let savedSnapshot=loadedAdventure?JSON.stringify(adventure):null;
let phase='title',state=null,layout=null,lastTouchedCell=-1,foundAt=0,reactionTimer,foundTimer,helpBusy=false,practiceItem=null;
let routeContinue=false;
const sound=result=>result==='solved'?sfx.glimmer():sfx.tap();
const ui=createAdventureUI($('story'),adventure,{onDig:beginItem,onReplay:replay,onTrail:id=>openRoute(id,false),onSave:changed,onHome(){setPhase('title');ui.hide();},onSound:sound});
const trail=createCompanionUI($('expedition'),adventure,{onSave:changed,onSound:sound,onExit(){routeContinue=false;ui.map();},onFinish(){routeContinue?beginItem():ui.friends();}});
function openRoute(id,resume){routeContinue=resume;setPhase('story');ui.hide();if(!trail.open(id))ui.map();}
function replay(id){const i=itemById(id);if(!i||i.kind!=='dig'||!adventure.clues.includes(id))return;practiceItem=i;ui.hide();state=createDig({cols:12,rows:7,artifactCells:i.cells});renderer.setArtifact(id);renderer.setCompanion(adventure.friends.includes('turtle'));renderer.setBird(adventure.friends.includes('bird'));lastTouchedCell=-1;$('game-heading').querySelector('.site-name').textContent='다시 파기 · '+i.name;$('discovery').querySelector('h2').textContent='또 찾았다, '+i.name+'!';$('discovery').querySelector('p').textContent='우리 박물관의 기억을 다시 만났어!';setPhase('dig');updateHud();}
function changed(){const dirty=JSON.stringify(adventure)!==savedSnapshot;$('save-status').textContent=dirty?'저장 안 된 진행이 있어':'저장한 기록이야';$('save-controls').dataset.dirty=String(dirty);refreshTitle();}
function save(){if(helpBusy)return;checkpoint();if(saveAdventure(storage,adventure)){savedSnapshot=JSON.stringify(adventure);$('save-controls').dataset.dirty='false';$('save-status').textContent='여기까지 저장했어!';}else $('save-status').textContent='저장하지 못했어. 다시 눌러 줘.';}
function refreshTitle(){$('btn-exhibit').classList.toggle('hidden',!adventure.clues.length);$('btn-start').textContent=adventure.found.length||adventure.dig||adventure.friends.length>1?'탐험 이어가기':'탐험 시작하기';}
function startNew(){clearTimeout(foundTimer);clearTimeout(reactionTimer);trail.hide();ui.reset();Object.assign(adventure,freshAdventure());state=null;practiceItem=null;routeContinue=false;lastTouchedCell=-1;foundAt=0;helpBusy=false;renderer.reset();renderer.setBird(false);changed();sfx.unlock();setPhase('story');ui.intro();}
function resize(){const dp=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*dp);canvas.height=Math.round(r.height*dp);layout=layoutGrid({width:canvas.width,height:canvas.height-254*dp,cols:12,rows:7,padding:24*dp});layout.y0+=112*dp;}
window.addEventListener('resize',resize);resize();
function showLine(line){renderer.speak(line?.who||null);$('dialogue').classList.toggle('hidden',!line);if(!line)return;$('dialogue').dataset.speaker=line.who;$('dialogue').disabled=true;$('speaker').textContent={frog:'두꺼비',snake:'뱀',turtle:'거북',bird:'새'}[line.who];$('line').textContent=line.text;$('tap-hint').classList.add('hidden');}
function reaction(id){if(!dialogue.playIfIdle(id))return;showLine(dialogue.current());clearTimeout(reactionTimer);reactionTimer=setTimeout(()=>{while(dialogue.next()){}showLine(null);},2300);}
function setPhase(next){phase=next;$('stage').dataset.phase=next;$('title').classList.toggle('hidden',next!=='title');$('hud').classList.toggle('hidden',next!=='dig');$('game-heading').classList.toggle('hidden',!['dig','found'].includes(next));$('discovery').classList.toggle('hidden',next!=='found');if(next!=='dig'){clearTimeout(reactionTimer);while(dialogue.next()){}showLine(null);}}
function beginItem(){practiceItem=null;ui.hide();const i=currentItem(adventure);setPhase('story');const route=nextRoute(adventure);if(route){openRoute(route,true);return;}if(!i){adventure.completed.includes(adventure.chapter)?ui.museum():ui.portrait();return;}if(adventure.clues.includes(i.id)){ui.award();return;}if(adventure.found.includes(i.id)){ui.describe(i.id);return;}if(i.kind==='survey'){ui.survey();return;}
 state=createDig({cols:12,rows:7,artifactCells:i.cells});if(adventure.index>0){state.soil.fill(0);state.rock.fill(0);i.cells.forEach(c=>state.glimmered.add(c));}restoreDig(adventure,state);
 renderer.setArtifact(i.id);renderer.setCompanion(adventure.friends.includes('turtle'));renderer.setBird(adventure.friends.includes('bird'));
 $('game-heading').querySelector('.site-name').textContent=`${adventure.chapter+1}장 · ${i.name}`;$('discovery').querySelector('h2').textContent=`찾았다, ${i.name}!`;$('discovery').querySelector('p').textContent='토우 친구의 기억이 조금 돌아왔어!';
 lastTouchedCell=adventure.index?i.cells[0]:-1;setPhase('dig');updateHud();
}
function revealed(now){if(!practiceItem){markFound(adventure);changed();}foundAt=now;setPhase('found');renderer.react('artifactRevealed',now);renderer.flash(650,now);sfx.found();clearTimeout(foundTimer);foundTimer=setTimeout(()=>{setPhase('story');ui.describe((practiceItem||currentItem(adventure)).id,practiceItem?'replay':'card');},2600);}
function onEvents(events){const now=performance.now();for(const e of events){switch(e.type){case'tooHard':renderer.react('tooHard',now);reaction('tooHard');break;case'collapse':renderer.react('collapse',now);renderer.addDust(e.cell,layout,now,'collapse');renderer.shake(450,now);sfx.collapse();reaction('collapse');break;case'glimmer':renderer.react('glimmer',now);sfx.glimmer();reaction('glimmer');break;case'chip':sfx.tap();renderer.addDust(e.cell,layout,now,'rock');break;case'rockBroken':sfx.crack();renderer.addDust(e.cell,layout,now,'rock');break;case'artifactCell':sfx.tap();break;case'artifactRevealed':revealed(now);break;}}}
attachInput(canvas,{getLayout:()=>layout,getState:()=>phase==='dig'&&!helpBusy?state:null,onEvents,onRub:cell=>{renderer.addDust(cell,layout,performance.now());sfx.rub();},onBrush:cell=>{renderer.addDust(cell,layout,performance.now(),'wood');sfx.brush();},onTouchCell:cell=>{lastTouchedCell=cell;},onRockDrag:()=>reaction('rockDrag')});
async function help(who){if(phase!=='dig'||helpBusy)return;let cell=-1;if(who==='turtle'){cell=lastTouchedCell>=0&&topLayer(state,lastTouchedCell)==='rock'?lastTouchedCell:state.rock.findIndex((r,n)=>r>0&&state.soil[n]===0);if(cell<0)return;}if(!useAid(adventure,who))return;changed();if(who==='bird'){renderer.hint(currentItem(adventure).cells,performance.now()+5000);reaction('birdHelp');return;}helpBusy=true;reaction('turtleHelp');for(let n=0;n<3;n++){await new Promise(r=>setTimeout(r,300));onEvents(tap(state,cell,performance.now()));}helpBusy=false;checkpoint();}
$('aid-turtle').addEventListener('click',()=>help('turtle'));$('aid-bird').addEventListener('click',()=>help('bird'));
function checkpoint(){if(phase==='dig'&&state&&!practiceItem){captureDig(adventure,state);changed();}}
canvas.addEventListener('pointerup',checkpoint);canvas.addEventListener('pointercancel',checkpoint);
$('btn-save').addEventListener('click',save);
$('btn-new').addEventListener('click',startNew);
$('btn-start').addEventListener('click',()=>{sfx.unlock();setPhase('story');ui.map();});$('btn-exhibit').addEventListener('click',()=>{sfx.unlock();setPhase('story');ui.museum();});
function updateHud(){
 $('btn-save').disabled=helpBusy;
 const p=progress(state);for(const layer of ['soil','rock','wood'])$('bar-'+layer).style.transform=`scaleY(${1-p[layer]})`;
 const layer=lastTouchedCell>=0?topLayer(state,lastTouchedCell):'soil';$('hint').textContent=hintForLayer(layer);$('layers').dataset.active=layer;
 for(const who of ['turtle','bird']){const b=$('aid-'+who);b.classList.toggle('hidden',!!practiceItem||!adventure.friends.includes(who));const used=adventure.aids.includes(`${adventure.chapter}:${who}`);
  b.disabled=used||helpBusy||(who==='turtle'&&!state.rock.some((r,n)=>r>0&&state.soil[n]===0));
  b.textContent=used?`${who==='turtle'?'거북이':'새가'} 도와줬어 ✓`:who==='turtle'?'거북! 돌 좀 도와줘':'새야! 어디에 있을까?';
 }
}
function frame(t){if(phase==='dig')updateHud();else $('btn-save').disabled=false;renderer.draw(state,layout,t,phase,t-foundAt);if(phase==='title')drawHomeArt($('title'),t);ui.tick(t);trail.tick(t);requestAnimationFrame(frame);}requestAnimationFrame(frame);setPhase('title');changed();
