import { $, $$ } from '../utils.js';
import { toast } from '../components/toast.js';
import { saveStore } from '../storage.js';
import { applyTheme } from '../theme.js';

export function renderProfile(App, currentUser){
  const initials = (App.username||'You').split(' ').map(s=>s[0]).join('').toUpperCase().slice(0,2);
  const prefs = App.preferences;
  const handles = App.paymentHandles;

  // ensure flags
  App._confirmingLogout ??= false;
  App._confirmingDelete ??= false;
  App.accountDeletionScheduled ??= false;
  App.accountDeletionScheduledAt ??= null;

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

      <div class="card" id="p-methods-card">
        <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3>Payment Methods</h3>
          <button id="p-add-handle" class="btn outline" style="padding:.35rem .6rem">Add</button>
        </div>

        <!-- Inline add form -->
        <div id="p-handle-form" class="card bg-subtle hidden" style="padding:10px;margin-bottom:10px">
          <div class="row" style="gap:.5rem;flex-wrap:wrap;align-items:flex-end">
            <div style="min-width:140px">
              <label style="display:block;font-size:.9rem" for="p-handle-type">Type</label>
              <select id="p-handle-type" class="select" style="margin-top:6px;min-width:140px">
                ${['Venmo','CashApp','PayPal','Bank','Other'].map(t=>`<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
            <div style="flex:1;min-width:200px">
              <label style="display:block;font-size:.9rem" for="p-handle-value">Handle / ID</label>
              <input id="p-handle-value" class="input" placeholder="@username or email or acct" style="margin-top:6px" />
            </div>
            <div class="row" style="gap:.5rem">
              <button id="p-save-handle" class="btn primary">Save</button>
              <button id="p-cancel-handle" class="btn outline">Cancel</button>
            </div>
          </div>
          <div id="p-handle-error" class="hint" style="color:var(--neg-fg);margin-top:6px;display:none">Please enter a handle/ID.</div>
        </div>

        ${handles.length ? `
          <div id="payment-list" class="space-y-2">
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
        `: `<p id="payment-list" class="center muted" style="padding:10px 0">No payment methods added yet</p>`}
      </div>

      <div class="card">
        <h3>Account</h3>
        <div class="space-y-2" style="margin-top:8px">

          <!-- Logout -->
          ${
            App._confirmingLogout
              ? `
                <div class="confirm-bar">
                  <div>Are you sure you want to log out?</div>
                  <div class="actions">
                    <button id="p-logout-confirm" class="btn primary">Log Out</button>
                    <button id="p-logout-cancel" class="btn outline">Cancel</button>
                  </div>
                </div>
              `
              : `<button id="p-logout" class="btn outline" style="width:100%;justify-content:flex-start">🚪 Log Out</button>`
          }

          <!-- Delete Account -->
          ${
            App.accountDeletionScheduled
              ? `
                <button id="p-delete-cancel" class="btn outline" style="width:100%;justify-content:flex-start;color:var(--red-600)"
                  data-state="scheduled">
                  ⏳ Deletion in 24 hours
                </button>
                <div class="hint" style="margin-top:4px">
                  Scheduled at: ${new Date(App.accountDeletionScheduledAt).toLocaleString()}
                </div>
              `
              : App._confirmingDelete
                ? `
                  <div class="confirm-bar">
                    <div>This will schedule your account for deletion in 24 hours.</div>
                    <div class="actions">
                      <button id="p-delete-confirm" class="btn destructive">Schedule Deletion</button>
                      <button id="p-delete-cancelprompt" class="btn outline">Cancel</button>
                    </div>
                  </div>
                `
                : `<button id="p-delete" class="btn outline" style="width:100%;justify-content:flex-start;color:var(--red-600)">🗑️ Delete Account</button>`
          }
        </div>
      </div>

      <div class="center hint" style="padding:8px 0">
        <div>Bill Divide v1.0.0</div>
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

  // Inline add form
  const formEl = $('#p-handle-form');
  const addBtn = $('#p-add-handle');
  const saveBtn = $('#p-save-handle');
  const cancelBtn = $('#p-cancel-handle');
  const typeEl = $('#p-handle-type');
  const valueEl = $('#p-handle-value');
  const errEl = $('#p-handle-error');

  addBtn?.addEventListener('click', ()=>{
    formEl?.classList.toggle('hidden');
    if(!formEl?.classList.contains('hidden')){
      errEl.style.display = 'none';
      valueEl.value = '';
      typeEl.value = 'Venmo';
      valueEl.focus();
    }
  });

  saveBtn?.addEventListener('click', ()=>{
    const type = (typeEl?.value || '').trim();
    const value = (valueEl?.value || '').trim();
    if(!value){
      errEl.style.display = 'block';
      valueEl?.focus();
      return;
    }
    App.paymentHandles.push({ type, value });
    saveStore(App);
    toast('Payment method added');
    App._rerender();
  });

  cancelBtn?.addEventListener('click', ()=> formEl?.classList.add('hidden'));

  // Delete handle
  $('#payment-list')?.addEventListener('click', (e)=>{
    const delBtn = e.target.closest('.p-del');
    if(!delBtn) return;
    const card = delBtn.closest('[data-handle]');
    if(!card) return;
    const idx = Number(card.getAttribute('data-handle'));
    App.paymentHandles.splice(idx, 1);
    saveStore(App);
    toast('Payment method removed');
    App._rerender();
  });

  // Logout inline confirm
  $('#p-logout')?.addEventListener('click', ()=>{
    App._confirmingLogout = true;
    App._rerender();
  });
  $('#p-logout-cancel')?.addEventListener('click', ()=>{
    App._confirmingLogout = false;
    App._rerender();
  });
  $('#p-logout-confirm')?.addEventListener('click', ()=>{
    toast('Logged out successfully!');
    App.isLoggedIn = false;
    App.username = '';
    localStorage.removeItem('Bill Divideter_auth');
    App.currentIndex = 0;
    App.lastIndex = 0;
    App._confirmingLogout = false;
    location.hash = 'home';
    saveStore(App);
    App._rerender();
  });

  // Delete account inline flow
  $('#p-delete')?.addEventListener('click', ()=>{
    App._confirmingDelete = true;
    App._rerender();
  });
  $('#p-delete-cancelprompt')?.addEventListener('click', ()=>{
    App._confirmingDelete = false;
    App._rerender();
  });
  $('#p-delete-confirm')?.addEventListener('click', ()=>{
    App.accountDeletionScheduled = true;
    App.accountDeletionScheduledAt = new Date().toISOString();
    App._confirmingDelete = false;
    saveStore(App);
    toast('Account deletion scheduled in 24 hours.');
    App._rerender();
  });

  // Hover cancel deletion
  const cancelDelBtn = $('#p-delete-cancel');
  if(cancelDelBtn){
    cancelDelBtn.addEventListener('mouseenter', ()=>{
      cancelDelBtn.textContent = '❌ Cancel Deletion';
      cancelDelBtn.style.background = 'var(--neg-bg)';
      cancelDelBtn.style.color = 'var(--neg-fg)';
    });
    cancelDelBtn.addEventListener('mouseleave', ()=>{
      cancelDelBtn.textContent = '⏳ Deletion in 24 hours';
      cancelDelBtn.style.background = '';
      cancelDelBtn.style.color = 'var(--red-600)';
    });
    cancelDelBtn.addEventListener('click', ()=>{
      App.accountDeletionScheduled = false;
      App.accountDeletionScheduledAt = null;
      saveStore(App);
      toast('Account deletion canceled');
      App._rerender();
    });
  }
}
