export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
export const on = (el, evt, fn) => el && el.addEventListener(evt, fn);
export const uid = (p='id') => p + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
export const fmt = (n, currency='USD') => new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n || 0);
export const clamp2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
