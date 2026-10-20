// 그림 선택지와 놀이 소품: 외부 이미지 없이 직접 그린 SVG.
export function icon(id){
 const human='<circle cx="60" cy="35" r="15" fill="#d2a976"/><path d="M40 57Q60 48 80 57L88 106H32Z" fill="#64886e"/>';
 const hills=n=>Array.from({length:n},(_,i)=>`<path d="M${n===1?10:i*43+2} 95Q${n===1?60:i*43+37} 9 ${n===1?110:i*43+72} 95Z" fill="${i?'#4e815c':'#85a168'}" stroke="#416d50" stroke-width="3"/>`).join('');
 const art={
 person:human+'<path d="M42 18V3L52 12L60 1L68 12L78 3V18Z" fill="#e4bc54"/>',
 name:'<rect x="12" y="15" width="96" height="88" rx="14" fill="#efe4be" stroke="#ab8953" stroke-width="5"/><text x="60" y="80" text-anchor="middle" font-size="63" fill="#766149">?</text>',
 horse:'<path d="M20 63Q40 47 76 59L87 25L106 34L99 49L89 50L80 80H32Z" fill="#a88154" stroke="#725338" stroke-width="4"/><path d="M35 78L30 107M69 78L83 105M20 63L7 82" stroke="#725338" stroke-width="7"/><path d="M43 60H67V83H43Z" fill="#e8d4a0"/>',
 frame:'<rect x="13" y="17" width="94" height="85" fill="#b58c56"/><rect x="24" y="28" width="72" height="63" fill="#e7d6ad"/><path d="M26 78L48 51L69 72L83 47L96 78" stroke="#8ca477" fill="none" stroke-width="5"/>',
 traveler:human+'<rect x="78" y="64" width="28" height="39" rx="7" fill="#cf9f55"/><path d="M86 65V54H99V65" fill="none" stroke="#735437" stroke-width="4"/>',
 trade:'<path d="M8 34H102L88 19M112 87H18L32 103" stroke="#698d70" stroke-width="9" fill="none"/><rect x="36" y="43" width="48" height="38" rx="6" fill="#af8750"/><path d="M60 44V81" stroke="#e6c78a" stroke-width="5"/>',
 repair:'<path d="M38 24H77L69 97H46Z" fill="#34738a"/><path d="M76 36C110 34 109 78 73 76" stroke="#397789" stroke-width="9" fill="none"/><path d="M85 37L99 44M89 44L102 51M90 57L102 62M86 66L97 72" stroke="#e6c050" stroke-width="4"/>',
 sleep:'<ellipse cx="60" cy="76" rx="39" ry="25" fill="#bc9063"/><path d="M33 72L48 75M71 75L86 72" stroke="#5b4937" stroke-width="5"/><text x="67" y="38" font-size="37" fill="#657c67">Z</text>',
 fish:'<path d="M20 60Q62 12 94 60Q62 108 20 60L5 40V80Z" fill="#dfb753" stroke="#a47c30" stroke-width="4"/><circle cx="80" cy="56" r="4" fill="#554630"/>',
 'one-hill':hills(1),'two-hills':hills(2),
 headphones:'<path d="M24 65V46a36 36 0 0 1 72 0V65" fill="none" stroke="#655d84" stroke-width="12"/><rect x="14" y="56" width="23" height="43" rx="10" fill="#9388b9"/><rect x="83" y="56" width="23" height="43" rx="10" fill="#9388b9"/>',
 phone:'<rect x="31" y="9" width="58" height="102" rx="12" fill="#5d6c83"/><rect x="37" y="22" width="46" height="69" fill="#9ac9bd"/><circle cx="60" cy="101" r="4" fill="#eee3bb"/>',
 controller:'<path d="M28 32H92Q112 46 111 89Q106 108 83 80H37Q12 108 9 88Q8 45 28 32Z" fill="#857ca7"/><path d="M35 45V69M23 57H47" stroke="#ece3be" stroke-width="8"/><circle cx="82" cy="51" r="6" fill="#dfae6c"/><circle cx="96" cy="66" r="6" fill="#80bfa5"/>',
 rocket:'<path d="M60 6Q89 31 81 83H39Q31 31 60 6Z" fill="#ddd9c4" stroke="#5d7592" stroke-width="4"/><circle cx="60" cy="44" r="14" fill="#83b7c6"/><path d="M39 68L19 99L41 88M81 68L101 99L79 88M49 87L60 115L71 87" fill="#dc9e63"/>',
 board:'<path d="M10 63Q60 86 110 63" fill="none" stroke="#9c81aa" stroke-width="13"/><circle cx="31" cy="90" r="10" fill="#6c7a79"/><circle cx="89" cy="90" r="10" fill="#6c7a79"/>',
 scooter:'<path d="M29 91H84L68 21H47" fill="none" stroke="#829eaa" stroke-width="9"/><circle cx="27" cy="98" r="13" fill="#5e6e78"/><circle cx="91" cy="98" r="13" fill="#5e6e78"/>',
 };
 return `<svg viewBox="0 0 120 120" aria-hidden="true">${art[id]||art.person}</svg>`;
}
export const sillyIcons=['headphones','phone','controller','rocket','board','scooter'];
