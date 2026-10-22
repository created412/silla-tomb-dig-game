// 실제 화면 문구로 음원 작업 목록을 만든다. 네트워크 호출·유료 생성 없음.
import { LINES } from '../prototype/src/lines.js';
import { ARTIFACTS, FRIENDS } from '../prototype/src/levels.js';
import { COMICS } from '../prototype/src/comics.js';
import { ARTIFACT_STORIES } from '../prototype/src/artifact-stories.js';
import { writeFileSync } from 'node:fs';
const clips = [];
const add = (key, who, text) => clips.push({ key, who, text });
for (const [id, lines] of Object.entries(LINES)) lines.forEach((line, i) => {
  if (line.text.includes('{name}')) {
    for (const [artifact, { name }] of Object.entries(ARTIFACTS)) {
      const particle = (name.charCodeAt(name.length - 1) - 0xac00) % 28 === 0 ? '' : '이';
      add(`found-${artifact}`, line.who, line.text.replace('{name}이', name + particle));
    }
  } else add(`line-${id}-${i}`, line.who, line.text);
});
for (const [id, comic] of Object.entries(COMICS)) {
  comic.panels.forEach((p, i) => add(`comic-${id}-${i}`, p.who, p.text));
  add(`question-${id}`, 'bird', [comic.question, ...comic.choices.map(c => c.text)].join(' '));
  comic.choices.forEach((c, i) => add(`answer-${id}-${i}`, c.gag.who, c.gag.text));
}
for (const [who, f] of Object.entries(FRIENDS)) {
  add(`join-${who}`, who, `${f.intro.join(' ')} ${f.power}. ${f.desc.replace('3×3', '세 칸씩 아홉 칸').replace('3초', '삼 초')}`);
}
for (const id of Object.keys(ARTIFACTS)) {
  const s = ARTIFACT_STORIES[id];
  add(`story-${id}`, 'snake', [ARTIFACTS[id].name, s.period, s.age, s.place, s.what, ...s.hello, s.note].join('. '));
}
writeFileSync(new URL('../prototype/assets/voices/script.json', import.meta.url), JSON.stringify({ language: 'ko', audience: '유아·초등', direction: '다정하고 또박또박, 소리 지르지 않기. 문장 사이에 짧은 쉼. 낯선 낱말도 명확하게.', clips }, null, 2) + '\n');
console.log(`${clips.length} clips, ${clips.reduce((n,c)=>n+c.text.length,0)} characters`);
