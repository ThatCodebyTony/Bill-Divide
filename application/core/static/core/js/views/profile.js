import { $, $$ } from '../utils.js';
import { toast } from '../components/toast.js';
import { saveStore } from '../storage.js';
import { applyTheme } from '../theme.js';

export function renderProfile(App, currentUser){
  const initials = (App.username||'You').split(' ').map(s=>s[0]).join('').toUpperCase().slice(0,2);
  const prefs = App.preferences;
  const handles = App.paymentHandles;

  return `
    <div class="space-y-4">
      <div class="card">
        <div class="row" style="gap:12px;align-items:center;margin-bottom:12px">
          <div class="avatar">${initials}</div>
          <div>
            <h2>${App.username || 'You'}</h2>
            <div class="muted">${currentUser.email}</div>
          </div>
        </div>
        <button id="p-edit" class="btn outline" style="width:100%"><span class="i">👤</span>Edit Profile</button>
      </div>

      <div class="card">
        <h3>Preferences</h3>
        <div class="space-y-3" style="margin-top:8px">
          <div>
            <label>Currency</label>
            <select id="p-currency" class="select" style="margin-top:6px">
              ${['USD','EUR','GBP','JPY','CAD'].map(c=> `<option value="${c}" ${prefs.currency===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>

          <div>
            <label>Theme</label>
            <div class="row" style="margin-top:8px">
              <button data-theme="light" class="btn ${prefs.theme==='light'?'primary':''}">Light</button>
              <button data-theme="dark" class="btn ${prefs.theme==='dark'?'primary':''}">Dark</button>
            </div>
          </div>

          <div class="row" style="justify-content:space-between;align-items:center">
            <div>
              <label>Notifications</label>
              <div class="hint">Get notified about bill updates</div>
            </div>
            <label style="display:flex;align-items:center;gap:.5rem">
              <input id="p-notifs" type="checkbox" ${prefs.notifications?'checked':''}/> Enabled
            </label>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3>Payment Methods</h3>
          <button id="p-add-handle" class="btn outline" style="padding:.35rem .6rem">Add</button>
        </div>
        ${handles.length ? `
          <div class="space-y-2">
            ${handles.map((h,i)=>`
              <div class="card bg-subtle" data-handle="${i}" style="padding:10px;">
                <div class="row" style="justify-content:space-between;align-items:center">
                  <div>
                    <div style="font-weight:600">${h.type}</div>
                    <div class="muted" style="font-size:.9rem">${h.value}</div>
                  </div>
                  <button class="btn ghost p-del" title="Remove">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        `: `<p class="center muted" style="padding:10px 0">No payment methods added yet</p>`}
      </div>

      <div class="card">
        <h3>Account</h3>
        <div class="space-y-2" style="margin-top:8px">
          <button id="p-logout" class="btn outline" style="width:100%;justify-content:flex-start">🚪 Log Out</button>
          <button id="p-delete" class="btn outline" style="width:100%;justify-content:flex-start;color:var(--red-600)">🗑️ Delete Account</button>
        </div>
      </div>

      <div class="center hint" style="padding:8px 0">
        <div>BillSplit v1.0.0</div>
        <div>© 2025 All rights reserved</div>
      </div>
    </div>
  `;
}

export function bindProfile(App){
  $('#p-edit')?.addEventListener('click', ()=> toast('Edit profile coming soon!'));
  $('#p-currency')?.addEventListener('change', (e)=>{ App.preferences.currency = e.target.value; saveStore(App); App._rerender(); });

  $$('#view-profile [data-theme]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      App.preferences.theme = btn.getAttribute('data-theme');
      saveStore(App); applyTheme(App.preferences); App._rerender();
    });
  });

  $('#p-notifs')?.addEventListener('change', (e)=>{
    App.preferences.notifications = !!e.target.checked;
    saveStore(App); App._rerender();
  });

  $('#p-add-handle')?.addEventListener('click', ()=>{
    const type = prompt('Payment type (e.g., Venmo, CashApp, PayPal)'); if(!type) return;
    const value = prompt(`${type} handle/ID`); if(!value) return;
    App.paymentHandles.push({type, value}); saveStore(App); toast('Payment method added'); App._rerender();
  });

  document.querySelectorAll('#view-profile .p-del').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('[data-handle]'); const idx = Number(card.getAttribute('data-handle'));
      App.paymentHandles.splice(idx,1); saveStore(App); toast('Payment method removed'); App._rerender();
    });
  });

  $('#p-logout')?.addEventListener('click', ()=>{
    if(confirm('Are you sure you want to log out?')){
      toast('Logged out successfully!');
      App.isLoggedIn = false; App.username = '';
      localStorage.removeItem('billSplitter_auth');
      App.currentIndex = 0; App.lastIndex = 0;
      location.hash = 'home';
      App._rerender();
    }
  });

  $('#p-delete')?.addEventListener('click', ()=>{
    if(confirm('Are you sure you want to delete your account? This action cannot be undone.')){
      toast('Delete account functionality coming soon!');
    }
  });
}
