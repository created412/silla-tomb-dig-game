const paths={
 home:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
 friends:'<circle cx="8" cy="8" r="4"/><circle cx="18" cy="9" r="3"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m2-6a5 5 0 0 1 6 5v1"/>',
 museum:'<path d="m2 8 10-5 10 5ZM3 21h18M5 11v7m7-7v7m7-7v7"/>',
};
export const uiIcon=name=>paths[name]?`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`:'';
