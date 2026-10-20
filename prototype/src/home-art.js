import {drawCharacter} from './characters.js';
import {drawArtifact} from './artwork.js';

export function drawHomeArt(root,t){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const c of root.querySelectorAll('canvas')){
  const r=c.getBoundingClientRect(),dp=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dp),h=Math.round(r.height*dp);
  if(!w||!h)continue;
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);
  if(c.dataset.homeArt)drawArtifact(ctx,c.dataset.homeArt,0,0,w,h);
  else drawCharacter(ctx,c.dataset.homeFriend,w*.5,h*.94,Math.min(w,h)*.93,t,'idle',false,reduced);
 }
}
