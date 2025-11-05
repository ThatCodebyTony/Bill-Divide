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
    $('#title').textContent = 'BillSplit';
    $('nav.bottom').classList.add('hidden');
    $('#screen').innerHTML = `
      <section class="view active">
        <div class="card" style="max-width:520px;margin:40px auto;">
          <div class="center space-y">
            <div class="logo" style="width:64px;height:64px;font-size:28px">🧾</div>
            <h1>Bill Splitter</h1>
            <p class="muted">Split bills with friends easily</p>
          </div>
          <div class="space-y-3" style="margin-top:18px">
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

  $('nav.bottom').classList.remove('hidden');
  const idx = App.currentIndex;
  $('#title').textContent = views[idx].title;

  const screens = `
    <section id="view-home" class="view ${idx===0?'active':''}">${renderHome(App)}</section>
    <section id="view-bills" class="view ${idx===1?'active':''}">${renderBills(App)}</section>
    <section id="view-profile" class="view ${idx===2?'active':''}">${renderProfile(App, currentUser)}</section>
  `;
  $('#screen').innerHTML = screens;

  bindHome(App, { navigate });
  bindBills(App);
  bindProfile(App);

  updateNavActive(idx);
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
  if(targetIndex === App.currentIndex) return;
  App.lastIndex = App.currentIndex;
  App.currentIndex = targetIndex;
  setHash(targetIndex);
  render();
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
