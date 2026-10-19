import {SCENES,CASES} from './learning-data.js';
import {ARTIFACTS} from './story-data.js';
import {submitLink,submitCase,connectionsComplete} from './learning-model.js';

// 직접 그린 개념 그림. 인물·경로는 실제 초상이나 복원도가 아니다.
export function scenePicture(id,revealed){
 const person=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><circle cy="-32" r="15" fill="#d7af7b"/><path d="M-18 -13 Q0 -22 18 -13 L28 45 H-28Z" fill="#657b63"/><path d="M-11 45V65M11 45V65" stroke="#654b35" stroke-width="10" stroke-linecap="round"/></g>`;
 let picture='';
 if(id==='rank')picture=`<ellipse cx="180" cy="195" rx="135" ry="14" fill="#d7c699"/>${person(180,114,1.1)}<path d="M152 62V39L165 51L180 28L195 51L208 39V62Z" fill="#e0b746" stroke="#a7812d" stroke-width="3"/><path d="M80 114l20-10 18 10-18 10Z M244 99l15-8 15 8-15 8Z" fill="#ceb35f"/>`;
 if(id==='riding')picture=`<path d="M40 198 Q180 175 330 198" fill="none" stroke="#cebc8c" stroke-width="10"/><path d="M80 128 Q115 104 207 124 L235 81 L270 91 L259 113 L241 112 L222 153 L115 155Z" fill="#ac895d" stroke="#735739" stroke-width="4"/><path d="M120 151L111 194 M142 153L157 190 M198 150L220 188 M211 146L243 178 M80 131L52 155" stroke="#735739" stroke-width="9" stroke-linecap="round"/>${person(168,70,.65)}<path d="M141 126H188L182 162H145Z" fill="#e6d398" stroke="#8a6d40" stroke-width="3"/><text x="168" y="213" text-anchor="middle">말다래는 안장 옆에</text>`;
 if(id==='exchange')picture=`<path d="M60 119Q180 55 300 119" stroke="#9f8961" stroke-width="5" fill="none" stroke-dasharray="8 6"/><path d="M276 101L301 119L278 132" fill="none" stroke="#9f8961" stroke-width="5"/>${[60,180,300].map((x,i)=>`<circle cx="${x}" cy="139" r="27" fill="${i===2?'#6f967d':'#cfbf8e'}"/><text x="${x}" y="188" text-anchor="middle">${['먼 지역','여러 사람','신라'][i]}</text>`).join('')}<path d="M162 54H198L190 94H170Z" fill="#365c75"/><text x="180" y="218" text-anchor="middle">물건이 오갈 수 있는 길</text>`;
 return `<svg class="memory-picture ${revealed?'revealed':'sealed'}" viewBox="0 0 360 240" role="img" aria-label="${revealed?SCENES.find(s=>s.id===id).short+' 상상 장면':'근거를 연결하면 드러나는 생활 장면'}"><rect x="5" y="5" width="350" height="230" rx="24" fill="#e8dcb7"/>${revealed?picture:'<path d="M60 180Q180 95 300 180" fill="#cfcaac"/><text x="180" y="133" text-anchor="middle" style="font-size:58px">?</text>'}</svg>`;
}

export function createLearningView({display,heading,button,art,onDone,onMuseum}){
 let story,mode='workshop',active=SCENES[0].id,artifact='',reason=null,message='',caseIndex=0;
 function workshop(focus='#story-title'){
  const s=SCENES.find(s=>s.id===active),r=story.learning.links[active],solved=r?.artifact===s.artifact&&r?.reason===s.answer;
  const count=SCENES.filter(c=>story.learning.links[c.id]?.artifact===c.artifact&&story.learning.links[c.id]?.reason===c.answer).length;
  const artifactButtons=ARTIFACTS.map(a=>`<button type="button" data-evidence="${a.id}" aria-pressed="${artifact===a.id}">${art(a.id)}<span>${a.name}</span></button>`).join('');
  display(`${heading(`기억 공방 · 생활 장면 ${count}/3 완성`,'유물과 사람의 생활을 이어 줘')}
   <p class="learning-intro">거북: 네가 고른 유물과 근거로, 흐릿한 장면을 밝혀 줘.</p>
   <div class="memory-tabs">${SCENES.map(c=>`<button type="button" data-scene="${c.id}" aria-pressed="${active===c.id}">${story.learning.links[c.id]?.artifact===c.artifact&&story.learning.links[c.id]?.reason===c.answer?'✓ ':''}${c.short}</button>`).join('')}</div>
   <div class="learning-workbench"><div class="memory-scene">${scenePicture(s.id,solved)}<h3>${s.title}</h3><p>${s.claim}</p><small>유물을 근거로 꾸민 상상 장면이야.</small></div>
   <div class="learning-controls">${solved?`<p class="connection-success">✓ 유물 · 관찰 근거 · 생활을 연결했어</p><p class="connection-explanation">${s.why}</p>${button(connectionsComplete(story.learning)?'다른 무덤의 조사 편지 읽기':'다른 장면도 밝혀 주기','learning-next','class="story-primary"')}`:
    `${!artifact?`<p class="control-label">1. 어떤 유물이 이 이야기를 뒷받침할까?</p><div class="evidence-picker">${artifactButtons}</div><p class="learning-hint">왼쪽 생활 장면을 보고 유물을 골라 봐.</p>`:`<p class="chosen-evidence">고른 유물: <b>${ARTIFACTS.find(a=>a.id===artifact).name}</b> ${button('바꾸기','change-evidence','class="story-link"')}</p><p class="control-label">2. ${s.prompt}</p><div class="reason-picker">${s.reasons.map((text,i)=>`<button type="button" data-reason="${i}" aria-pressed="${reason===i}">${text}</button>`).join('')}</div><p class="field-note learning-feedback" role="status" tabindex="-1">${message||'생각의 근거가 되는 특징을 골라 줘.'}</p>${button('이 근거로 장면 밝히기','connect','class="story-primary" '+(reason===null?'disabled':''))}`}`}</div></div>`,'workshop',focus);
 }
 function challenge(focus='#story-title'){
  const c=CASES[caseIndex],record=story.learning.cases[c.id],solved=record?.answer===c.answer;
  display(`${heading(`옆 무덤에서 온 조사 편지 · ${caseIndex+1}/2`,c.title)}
   <div class="case-layout"><div class="case-record"><span class="case-stamp">가상 발굴 사례</span>${c.items.length?art(c.items[0]):'<div class="empty-find" aria-label="금관은 아직 찾지 못함">?</div>'}<p>${c.record}</p></div>
   <div class="learning-controls"><h3>${c.question}</h3>${solved?`<p class="connection-success">✓ 근거가 말해 주는 만큼 설명했어</p><p class="connection-explanation">${c.feedback[c.answer]}</p><p class="learning-takeaway">${c.takeaway}</p>${button(caseIndex===CASES.length-1?'우리 이야기의 별명 정하기':'다음 조사 편지','case-next','class="story-primary"')}`:
   `<div class="reason-picker">${c.options.map((text,i)=>`<button type="button" data-case-answer="${i}">${text}</button>`).join('')}</div><p class="field-note learning-feedback" role="status" tabindex="-1">${message||'앞에서 모은 단서를 이 무덤에도 그대로 적용해도 될까?'}</p>`}</div></div>`,'challenge',focus);
 }
 function report(exhibit){
  const r=exhibit.learning;
  display(`${heading('내가 남긴 탐구 기록','무엇을 근거로 설명했을까?')}
   <div class="learning-report">${r?`<div class="report-connections">${SCENES.map((s,i)=>`<article><h3>${i+1}. ${s.short}</h3><p>${s.report}</p><small>${r.links[i].attempts===1?'첫 연결에서 근거를 맞췄어.':'근거를 다시 살펴보고 연결을 고쳤어.'}</small></article>`).join('')}</div>
   <h3>새로운 무덤에서도 생각해 봤어</h3>${CASES.map((c,i)=>`<div class="case-result"><strong>${c.title}</strong><p>나의 첫 판단: ${c.options[r.cases[i].first]}</p>${r.cases[i].first===c.answer?'<span>첫 판단에서 근거의 범위를 지켰어.</span>':`<p class="revised-answer">고친 판단: ${c.options[c.answer]}</p>`}</div>`).join('')}<p class="report-note">이 기록은 이번에 한 활동이야. 새로운 유물에서도 설명할 수 있는지 더 확인해 보자.</p>`:'<p>이 전시는 이전 버전에서 만들었어. 생활 장면 연결과 새 사례 판단 기록은 없어.</p>'}
   ${button('전시로 돌아가기','report-back','class="story-primary"')}</div>`,'report');
 }
 function handle(target){
  if(mode==='report'){if(target.dataset.action==='report-back')onMuseum();return;}
  if(!story)return;
  if(mode==='workshop'){
   if(target.dataset.scene){active=target.dataset.scene;artifact='';reason=null;message='';workshop();return;}
   if(target.dataset.evidence){artifact=target.dataset.evidence;workshop();return;}
   if(target.dataset.reason!==undefined){reason=Number(target.dataset.reason);workshop(`[data-reason="${reason}"]`);return;}
   if(target.dataset.action==='change-evidence'){artifact='';reason=null;message='';workshop();return;}
   if(target.dataset.action==='connect'){
    const result=submitLink(story.learning,active,artifact,reason),s=SCENES.find(s=>s.id===active);
    message=result==='retry'?(artifact!==s.artifact?'거북: 이 장면을 뒷받침하는 유물을 다시 찾아봐. '+s.prompt:'거북: '+s.feedback[reason]):'';
    workshop(result==='retry'?'.learning-feedback':'#story-title');return;
   }
   if(target.dataset.action==='learning-next'){
    if(connectionsComplete(story.learning)){mode='challenge';caseIndex=0;message='';challenge();}
    else{active=SCENES.find(s=>story.learning.links[s.id]?.artifact!==s.artifact||story.learning.links[s.id]?.reason!==s.answer).id;artifact='';reason=null;message='';workshop();}return;
   }
  }
  if(mode==='challenge'){
   if(target.dataset.caseAnswer!==undefined){const answer=Number(target.dataset.caseAnswer),result=submitCase(story.learning,CASES[caseIndex].id,answer);message=CASES[caseIndex].feedback[answer];challenge(result==='retry'?'.learning-feedback':'#story-title');return;}
   if(target.dataset.action==='case-next'&&story.learning.cases[CASES[caseIndex].id]?.answer===CASES[caseIndex].answer){if(caseIndex===CASES.length-1)onDone();else{caseIndex++;message='';challenge();}}
  }
 }
 return {start(s){story=s;mode='workshop';active=SCENES[0].id;artifact='';reason=null;message='';workshop();},handle,report(e){mode='report';report(e);}};
}
