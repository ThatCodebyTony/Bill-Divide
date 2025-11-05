import { $, $$, fmt } from '../utils.js';
import { toast } from '../components/toast.js';
import { saveStore } from '../storage.js';
import { renderCreateForm, bindCreateForm } from './createForm.js';

function isPastBill(bill){
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(bill.date);
  d.setHours(0,0,0,0);
  return d < today;
}

function renderBillCard(bill, cur){
  const d = new Date(bill.date).toLocaleDateString('en-US',{month:'short', day:'numeric', year:'numeric'});
  const past = isPastBill(bill);
  return `
    <div class="card" data-bill="${bill.id}">
      <div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div>
          <h3 style="margin:.1rem 0">${bill.title}</h3>
          <div class="muted" style="font-size:.9rem">${d}</div>
        </div>
        <div class="row" style="gap:.25rem">
          ${!past ? `
            <button class="btn ghost btn-edit" title="Edit">✏️</button>
            ${bill.status!=='settled'? `<button class="btn ghost btn-settle" title="Mark as settled">✅</button>`:''}
            <button class="btn ghost btn-del" title="Delete" style="color:var(--red-600)">🗑️</button>
          `:''}
        </div>
      </div>

      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:1.4rem;font-weight:700">${fmt(bill.total, cur)}</div>
        <span class="badge status-${bill.status}">${bill.status}</span>
      </div>

      ${bill.notes ? `<div class="muted" style="font-size:.9rem;margin-bottom:6px">${bill.notes}</div>`:''}
      <div class="row muted" style="gap:.35rem;align-items:center;font-size:.95rem;margin-bottom:6px">
        <span class="i">👥</span><span>${bill.participants.length} participants</span>
      </div>

      <div class="divider"></div>
      <div class="space-y-2">
        ${bill.participants.map(p=>{
          const isMe = p.userId==='me';
          const showNotify = past && !p.paid; // show badge if past and unpaid
          return `
            <div class="row" style="justify-content:space-between;align-items:center">
              <div class="row" style="gap:.4rem;flex-wrap:wrap;align-items:center">
                <span style="${p.paid?'':'color:var(--muted)'}">
                  ${p.name}${isMe ? ' <span class="muted">(You)</span>' : ''}
                </span>
                ${p.paid
                  ? `<span class="badge paid">Paid</span>`
                  : `<span class="badge unpaid">Unpaid</span>`}
                ${showNotify
                  ? `<span class="badge notify" title="Send a reminder">notify</span>`
                  : ``}
              </div>
              <span>${fmt(p.share, cur)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderBills(App){
  const cur = App.preferences.currency;
  const hasDraft = !!localStorage.getItem('billSplitter_newBillDraft');

  const q = (App.searchQuery||'').toLowerCase();
  const filt = (App.statusFilter||'all');

  const filtered = [...App.bills]
    .filter(b=>{
      const s = (b.title||'').toLowerCase().includes(q) || (b.notes||'').toLowerCase().includes(q);
      const st = (filt==='all') || b.status===filt;
      return s && st;
    })
    .sort((a,b)=> new Date(b.date)-new Date(a.date));

  return `
    <div class="space-y-4">
      <div class="card">
        <button id="toggle-create" class="btn" style="width:100%;justify-content:space-between">
          <span>${App.shouldOpenCreateForm? '▲ Return to Past Bills' : `➕ ${hasDraft?'Continue Draft':'New Bill'}`}</span>
        </button>
        <div id="create-wrap" class="${App.shouldOpenCreateForm?'':'hidden'}" style="margin-top:12px">
          ${App.shouldOpenCreateForm ? renderCreateForm() : ''}
        </div>
      </div>

      <div id="filters" class="${App.shouldOpenCreateForm?'hidden':''}">
        <div class="toolbar" style="margin-bottom:.5rem">
          <input id="bill-search" class="input" placeholder="Search bills..." value="${App.searchQuery||''}" />
        </div>
        <div class="row" style="align-items:center;gap:.5rem">
          <span class="i" title="Filter"/span>
          <select id="bill-status" class="select" style="max-width:180px">
            <option value="all" ${filt==='all'?'selected':''}>All Status</option>
            <option value="pending" ${filt==='pending'?'selected':''}>Pending</option>
            <option value="partial" ${filt==='partial'?'selected':''}>Partial</option>
            <option value="settled" ${filt==='settled'?'selected':''}>Settled</option>
          </select>
        </div>

        <div id="bill-list" class="space-y-2" style="margin-top:12px">
          ${filtered.length ? filtered.map(b=>renderBillCard(b, cur)).join('') :
            `<div class="card center" style="padding:28px">
              <p class="muted" style="margin-bottom:10px">${(App.searchQuery||filt!=='all') ? 'No bills match your filters' : 'No bills yet'}</p>
              <button id="first-bill" class="btn primary"><span class="i">➕</span>Create Your First Bill</button>
            </div>`}
        </div>
      </div>
    </div>
  `;
}

export function bindBills(App){
  $('#toggle-create')?.addEventListener('click', ()=>{
    App.shouldOpenCreateForm = !App.shouldOpenCreateForm;
    App._rerender();
  });

  $('#first-bill')?.addEventListener('click', ()=>{
    App.shouldOpenCreateForm = true;
    App._rerender();
  });

  const s = $('#bill-search');
  const sel = $('#bill-status');
  s && s.addEventListener('input', ()=>{
    App.searchQuery = s.value;
    App._rerender();
  });
  sel && sel.addEventListener('change', ()=>{
    App.statusFilter = sel.value;
    App._rerender();
  });

  const list = $('#bill-list');
  if(list){
    list.addEventListener('click', (e)=>{
      const card = e.target.closest('[data-bill]');
      if(!card) return;
      const id = card.getAttribute('data-bill');
      const b = App.bills.find(x=>x.id===id);
      const past = b ? isPastBill(b) : true;

      // handle notify clicks
      if(e.target.closest('.badge.notify')){
        toast('Reminder sent!');
        return;
      }

      if(e.target.closest('.btn-edit')){
        if(past) return;
        toast('Edit functionality coming soon!');
      }
      if(e.target.closest('.btn-settle')){
        if(past) return;
        if(b){
          b.status = 'settled';
          b.participants = b.participants.map(p=>({...p, paid:true}));
          saveStore(App);
          toast('Bill marked as settled');
          App._rerender();
        }
      }
      if(e.target.closest('.btn-del')){
        if(past) return;
        if(confirm('Are you sure you want to delete this bill?')){
          App.bills = App.bills.filter(x=>x.id!==id);
          saveStore(App);
          toast('Bill deleted');
          App._rerender();
        }
      }
    });
  }

  // bind create form (if visible)
  if(App.shouldOpenCreateForm){ bindCreateForm(); }
}
