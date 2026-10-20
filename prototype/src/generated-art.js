// Local, cached crops of the commissioned Higgsfield atlases.
export const materialsImage=new Image();
materialsImage.src=new URL('../assets/higgsfield/dig-materials.png',import.meta.url).href;
const relicImage=new Image(),relics=new Map();
relicImage.src=new URL('../assets/higgsfield/relics-atlas.png',import.meta.url).href;
relicImage.onload=()=>{
 const cw=relicImage.width/3,ch=relicImage.height/2;
 ['crown','saddle','glass','ewer','belt','mounds'].forEach((id,n)=>{
  const c=document.createElement('canvas');c.width=Math.floor(cw);c.height=Math.floor(ch);const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(relicImage,(n%3)*cw,Math.floor(n/3)*ch,cw,ch,0,0,c.width,c.height);
  const pixels=x.getImageData(0,0,c.width,c.height);let left=c.width,top=c.height,right=0,bottom=0;
  for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){const k=(y*c.width+xx)*4,r=pixels.data[k],g=pixels.data[k+1],b=pixels.data[k+2],key=Math.min(r,b)-g;
   if(key>75&&r>120&&b>120)pixels.data[k+3]=0;
   else {if(key>45)pixels.data[k+3]=Math.round(255*(75-key)/30);left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  x.putImageData(pixels,0,0);relics.set(id,{image:c,x:left,y:top,w:right-left+1,h:bottom-top+1});
 });
};
export function drawGeneratedArtifact(c,id,x,y,w,h){const a=relics.get(id);if(!a)return false;const scale=Math.min(w*.91/a.w,h*.91/a.h),dw=a.w*scale,dh=a.h*scale;c.drawImage(a.image,a.x,a.y,a.w,a.h,x+(w-dw)/2,y+(h-dh)/2,dw,dh);return true;}
export function paintMaterial(c,kind,w,h){if(!materialsImage.complete||!materialsImage.naturalWidth)return false;const n={soil:0,rock:1,wood:2,museum:3}[kind],cw=materialsImage.width/2,ch=materialsImage.height/2;c.drawImage(materialsImage,(n%2)*cw,Math.floor(n/2)*ch,cw,ch,0,0,w,h);return true;}
