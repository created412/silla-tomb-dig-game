// Higgsfield artwork commissioned for this game. Cutout paths are hand traced;
// clipping and animation run locally and incur no generation/API calls.
const atlas = new Image();
atlas.src = new URL('../assets/higgsfield/companions-atlas.png', import.meta.url).href;
export const worldImage = new Image();
worldImage.src = new URL('../assets/higgsfield/silla-world.png', import.meta.url).href;

const silhouettes = {
 frog: {box:[46,105,405,357],path:'M62 412 Q44 389 54 351 L57 302 Q63 273 80 244 L93 211 Q103 181 135 167 L159 149 Q173 125 203 117 L231 122 Q256 107 278 115 L299 114 Q333 103 352 112 Q389 102 405 129 L415 159 L420 183 Q444 199 446 225 L433 259 Q443 283 436 315 L416 370 Q421 393 407 417 Q390 439 373 434 L358 430 Q342 443 326 431 L302 422 L235 430 Q232 448 218 455 L201 450 Q186 465 174 450 Q160 459 147 449 L136 432 Q120 445 103 429 Q86 434 80 418 Z'},
 snake: {box:[574,34,408,426],path:'M731 44 Q756 33 786 37 Q829 38 848 58 L855 80 Q867 96 853 112 L826 124 Q800 126 770 119 Q731 137 732 171 Q733 204 775 235 Q806 259 815 289 L818 321 Q851 316 864 296 Q874 274 854 262 L857 237 Q885 244 909 265 Q941 297 945 337 L951 344 Q967 329 976 351 L979 374 Q975 399 950 420 Q930 439 893 443 Q851 458 807 457 L716 457 Q650 454 614 427 Q580 403 578 366 Q575 329 598 301 Q623 272 679 262 L696 256 Q662 220 661 169 Q662 112 694 75 Q708 55 731 44 Z'},
 turtle: {box:[32,587,447,365],path:'M38 867 Q43 831 68 799 Q66 753 87 710 Q108 667 144 642 Q195 598 251 592 Q305 588 338 610 Q365 625 376 656 L402 654 Q438 656 459 681 Q475 705 475 730 Q476 766 448 787 L440 803 Q457 822 459 846 L468 886 Q473 906 460 914 L449 911 Q441 921 428 917 L416 916 Q399 927 388 915 L367 888 L346 863 L324 865 Q326 891 314 911 L311 928 Q301 944 288 936 Q278 954 264 945 Q248 955 239 943 Q220 948 211 933 L201 908 L172 899 Q158 918 140 910 Q128 917 114 902 L104 892 Q91 910 76 901 Q57 914 48 902 Q30 898 38 867 Z'},
 bird: {box:[537,554,464,403],path:'M677 663 Q694 620 741 608 Q791 596 827 620 L841 644 Q862 620 882 605 L915 584 Q935 563 957 558 Q981 549 987 565 L987 584 Q1003 582 991 609 L981 627 Q999 622 995 643 L986 665 Q1000 664 991 685 L976 707 Q995 705 985 728 L967 745 Q985 743 970 765 L949 778 Q962 785 947 800 L927 809 Q943 821 925 831 L906 841 Q933 846 946 862 Q957 881 940 890 L915 892 L892 879 L867 878 Q853 902 831 912 L836 925 L852 937 Q862 952 844 955 L829 949 Q819 956 806 949 L789 938 L791 916 L754 915 L748 928 Q736 943 724 938 L709 939 Q691 942 685 929 Q669 928 676 916 L700 904 L707 887 Q669 869 652 838 Q634 807 638 775 Q615 767 607 749 L600 731 Q577 717 575 696 Q560 682 558 660 Q542 642 543 620 Q533 605 544 588 Q555 573 569 582 L591 603 L615 625 L644 649 L661 671 Z'},
};
const cutouts = new Map();
atlas.onload = () => {
 for (const [who,{box,path}] of Object.entries(silhouettes)) {
  const [x,y,w,h]=box, canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const c=canvas.getContext('2d');c.translate(-x,-y);c.clip(new Path2D(path));c.drawImage(atlas,0,0);
  cutouts.set(who,canvas);
 }
};

export function drawClayCharacter(c,who,x,y,size,t,mood,speaking,reduced) {
 const sprite=cutouts.get(who);if(!sprite)return false;
 const excited=mood==='glimmer'||mood==='artifactRevealed',startled=mood==='tooHard'||mood==='collapse';
 const ratio=Math.min(size/sprite.width,size*.92/sprite.height),w=sprite.width*ratio,h=sprite.height*ratio;
 const hop=reduced?0:mood==='artifactRevealed'?Math.abs(Math.sin(t/150))*size*.065:speaking?Math.abs(Math.sin(t/100))*size*.025:Math.sin(t/750)*size*.004;
 c.save();c.translate(x,y-hop);
 if(mood==='tooHard'&&!reduced)c.rotate(Math.sin(t/90)*.08);
 if(mood==='collapse'&&!reduced){const squash=Math.abs(Math.sin(t/150))*.09;c.scale(1+squash,1-squash);}
 c.drawImage(sprite,-w/2,-h,w,h);
 if(excited){c.fillStyle='#ffe49a';for(const [sx,sy,r] of [[-.48,-.65,5],[.48,-.85,7]]){c.save();c.translate(size*sx,size*sy);c.rotate(Math.PI/4);c.fillRect(-r/2,-r/2,r,r);c.restore();}}
 if(startled){c.font=`bold ${size*.18}px sans-serif`;c.textAlign='center';c.fillStyle='#fff3c8';c.strokeStyle='#70482a';c.lineWidth=2;c.strokeText('!',w*.35,-h*.96);c.fillText('!',w*.35,-h*.96);}
 if(mood==='collapse'){c.fillStyle='#888c73';c.beginPath();c.ellipse(-w*.22,-h-size*.025,size*.055,size*.035,-.25,0,Math.PI*2);c.fill();}
 c.restore();return true;
}

export function drawWorld(c,w,h) {
 if(!worldImage.complete||!worldImage.naturalWidth)return false;
 const scale=Math.max(w/worldImage.naturalWidth,h/worldImage.naturalHeight);
 const dw=worldImage.naturalWidth*scale,dh=worldImage.naturalHeight*scale;
 c.drawImage(worldImage,(w-dw)/2,(h-dh)/2,dw,dh);return true;
}
