// bills.js
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

/* Inject minimal CSS needed for the hover highlight on "Show details" */
function ensureBillsStyles(){
  if(document.getElementById('bills-inline-styles')) return;
  const style = document.createElement('style');
  style.id = 'bills-inline-styles';
  style.textContent = `
    .card.hover-outline{
      border-color: var(--blue);
      box-shadow: var(--shadow);
    }
    .details-toggle-wrap{
      display:flex;
      justify-content:center;
      margin:-2px 0 20px 0;
    }
    .btn-show-details{
      font-weight:600;
    }
  `;
  document.head.appendChild(style);
}

/* ---------- Details (inline) renderer for past bills ---------- */
function renderBillDetails(bill, cur){
  const items = bill.items || [];
  const d = new Date(bill.date).toLocaleDateString('en-US',{month:'short', day:'numeric', year:'numeric'});

  if(!items.length){
    return `
      <div class="bill-details-body">
        <div class="card bg-subtle">
          <div class="space-y-2">
            <div class="row" style="justify-content:space-between">
              <span class="muted">Bill title</span><span>${bill.title}</span>
            </div>
            <div class="row" style="justify-content:space-between">
              <span class="muted">Date</span><span>${d}</span>
            </div>
            ${bill.notes ? `
            <div class="row" style="justify-content:space-between">
              <span class="muted">Notes</span><span>${bill.notes}</span>
            </div>`:''}
          </div>
        </div>
        <p class="hint" style="margin-top:6px">No itemized details were saved for this bill.</p>
      </div>
    `;
  }

  return `
    <div class="bill-details-body">
      ${bill.photo ? `<img class="img-receipt" src="${bill.photo}" alt="Receipt photo" style="margin-bottom:8px" />` : ''}
      <div class="card bg-subtle">
        <div class="space-y-2">
          <div class="row" style="justify-content:space-between">
            <span class="muted">Bill title</span><span>${bill.title}</span>
          </div>
          <div class="row" style="justify-content:space-between">
            <span class="muted">Date</span><span>${d}</span>
          </div>
          <div class="row" style="justify-content:space-between">
            <span class="muted">Grand total</span><span>${fmt(bill.total, cur)}</span>
          </div>
          ${bill.notes ? `
          <div class="row" style="justify-content:space-between">
            <span class="muted">Notes</span><span>${bill.notes}</span>
          </div>`:''}
        </div>
      </div>

      <label class="section-header" style="margin-top:10px">Items</label>
      <div class="space-y-2" style="margin-top:6px">
        ${items.map(it=>{
          const assigned = (it.participants||[]);
          const chips = (bill.participants||[]).map(p=>{
            const active = assigned.includes(p.userId);
            return `<span class="chip chip-person ${active?'active':''}" data-person="${p.userId}">${p.name}${p.userId==='me'?' (You)':''}</span>`;
          }).join('');
          return `
            <div class="card" style="padding:10px">
              <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px">
                <div style="font-weight:600">${it.name}</div>
                <div class="muted">${fmt(it.price, cur)}</div>
              </div>
              <div class="chips">${chips}</div>
            </div>
          `;
        }).join('')}
      </div>
      <p class="hint" style="margin-top:6px">Tap the card header again to collapse.</p>
    </div>
  `;
}

function renderBillCard(bill, cur, expanded){
  const d = new Date(bill.date).toLocaleDateString('en-US',{month:'short', day:'numeric', year:'numeric'});
  const past = isPastBill(bill);

  return `
    <div class="card ${past?'bill-past':''}" data-bill="${bill.id}">
      <!-- Header area (click to expand if past) -->
      <div class="row bill-card-header" style="justify-content:space-between;align-items:flex-start;margin-bottom:6px; cursor:${past?'pointer':'default'}">
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

      <!-- Centered "Show details" toggle for ALL cards; only toggles expansion for past bills -->
      <div class="details-toggle-wrap">
        <button class="btn ghost btn-show-details" ${past ? '' : 'disabled'}>${expanded ? 'Hide details' : 'Show details'}</button>
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
          const showNotify = past && !p.paid && !isMe; // never show notify for me
          const showPayMe = past && isMe && !p.paid;   // pay button for me on past bills
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
              <div class="row" style="gap:.4rem;align-items:center">
                <span>${fmt(p.share, cur)}</span>
                ${showPayMe ? `<button class="btn outline btn-pay-me" title="Mark your share as paid">Pay</button>` : ``}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Inline expansion area for past bills -->
      <div class="bill-details ${expanded ? '' : 'hidden'}" style="margin-top:10px">
        ${renderBillDetails(bill, cur)}
      </div>
    </div>
  `;
}

export function renderBills(App){
  const cur = App.preferences.currency;
  const hasDraft = !!localStorage.getItem('Bill Divideter_newBillDraft');

  ensureBillsStyles(); // inject the hover style once

  // ephemeral UI state for expanded cards
  App.expandedBills = App.expandedBills || {};

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
          <span>${App.shouldOpenCreateForm? '▲ Return to Past Bills' : `${hasDraft?'Continue Draft':'New Bill'}`}</span>
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
          <span class="i" title="Filter"></span>
          <select id="bill-status" class="select" style="max-width:180px">
            <option value="all" ${filt==='all'?'selected':''}>All Status</option>
            <option value="pending" ${filt==='pending'?'selected':''}>Pending</option>
            <option value="partial" ${filt==='partial'?'selected':''}>Partial</option>
            <option value="settled" ${filt==='settled'?'selected':''}>Settled</option>
          </select>
        </div>

        <div id="bill-list" class="space-y-2" style="margin-top:12px">
          ${filtered.length ? filtered.map(b=>renderBillCard(b, cur, !!App.expandedBills[b.id])).join('') :
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
    // Hover highlight for the whole card when hovering the "Show details" button
    list.addEventListener('mouseover', (e)=>{
      const btn = e.target.closest('.btn-show-details');
      if(!btn) return;
      const card = btn.closest('.card');
      card && card.classList.add('hover-outline');
    });
    list.addEventListener('mouseout', (e)=>{
      const btn = e.target.closest('.btn-show-details');
      if(!btn) return;
      const card = btn.closest('.card');
      card && card.classList.remove('hover-outline');
    });

    // Click handling
    list.addEventListener('click', (e)=>{
      const card = e.target.closest('[data-bill]');
      if(!card) return;
      const id = card.getAttribute('data-bill');
      const b = App.bills.find(x=>x.id===id);
      const past = b ? isPastBill(b) : true;

      // "Show details" button toggles expansion (only meaningful for past)
      if(e.target.closest('.btn-show-details')){
        if(past){
          App.expandedBills = App.expandedBills || {};
          App.expandedBills[id] = !App.expandedBills[id];
          App._rerender();
        }
        e.stopPropagation();
        return;
      }

      // notify clicks (never for "me" by render rule)
      if(e.target.closest('.badge.notify')){
        toast('Reminder sent!');
        e.stopPropagation();
        return;
      }

      // mark "me" as paid on past bills
      if(e.target.closest('.btn-pay-me')){
        if(!b) return;
        const me = b.participants.find(p=>p.userId==='me');
        if(me && !me.paid){
          me.paid = true;

          // recompute bill status
          const allPaid = b.participants.every(p=>p.paid === true);
          b.status = allPaid ? 'settled' : 'partial';

          saveStore(App);
          toast('Your share is marked as paid');
          App._rerender();
        }
        e.stopPropagation();
        return;
      }

      // non-past controls (edit/settle/delete)
      if(e.target.closest('.btn-edit')){
        if(past) return;
        toast('Edit functionality coming soon!');
        e.stopPropagation();
        return;
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
        e.stopPropagation();
        return;
      }
      if(e.target.closest('.btn-del')){
        if(past) return;
        if(confirm('Are you sure you want to delete this bill?')){
          App.bills = App.bills.filter(x=>x.id!==id);
          saveStore(App);
          toast('Bill deleted');
          App._rerender();
        }
        e.stopPropagation();
        return;
      }

      // Toggle inline expansion when clicking header/non-button area for past bills
      if(past && (e.target.closest('.bill-card-header') || e.target === card)){
        App.expandedBills = App.expandedBills || {};
        App.expandedBills[id] = !App.expandedBills[id];
        App._rerender();
      }
    });
  }

  // bind create form (if visible)
  if(App.shouldOpenCreateForm){ bindCreateForm(); }
}
