import { $ } from './utils.js';

export const views = [
  { index:0, title:'BillSplit', hash:'home' },
  { index:1, title:'Bills', hash:'bills' },
  { index:2, title:'Profile', hash:'profile' },
];

export function setHash(idx){
  const v = views[idx]; if(!v) return;
  location.hash = v.hash;
}
export function viewFromHash(){
  const h = location.hash.replace('#','');
  const v = views.find(v=>v.hash===h);
  return v ? v.index : 0;
}

export function updateNavActive(idx){
  $('#tab-home')?.classList.toggle('active', idx===0);
  $('#tab-bills')?.classList.toggle('active', idx===1);
  $('#tab-profile')?.classList.toggle('active', idx===2);
}
