// One commissioned Higgsfield sheet. Local silhouette masks remove its backdrop;
// no remote calls, background-removal service, or physics changes at runtime.
const atlas=new Image(),sprites=new Map();
const shapes={
 terrain:{box:[13,132,389,164],path:'M16 181 Q18 157 34 151 L31 145 L44 148 L53 137 L59 146 L76 140 L84 151 Q180 147 275 150 L319 151 L339 139 L350 147 L369 144 L378 155 Q398 159 397 181 L390 227 L389 273 Q387 291 369 293 L50 294 Q25 292 23 275 L23 217 Z'},
 sign:{box:[429,61,186,256],path:'M476 63 Q493 59 506 66 L506 100 L574 101 L612 126 L577 153 L507 155 L510 259 L525 247 L531 225 L536 245 L545 234 L541 260 L555 269 Q572 270 573 288 L576 302 Q548 318 495 314 L443 308 L431 301 L444 291 L447 264 L437 251 L430 229 L443 232 L457 259 L466 274 L469 158 L461 154 L465 137 L460 110 L468 96 Z'},
 tunnel:{box:[616,66,397,244],path:'M618 292 L626 267 L634 249 L644 231 L653 210 L670 194 L685 185 L700 169 L701 144 L690 122 L704 128 L703 102 L715 115 L720 91 L727 98 L730 68 L738 88 L750 77 L747 108 L764 103 Q783 87 801 96 L821 111 L843 115 L855 127 L880 130 L885 106 L898 91 L899 112 L914 108 L909 133 L923 150 L938 163 L960 178 L964 162 L979 157 L976 182 L984 205 Q1007 219 1005 242 L1010 271 L1010 295 Q969 313 918 304 L881 302 L890 286 L888 259 Q882 226 859 212 Q831 190 804 192 Q779 191 764 209 Q745 227 744 250 L741 275 L760 300 Q717 313 665 307 L620 302 Z'},
 mound:{box:[15,422,334,181],path:'M19 572 L35 558 L44 544 L69 532 L65 511 L48 498 L69 501 L56 481 L76 493 L68 462 L86 491 L80 437 L100 476 L109 426 L112 474 L129 447 L122 492 L143 479 L156 472 L171 462 L190 471 L207 476 L219 491 L232 494 L253 521 L263 517 L269 494 L284 482 L278 512 L297 497 L289 532 L310 543 L317 555 L335 564 L347 578 L327 588 L291 596 L211 601 L140 598 L84 598 L40 591 Z'},
 boulder:{box:[391,417,241,192],path:'M392 554 Q394 518 417 487 L440 458 L467 442 L486 428 Q513 413 543 420 L568 428 L591 447 L608 472 L620 498 L629 528 L630 559 L621 584 L604 599 L569 606 L531 607 L484 603 L443 606 L412 593 Q393 584 392 554 Z'},
 station:{box:[677,393,337,224],path:'M699 417 L728 414 L728 398 L741 395 L746 416 L803 417 L811 424 L809 481 L750 484 L752 540 L766 541 L778 555 L775 606 L756 615 L706 615 L684 604 L685 567 L692 554 L689 537 L677 511 L683 501 L693 507 L705 531 L705 551 L721 549 L717 533 L713 518 L721 492 L728 501 L731 526 L733 538 L734 485 L701 484 Z M782 588 L797 565 L814 571 L819 491 L827 487 L836 490 L841 503 L858 517 L894 526 L937 518 L965 504 L965 490 L977 484 L986 490 L987 578 L1006 584 L1012 595 L988 600 L958 598 L951 589 L964 571 L967 513 L940 527 L921 571 L904 558 L896 543 L891 533 L874 578 L858 560 L846 531 L838 519 L837 578 L848 590 L837 600 L815 607 L788 601 Z'},
};
atlas.onload=()=>{for(const [name,{box,path}] of Object.entries(shapes)){
 const [x,y,w,h]=box,c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d');g.translate(-x,-y);g.clip(new Path2D(path));g.drawImage(atlas,0,0);sprites.set(name,c);
}};
atlas.src=new URL('../assets/higgsfield/adventure-props-atlas.png',import.meta.url).href;
export function drawAdventureProp(ctx,name,x,feet,width,height){
 const s=sprites.get(name);if(!s)return false;
 ctx.drawImage(s,x-width/2,feet-height,width,height);return true;
}
export function drawAdventureTerrain(ctx,f){
 const s=sprites.get('terrain');if(!s)return false;
 // Preserve the detailed end caps; mirror repeat the center instead of stretching
 // one tiny texture across a whole level. Walkable surface stays at physics f.y.
 const top=f.y-28,h=235,cap=38,sourceCap=42,sourceWidth=s.width-sourceCap*2;
 ctx.save();ctx.beginPath();ctx.rect(f.x-2,top,f.w+4,h);ctx.clip();
 ctx.drawImage(s,0,0,sourceCap,s.height,f.x-2,top,cap+2,h);
 const interior=f.w-cap*2,tile=210;
 for(let offset=0,i=0;offset<interior;offset+=tile,i++){
  const length=Math.min(tile,interior-offset);ctx.save();
  ctx.beginPath();ctx.rect(f.x+cap+offset,top,length,h);ctx.clip();
  ctx.translate(f.x+cap+offset+(i%2?tile:0),top);ctx.scale(i%2?-1:1,1);
  ctx.drawImage(s,sourceCap,0,sourceWidth,s.height,0,0,tile,h);ctx.restore();
 }
 ctx.drawImage(s,s.width-sourceCap,0,sourceCap,s.height,f.x+f.w-cap,top,cap+2,h);
 ctx.restore();return true;
}
