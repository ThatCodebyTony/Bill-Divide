import { $ } from '../utils.js';

export function toast(msg, type='info'){
  const wrap = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>wrap.removeChild(t), 180)}, 2200);
}
