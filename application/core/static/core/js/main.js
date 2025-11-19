// main.js
import { $, $$ } from './utils.js';
import { App, initState, currentUser } from './state.js';
import { auth, saveStore } from './storage.js';
import { views, setHash, viewFromHash, updateNavActive } from './router.js';
import { renderHome, bindHome } from './views/home.js';
import { renderBills, bindBills } from './views/bills.js';
import { renderProfile, bindProfile } from './views/profile.js';
import { toast } from './components/toast.js';

// tiny render hub
function render(){
  if(!App.isLoggedIn){
    $('header.app').classList.add('hidden');  
    $('nav.bottom').classList.add('hidden');
    $('#title').textContent = 'Bill Divide';
    $('#screen').innerHTML = `
    <section class="view active">
      <div class="card" style="max-width:520px;margin:40px auto;">
        <div class="center space-y">
          <div class="logo login-logo">
            <img src="${window.APP_ASSETS?.logo || '/static/core/img/logo.png'}" alt="Bill Divide Logo" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />
          </div>
        </div>
        <div class="space-y-3">
          <label>Username</label>
          <input id="login-username" class="input" type="text" placeholder="Enter your username" autocomplete="username" />
          <label>Password</label>
          <input id="login-password" class="input" type="password" placeholder="Enter your password" autocomplete="current-password" />
          <button id="login-submit" class="btn primary" style="width:100%">Log In</button>
          <p class="center hint">Demo app – use any username/password to login</p>
        </div>
      </div>
    </section>
    `;
    bindLogin();
    return;
  }

  $('header.app').classList.remove('hidden');  
  $('nav.bottom').classList.remove('hidden');

  const screen = $('#screen');
  const prevScrollTop = screen.scrollTop;

  const idx = App.currentIndex;
  $('#title').textContent = views[idx].title;

  const screens = `
    <section id="view-home" class="view ${idx===0?'active':''}">${renderHome(App)}</section>
    <section id="view-bills" class="view ${idx===1?'active':''}">${renderBills(App)}</section>
    <section id="view-profile" class="view ${idx===2?'active':''}">${renderProfile(App, currentUser)}</section>
  `;
  screen.innerHTML = screens;

  bindHome(App, { navigate });
  bindBills(App);
  bindProfile(App);

  updateNavActive(idx);
  screen.scrollTop = prevScrollTop;
}

App._rerender = render; // expose to submodules

function bindLogin(){
  const u = $('#login-username');
  const p = $('#login-password');
  $('#login-submit')?.addEventListener('click', ()=>{
    if(!u.value.trim()){ toast('Please enter a username','error'); return; }
    if(!p.value.trim()){ toast('Please enter a password','error'); return; }
    toast(`Welcome back, ${u.value}!`,'success');
    App.isLoggedIn = true;
    App.username = u.value.trim();
    auth.save({ isLoggedIn:true, username:App.username });
    if(!location.hash) setHash(0);
    render();
  });
}

function navigate(targetIndex){
  if (targetIndex === App.currentIndex) return;

  const prev = App.currentIndex;
  const movingRight = targetIndex > prev;

  const fromEl = document.querySelector(`#view-${views[prev].hash}`);
  const toEl   = document.querySelector(`#view-${views[targetIndex].hash}`);

  if (!fromEl || !toEl){
    App.lastIndex = prev; App.currentIndex = targetIndex; setHash(targetIndex); render(); return;
  }

  // prepare: keep both visible; place the entering view just off-screen
  toEl.classList.add('active', movingRight ? 'from-right' : 'from-left');
  fromEl.classList.add('active'); // ensure it's visible during the slide

  // disable interactions on the outgoing view during the swipe
  fromEl.classList.add('is-sliding');

  // kick off the slide on the next paint: new view to center, old view out
  requestAnimationFrame(() => requestAnimationFrame(() => {
    toEl.classList.remove('from-right','from-left'); // animates to transform: 0
    fromEl.classList.add(movingRight ? 'exit-left' : 'exit-right'); // animates out
  }));

  // clean up when the entering view finishes its transform
  const onDone = (ev) => {
    if (ev.propertyName !== 'transform') return;
    toEl.removeEventListener('transitionend', onDone);

    fromEl.classList.remove('active','exit-left','exit-right','is-sliding');
    toEl.classList.remove('from-left','from-right');

    App.lastIndex = prev;
    App.currentIndex = targetIndex;
    setHash(targetIndex);
    updateNavActive(targetIndex);
    $('#title').textContent = views[targetIndex].title;
  };
  toEl.addEventListener('transitionend', onDone, { once: true });
}


// wire nav
$('#tab-home')?.addEventListener('click', ()=>navigate(0));
$('#tab-bills')?.addEventListener('click', ()=>navigate(1));
$('#tab-profile')?.addEventListener('click', ()=>navigate(2));

window.addEventListener('hashchange', ()=>{
  const idx = viewFromHash();
  if(idx !== App.currentIndex) navigate(idx);
});
window.addEventListener('keydown', (e)=>{
  if(e.key==='ArrowLeft' && App.currentIndex>0) navigate(App.currentIndex-1);
  if(e.key==='ArrowRight' && App.currentIndex<views.length-1) navigate(App.currentIndex+1);
});

// boot
const a = auth.load();
initState(a);
if(!location.hash) setHash(App.currentIndex);
else App.currentIndex = viewFromHash();
render();
