import { ARTIFACTS, NICKNAMES } from './story-data.js';
import { observe, chooseClue, classifyUnknown, makeExhibit } from './story-model.js';
import { drawArtifact } from './artwork.js';

export function createStoryUI(root,{onNext,onComplete,onRestart,onHome}) {
  let story=null,view='',selectedNote='',feedback='',nickname=NICKNAMES[0];
  const art=(id,extra='')=>`<div class="artifact-picture ${extra}"><canvas data-artifact="${id}" role="img" aria-label="${ARTIFACTS.find(a=>a.id===id).name} 도판"></canvas></div>`;
  const button=(label,action,extra='')=>`<button type="button" data-action="${action}" ${extra}>${label}</button>`;
  const heading=(tag,title)=>`<div class="story-heading"><p>${tag}</p><h2 id="story-title" tabindex="-1">${title}</h2></div>`;
  function paint() {
    for(const canvas of root.querySelectorAll('canvas')) {
      const r=canvas.getBoundingClientRect();if(!r.width||!r.height)continue;
      const dp=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*dp);canvas.height=Math.round(r.height*dp);
      drawArtifact(canvas.getContext('2d'),canvas.dataset.artifact,0,0,canvas.width,canvas.height);
    }
  }
  new ResizeObserver(paint).observe(root);
  function display(html,focus='#story-title') {
    root.classList.remove('hidden');root.dataset.view=view;root.innerHTML=html;paint();
    if(focus==='#story-title')root.scrollTop=0;
    root.querySelector(focus)?.focus({preventScroll:true});
  }
  function inspect(focus) {
    view='inspect';const a=ARTIFACTS[story.index],ready=story.observed.length===2;
    const controls=a.observations.map(o=>`<button type="button" class="observation ${story.observed.includes(o.id)?'seen':''}" data-observe="${o.id}" aria-pressed="${story.observed.includes(o.id)}"><b>${story.observed.includes(o.id)?'✓':'＋'}</b>${o.label}</button>`).join('');
    display(`${heading(`단서 ${story.index+1} / 3 · ${a.name}`,'유물이 말을 걸어왔어')}
      <div class="investigation">${art(a.id)}<div class="investigation-copy">
        <p class="story-instruction">두 곳을 살펴서 주인의 흔적을 찾아봐.</p>
        <div class="observations">${controls}</div>
        <p class="field-note" role="status">${selectedNote||'궁금한 부분을 눌러 봐.'}</p>
        ${a.id==='saddle'?'<p class="replica-note">원본은 보존 중 · 지금은 복제 도판 관찰</p>':''}
        ${button('단서로 생각해 보기','infer',`class="story-primary" ${ready?'':'disabled'}`)}
      </div></div>`,focus);
  }
  function infer() {
    view='infer';const a=ARTIFACTS[story.index];
    display(`${heading(`${a.name}에서 발견한 흔적`,a.question)}
      <div class="investigation">${art(a.id)}<div class="investigation-copy">
        <p class="observed-summary">${a.observations.map(o=>o.text).join('<br>')}</p>
        <div class="story-choices">${a.options.map((text,i)=>`<button type="button" data-choice="${i}" ${story.attempts>=2&&i===a.answer?'class="suggested"':''}>${text}</button>`).join('')}</div>
        <p class="field-note" role="status">${feedback||'유물에서 알 수 있는 만큼만 짐작해 보자.'}</p>
        ${button('특징 다시 보기','inspect','class="story-link"')}
      </div></div>`);
  }
  function solved() {
    view='solved';const a=ARTIFACTS[story.index];
    display(`${heading('기억 조각을 찾았어!',a.clue)}
      <div class="investigation">${art(a.id)}<div class="investigation-copy">
        <p class="evidence-line">${a.reason}</p><blockquote>${a.memory}</blockquote>
        <div class="memory-trail" aria-label="모은 단서">${ARTIFACTS.map(item=>`<span class="${story.clues.includes(item.id)?'collected':''}">${story.clues.includes(item.id)?item.clue:'아직 모르는 이야기'}</span>`).join('')}</div>
        ${button(a.next,'next','class="story-primary"')}
      </div></div>`);
  }
  function board() {
    view='board';
    display(`${heading('세 흔적이 한 사람에게 이어졌어','어디까지 알아낸 걸까?')}
      <div class="evidence-board">${ARTIFACTS.map(a=>`<article>${art(a.id)}<h3>${a.clue}</h3><p>${a.caption}</p></article>`).join('')}</div>
      <div class="unknown-question"><p>거북: 그런데 이 사람의 진짜 이름은?</p>
        <div class="story-choices horizontal">${button('세 유물이 있으니 이름도 알아','known-name')}${button('아직은 알 수 없어','unknown-name')}</div>
        <p class="field-note" role="status">${feedback||'확실한 흔적과 아직 모르는 것을 나눠 보자.'}</p></div>`);
  }
  function naming() {
    view='naming';
    display(`${heading('이름은 몰라도, 이야기는 남길 수 있어','우리 전시에 별명을 붙이자')}
      <div class="naming-scene"><div class="name-plaque"><span>우리가 붙인 별명</span><strong>${nickname}</strong><small>실제 주인의 이름은 아직 몰라</small></div>
      <div class="investigation-copy"><blockquote>개구리: 이름은 못 찾았네…<br>거북: 대신 어떤 삶이었는지 함께 알아냈잖아.</blockquote>
      <div class="nickname-options">${NICKNAMES.map(n=>`<button type="button" data-nickname="${n}" aria-pressed="${nickname===n}">${n}</button>`).join('')}</div>
      ${button('우리의 첫 전시 열기','complete','class="story-primary"')}</div></div>`);
  }
  function museum(exhibit,saved,archive=false) {
    view='museum';
    display(`${heading('첫 번째 이야기 · 전시 완성',exhibit.nickname)}
      <p class="museum-intro">주인의 이름은 아직 모르지만, 세 흔적은 남았어.</p>
      <div class="museum-shelf">${ARTIFACTS.map(a=>`<article>${art(a.id)}<h3>${a.name}</h3><p>${a.caption}</p></article>`).join('')}</div>
      <div class="museum-ending"><p>개구리: 다음에 만나도 기억할 수 있겠다!<br>거북: 우리가 찾은 근거를 이렇게 남겨 두면 돼.</p>
      <p class="save-status" role="status">${archive?'이 기기에 남겨 둔 전시야.':saved?'전시를 이 기기에 남겼어. 첫 화면에서 다시 볼 수 있어.':'이 기기에는 저장하지 못했어. 지금은 계속 볼 수 있어.'}</p>
      <div class="story-choices horizontal">${button('다시 발굴하기','restart','class="story-primary"')}${button('첫 화면으로','home')}</div></div>`);
  }
  root.addEventListener('click',e=>{
    const target=e.target.closest('button');if(!target||target.disabled)return;
    if(target.dataset.observe&&view==='inspect'){
      observe(story,target.dataset.observe);selectedNote=ARTIFACTS[story.index].observations.find(o=>o.id===target.dataset.observe).text;
      inspect(`[data-observe="${target.dataset.observe}"]`);return;
    }
    if(target.dataset.choice!==undefined&&view==='infer'){
      const result=chooseClue(story,Number(target.dataset.choice));
      if(result==='solved')solved();else if(result==='retry'){feedback=ARTIFACTS[story.index].retry;infer();}return;
    }
    if(target.dataset.nickname&&view==='naming'){
      nickname=target.dataset.nickname;naming();root.querySelector(`[data-nickname="${nickname}"]`)?.focus();return;
    }
    switch(target.dataset.action){
      case 'infer':if(story.observed.length===2){feedback='';infer();}break;
      case 'inspect':inspect();break;
      case 'next':onNext();break;
      case 'known-name':feedback='뱀: 이름까지 맞혔다고 하려면, 이름의 근거도 있어야겠네.';board();break;
      case 'unknown-name':if(classifyUnknown(story,'unknown-name'))naming();break;
      case 'complete':{const exhibit=makeExhibit(story,nickname);if(exhibit)onComplete(exhibit);break;}
      case 'restart':onRestart();break;
      case 'home':onHome();break;
    }
  });
  return {
    inspect(s){story=s;selectedNote='';feedback='';inspect();},
    board(s){story=s;feedback='';board();},museum,
    hide(){root.classList.add('hidden');root.innerHTML='';view='';},
  };
}
