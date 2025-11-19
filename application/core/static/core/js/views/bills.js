// core/js/views/bills.js
import { $, on, fmt } from '../utils.js';
import { App } from '../state.js';
import { renderCreateForm, bindCreateForm } from './createForm.js';

/* ----------------------- Public API ----------------------- */
export function renderBills(app = App){
  const isPay = app.showCreateBill === true; // true => Create Bill (create form)
  const cur = app.preferences?.currency || 'USD';
  const bills = [...(app.bills || [])].sort((a,b)=> new Date(b.date) - new Date(a.date));

  // If a specific bill is open in detail view, render that directly
  if (!isPay && app.viewBillId) {
    const bill = (app.bills || []).find(b => b.id === app.viewBillId);
    if (bill) {
      return `
        <div id="bills" class="bills-view fade-in" data-currency="${cur}" data-mode="past">
          <div class="bills-header">${segmentedToggle(false)}</div>
          <div id="b-content" class="bills-content">
            ${renderBillDetail(bill, cur)}
          </div>
        </div>
      `;
    } else {
      // reset if bill not found
      app.viewBillId = null;
    }
  }

  return `
    <div id="bills" class="bills-view fade-in" data-currency="${cur}" data-mode="${isPay ? 'pay' : 'past'}">
      <div class="bills-header">
        ${segmentedToggle(isPay)}
      </div>

      <div id="b-content" class="bills-content">
        ${isPay ? renderCreateForm() : renderPastBillsSection(app, cur, bills)}
      </div>
    </div>
  `;
}

export function bindBills(app = App, { navigate } = {}){
  const wrap = $('#bills'); if(!wrap) return;

  // Segmented control
  const seg = $('#b-seg');
  if(seg){
    on(seg, 'click', (e)=>{
      const btn = e.target.closest('[role="tab"]');
      if(!btn) return;
      switchMode(btn.getAttribute('data-tab'));
    });
    on(seg, 'keydown', (e)=>{
      const tabs = [...seg.querySelectorAll('[role="tab"]')];
      const idx = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      let next = idx;
      if(e.key === 'ArrowRight') next = Math.min(idx+1, tabs.length-1);
      if(e.key === 'ArrowLeft')  next = Math.max(idx-1, 0);
      if(next !== idx){ e.preventDefault(); tabs[next].focus(); tabs[next].click(); }
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); document.activeElement?.click(); }
    });
  }

  // Bind subview
  if(app.showCreateBill){
    bindCreateForm();
  } else if (app.viewBillId){
    bindBillDetail(app, { navigate });
  } else {
    bindPastBills(app);
  }

  function switchMode(target){
    const isPay = target === 'pay';
    app.showCreateBill = isPay;
    if (isPay) app.viewBillId = null; // leaving detail/list
    updateSegmentedUI(isPay);

    const content = $('#b-content');
    content.classList.add('fade-out');
    setTimeout(()=>{
      if(isPay){
        content.innerHTML = renderCreateForm();
        content.classList.remove('fade-out');
        bindCreateForm();
      }else{
        const cur = app.preferences?.currency || 'USD';
        const bills = [...(app.bills || [])].sort((a,b)=> new Date(b.date) - new Date(a.date));
        content.innerHTML = app.viewBillId
          ? renderBillDetail((app.bills||[]).find(b=>b.id===app.viewBillId), cur)
          : renderPastBillsSection(app, cur, bills);
        content.classList.remove('fade-out');
        app.viewBillId ? bindBillDetail(app, { navigate }) : bindPastBills(app);
      }
    }, 120);
  }

  function updateSegmentedUI(isPay){
    wrap.setAttribute('data-mode', isPay ? 'pay' : 'past');
    const tabs = [...$('#b-seg').querySelectorAll('[role="tab"]')];
    tabs.forEach(t => {
      const active = (t.getAttribute('data-tab') === (isPay ? 'pay' : 'past'));
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.classList.toggle('active', active);
    });
  }
}

/* ----------------------- Past Bills subview ----------------------- */
function renderPastBillsSection(app, cur, bills){
  const peopleOptions = personFilterOptions(bills).map(
    p => `<option value="${p.value}">${p.label}</option>`
  ).join('');

  return `
    <!-- Search -->
    <section class="search-wrap">
      <input id="b-search" class="input search-input" placeholder="Search by title or item…" list="b-suggest" />
      <datalist id="b-suggest"></datalist>
    </section>

    <!-- Filters -->
    <section class="filters">
      <select id="b-person" class="select">
        <option value="">All people</option>
        ${peopleOptions}
      </select>
      <select id="b-status" class="select">
        <option value="">All status</option>
        <option value="youowe">You Owe</option>
        <option value="youreowed">You're Owed</option>
        <option value="paid">Paid</option>
      </select>
      <input id="b-from" class="input" type="date" />
      <input id="b-to" class="input" type="date" />
      <button id="b-clear" class="btn outline">Clear</button>
    </section>

${(!bills || bills.length===0) ? `
  <div class="empty muted">No past bills yet.</div>
` : `
  <div id="b-list" class="bill-list">
    ${bills.map(b => billCard(b, cur)).join('')}
  </div>
  <div class="demo-clear-wrap">
    <button id="demo-clear" class="btn destructive" style="margin-top:1rem;width:100%">
    Delete all bills (DEMO only)
    </button>
  </div>
`}

  `;
}

function bindPastBills(app){
  const wrap = $('#bills'); if(!wrap) return;

  // Build and inject suggestions once (or whenever this view mounts)
  populateSearchSuggestions(app);

  const ctrls = ['#b-search','#b-person','#b-status','#b-from','#b-to'];
  ctrls.forEach(sel=>{
    const el = $(sel); if(!el) return;
    on(el,'input',()=> filterAndRender(app));
    on(el,'change',()=> filterAndRender(app));
  });

  on($('#b-clear'),'click', ()=>{
    ['#b-search','#b-person','#b-status','#b-from','#b-to'].forEach(id=>{
      const el = $(id); if(el) el.value = '';
    });
    filterAndRender(app);
  });

  // Open detail on card click
  const list = $('#b-list');
  if(list){
    on(list, 'click', (e)=>{
      const card = e.target.closest('[data-bill]');
      if(!card) return;
      const id = card.getAttribute('data-bill');
      app.viewBillId = id;
      const cur = app.preferences?.currency || 'USD';
      $('#b-content').innerHTML = renderBillDetail((app.bills||[]).find(b=>b.id===id), cur);
      bindBillDetail(app);
    });
  }

  // Delegated handler for the demo "Delete all bills" button
  on(wrap, 'click', (e)=>{
    const btn = e.target.closest('#demo-clear');
    if(!btn) return;
    if(!confirm('Delete all bills? This is only for demonstration.')) return;

    app.bills = [];
    app.viewBillId = null;

    // Notify other views (Home recalculates balances)
    document.dispatchEvent(new CustomEvent('app:updated', { detail: { source: 'demo-clear' }}));

    // Re-render the list area
    filterAndRender(app);
  });

  filterAndRender(app);
}



function filterAndRender(app){
  const wrap = $('#bills'); if(!wrap) return;
  const cur = wrap.getAttribute('data-currency') || 'USD';

  const q = ($('#b-search')?.value || '').trim().toLowerCase();
  const pid = $('#b-person')?.value || '';
  const status = $('#b-status')?.value || '';
  const from = $('#b-from')?.value || '';
  const to = $('#b-to')?.value || '';

  const filtered = (app.bills||[])
    .filter(b=>{
      const inTitle = (b.title||'').toLowerCase().includes(q);
      const inItems = (b.items||[]).some(it => (it.name||'').toLowerCase().includes(q));
      const passesText = !q || inTitle || inItems;

      const passesPerson = !pid || (b.participants||[]).some(p => p.userId === pid);

      // ✅ New human-friendly status logic
      // relation: 'youowe' | 'youreowed' | 'paid'
      let relation = 'paid';
      const payer = (b.participants || []).find(p => p.paid);
      const yourShare = (b.participants || []).find(p => p.userId === 'me')?.share || 0;
      const total = Number(b.total || 0);

      if (payer?.userId === 'me' && total > yourShare + 0.005) {
        relation = 'youreowed'; // you paid, others owe you
      } else if (payer?.userId !== 'me' && yourShare > 0.005) {
        relation = 'youowe'; // someone else paid, you owe your share
      } // else paid (net zero)

      const passesStatus = !status || status === relation;

      const d = new Date(b.date).toISOString().slice(0,10);
      const after = !from || d >= from;
      const before = !to || d <= to;

      return passesText && passesPerson && passesStatus && after && before;
    })
    .sort((a,b)=> new Date(b.date) - new Date(a.date));

  const list = $('#b-list') || (()=> {
    const mount = document.createElement('div');
    mount.id = 'b-list';
    mount.className = 'bill-list';
    $('#b-content').appendChild(mount);
    return mount;
  })();

  list.innerHTML = filtered.length
    ? filtered.map(b => billCard(b, cur)).join('')
    : `<div class="empty muted">No bills match your filters.</div>`;
}

/* ----------------------- Segmented toggle ----------------------- */
function segmentedToggle(isPay){
  return `
    <div id="b-seg" class="seg" role="tablist" aria-label="Bill view switch">
      <button role="tab" data-tab="past" aria-selected="${!isPay}" class="seg-btn ${!isPay ? 'active' : ''}">
        Past Bill
      </button>
      <button role="tab" data-tab="pay" aria-selected="${isPay}" class="seg-btn ${isPay ? 'active' : ''}">
        Create Bill
      </button>
      <span class="seg-indicator" aria-hidden="true"></span>
    </div>
  `;
}

/* ----------------------- Past Bills Card ----------------------- */
function billCard(bill, cur){
  const payer = payerOf(bill);
  const youPaid = payer?.userId === 'me';
  const yourShare = youShare(bill);
  const total = Number(bill.total || 0);
  const dateLabel = new Date(bill.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

  const delta = youPaid ? (total - Number(yourShare||0)) : -Number(yourShare||0);
  let lineLabel = 'Paid';
  let lineClass = 'neutral';
  let lineAmount = '';

  if(delta > 0.005){
    lineLabel = "You're owed";
    lineClass = 'pos';
    lineAmount = fmt(round2(delta), cur);
  } else if(delta < -0.005){
    lineLabel = 'You Owe';
    lineClass = 'neg';
    lineAmount = fmt(round2(Math.abs(delta)), cur);
  }

  return `
    <article class="bill-card card" data-bill="${bill.id}" data-status="${lineClass}">
      <div class="row head">
        <div class="left">
          <div class="title">${escapeHtml(bill.title || 'Untitled')}</div>
          <div class="sub muted date-only">${dateLabel}</div>
          <div class="sub muted meta-line">
            • ${(bill.participants||[]).length} people
            ${payer ? ` • Payer: ${escapeHtml(payer.name === 'You' ? 'You' : payer.name)}` : ''}
          </div>
        </div>
        <div class="right">
          <div class="total-label muted">Total</div>
          <div class="total-amount">${fmt(total, cur)}</div>
          <div class="me-line ${lineClass}">
            <span class="me-label">${lineLabel}</span>
            ${lineAmount ? `<span class="me-amount">${lineAmount}</span>` : ''}
          </div>
        </div>
      </div>
    </article>
  `;
}


/* ----------------------- Bill Detail View ----------------------- */
function renderBillDetail(bill, cur){
  const dateLabel = new Date(bill.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const payer = payerOf(bill); // { userId, name, ... }
  const peopleNames = (bill.participants||[]).map(p=>p.name).join(', ') || '—';

  const breakdown = computeBreakdown(bill);

  // CTA selection
  const relation = relationOf(bill);
  let ctaLabel = 'Paid';
  let ctaClass = 'done';
  let isButton = false;
  if (relation === 'youowe') { ctaLabel = 'Pay bill'; ctaClass = 'pay'; isButton = true; }
  else if (relation === 'youreowed') { ctaLabel = 'Notify'; ctaClass = 'notify'; isButton = true; }

  return `
    <div class="bill-detail">
      <button id="bd-back" class="btn ghost">← Back</button>

      <h2 class="bd-title">${escapeHtml(bill.title || 'Untitled')}</h2>
      <div class="bd-meta muted">
        <div><strong>Date:</strong> ${dateLabel}</div>
        <div><strong>Payer:</strong> ${escapeHtml(payer?.name || '—')}</div>
        <div><strong>People:</strong> ${escapeHtml(peopleNames)}</div>
      </div>

      <!-- Status/CTA banner -->
      <section
        class="bd-cta card ${ctaClass}"
        id="bd-cta"
        ${isButton ? 'role="button" tabindex="0" aria-label="'+ctaLabel+'"' : ''}
        aria-live="polite"
      >
        ${ctaLabel}
      </section>

      <section class="bd-total card">
        <div class="label muted">Total</div>
        <div class="amount">${fmt(Number(bill.total||0), cur)}</div>
      </section>

      <section class="bd-items card">
        <h3>Items</h3>
        <div class="bd-items-list">
          ${(bill.items||[]).map(it=>{
            const participants = it.participants || [];
            const names = participants.map(pid => {
              const p = (bill.participants||[]).find(x=>x.userId===pid);
              return p ? p.name : 'Friend';
            });
            const each = participants.length ? it.price / participants.length : it.price;
            return `
              <div class="bd-item">
                <div class="i-top">
                  <div class="i-name">${escapeHtml(it.name||'Item')}</div>
                  <div class="i-price">${fmt(Number(it.price||0), cur)}</div>
                </div>
                <div class="i-sub muted">
                  Shared by: ${escapeHtml(names.join(', ') || '—')}<br>
                  ${participants.length ? `Each pays: ${fmt(round2(each), cur)}` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <section class="bd-extras card">
        <h3>Tax & Tip</h3>
        <div class="grid-2">
          <div>
            <div class="muted">Tax</div>
            <div>${bill.taxPercent||0}%</div>
          </div>
          <div>
            <div class="muted">Tip</div>
            <div>${bill.tipPercent||0}%</div>
          </div>
        </div>
      </section>

      <section class="bd-people card">
        <h3>Per Person</h3>
        <div class="bd-people-list">
          ${breakdown.people.map(p=>{
            const part = (bill.participants||[]).find(x=>x.userId===p.id);
            const isPayer = payer && part && part.userId === payer.userId;
            const isSettled = !!(isPayer || part?.settled || (part?.share ?? 0) === 0 || p.total === 0);

            return `
              <div class="bd-person">
                <div class="p-row"><strong>${escapeHtml(p.name)}</strong></div>
                <div class="p-row badges">
                  ${isPayer
                    ? `<span class="badge payer">Payer</span>`
                    : `<span class="badge ${isSettled ? 'paid' : 'unpaid'}">${isSettled ? 'Paid' : 'Unpaid'}</span>`
                  }
                </div>
                <div class="p-row"><span class="muted">Items:</span><span>${fmt(p.itemsSubtotal, cur)}</span></div>
                <div class="p-row"><span class="muted">Tax:</span><span>${fmt(p.tax, cur)}</span></div>
                <div class="p-row"><span class="muted">Tip:</span><span>${fmt(p.tip, cur)}</span></div>
                <div class="p-row total"><span>Total:</span><span class="strong">${fmt(p.total, cur)}</span></div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;
}



function bindBillDetail(app, { navigate } = {}){
  // Back
  on($('#bd-back'), 'click', ()=>{
    app.viewBillId = null;
    const cur = app.preferences?.currency || 'USD';
    const bills = [...(app.bills || [])].sort((a,b)=> new Date(b.date) - new Date(a.date));
    $('#b-content').innerHTML = renderPastBillsSection(app, cur, bills);
    bindPastBills(app);
  });

  // PAY BILL: settle your share and re-render detail + notify home
  const cta = $('#bd-cta');
  if (cta && cta.classList.contains('pay')) {
const handler = ()=>{
  const id = app.viewBillId;
  if(!id) return;

  const bill = (app.bills || []).find(b=>b.id===id);
  if(!bill) return;

  const rel = relationOf(bill);

  // 🧾 You owe — pay your share and mark as settled
  if(rel === 'youowe'){
    settleYourShare(app, id);
  }


  else if(rel === 'paid' || rel === 'youreowed'){
    // nothing to do — you’re already paid or owed
  } else {
    // fallback if bill has weird state
    console.warn('Unhandled bill relation:', rel);
  }


  const everyoneSettled = (bill.participants||[]).every(p => p.userId === 'me' || p.share === 0);
  if(everyoneSettled){
    bill.meta = { ...(bill.meta||{}), fullySettled: true };
  }

  rerenderDetail(app);
  notifyAppUpdated();
};

    on(cta, 'click', handler);
    on(cta, 'keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); handler(); }
    });
  }

  function rerenderDetail(app){
    const cur = app.preferences?.currency || 'USD';
    const bill = (app.bills||[]).find(b=>b.id===app.viewBillId);
    if(!bill){
      // If bill disappeared, go back to list
      app.viewBillId = null;
      const bills = [...(app.bills || [])].sort((a,b)=> new Date(b.date) - new Date(a.date));
      $('#b-content').innerHTML = renderPastBillsSection(app, cur, bills);
      bindPastBills(app);
      return;
    }
    $('#b-content').innerHTML = renderBillDetail(bill, cur);
    bindBillDetail(app); // re-bind to new DOM
  }

  function notifyAppUpdated(){
    // Emit an app-level event other views can listen to (Home can recompute balances)
    document.dispatchEvent(new CustomEvent('app:updated', { detail: { source: 'bills/pay' }}));
  }
}

/* ----------------------- Computation helpers ----------------------- */
function computeBreakdown(bill){
  const taxPct = parseFloat(bill.taxPercent||0) || 0;
  const tipPct = parseFloat(bill.tipPercent||0) || 0;

  // Pre-tax subtotals per user from item shares
  const map = new Map(); // id -> {name, itemsSubtotal}
  (bill.participants||[]).forEach(p=>{
    map.set(p.userId, { id:p.userId, name:p.name, itemsSubtotal:0, tax:0, tip:0, total:0 });
  });

  (bill.items||[]).forEach(it=>{
    const parts = it.participants || [];
    const share = parts.length ? (Number(it.price||0) / parts.length) : Number(it.price||0);
    parts.forEach(pid=>{
      if(map.has(pid)){
        map.get(pid).itemsSubtotal += share;
      }
    });
  });

  // Allocate tax & tip proportionally to items subtotal
  const sumItems = [...map.values()].reduce((s,p)=> s + p.itemsSubtotal, 0);
  [...map.values()].forEach(p=>{
    p.tax = round2(p.itemsSubtotal * taxPct / 100);
    p.tip = round2(p.itemsSubtotal * tipPct / 100);
    p.total = round2(p.itemsSubtotal + p.tax + p.tip);
  });

  return { people: [...map.values()] };
}

/* ----------------------- Small utils ----------------------- */
function payerOf(bill){ return (bill.participants||[]).find(p=>p.paid) || null; }
function youShare(bill){ return (bill.participants||[]).find(p=>p.userId==='me')?.share || 0; }
function round2(n){ return Math.round((Number(n)||0)*100)/100; }
function escapeHtml(s=''){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
function personFilterOptions(bills){
  const map = new Map();
  (bills||[]).forEach(b=>{
    (b.participants||[]).forEach(p=>{
      if(!map.has(p.userId)) map.set(p.userId, p.name);
    });
  });
  const arr = [...map.entries()].map(([value,label])=>({value,label}));
  arr.sort((a,b)=>{
    if(a.value==='me') return -1;
    if(b.value==='me') return 1;
    return a.label.localeCompare(b.label);
  });
  return arr;
}

// Compute relation for a bill (used by detail CTA)
function relationOf(bill){
  const payer = payerOf(bill);
  const yourShare = youShare(bill);
  const total = Number(bill.total || 0);

  if (payer?.userId === 'me' && total > yourShare + 0.005) return 'youreowed'; // you paid, others owe you
  if (payer?.userId !== 'me' && yourShare > 0.005) return 'youowe';            // someone else paid, you owe
  return 'paid';
}

/* ----------------------- Pay logic ----------------------- */
/**
 * Mark your share of a bill as settled.
 * Implementation detail:
 * - For a bill where you owe (payer !== 'me'), set your participant's share to 0.
 *   This makes calculateBalances() drop your debt and updates Home automatically.
 * - If you don't owe, this is a no-op.
 */
function settleYourShare(app, billId){
  const idx = (app.bills || []).findIndex(b=>b.id===billId);
  if(idx === -1) return;
  const bill = app.bills[idx];

  const rel = relationOf(bill);
  if (rel !== 'youowe') return; // only actionable when you actually owe someone

  // Zero out your share
  const parts = (bill.participants || []).map(p=>{
    if(p.userId === 'me'){
      return { ...p, share: 0, settled: true };
    }
    return p;
  });

  // Optionally annotate bill that you settled
  const meta = { ...(bill.meta||{}), settledBy: [ ...new Set([...(bill.meta?.settledBy||[]), 'me']) ] };

  // Persist mutation (in-place to keep references)
  app.bills[idx] = { ...bill, participants: parts, meta };
}

/* ----------------------- Search suggestions ----------------------- */
function populateSearchSuggestions(app = App){
  const dl = $('#b-suggest');
  const input = $('#b-search');
  if(!dl || !input) return;

  // Gather suggestions from titles + item names, with simple frequency count
  const counts = new Map();
  (app.bills || []).forEach(b=>{
    const add = (s)=>{
      const key = (s||'').trim();
      if(!key) return;
      // normalize to a nice case for display (keep original if already cased)
      const disp = key.length <= 2 ? key.toUpperCase()
                 : key.charAt(0).toUpperCase() + key.slice(1);
      const k = disp;
      counts.set(k, (counts.get(k)||0) + 1);
    };

    add(b.title);
    (b.items||[]).forEach(it=> add(it.name));
  });

  const suggestions = [...counts.entries()]
    .sort((a,b)=>{
      // sort by frequency desc, then alpha
      if(b[1] !== a[1]) return b[1]-a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([text])=> text)
    .slice(0, 100); // cap to keep the list snappy

  // Inject <option> items
  dl.innerHTML = suggestions.map(s => `<option value="${escapeHtml(s)}"></option>`).join('');

  // Optional: when the user chooses a datalist option, trigger filtering immediately
  on(input, 'change', ()=> filterAndRender(app));
}


/* ----------------------- Styles ----------------------- */
const style = document.createElement('style');
style.textContent = `
.bills-view { max-width: 820px; margin: 0 auto; padding: 1rem; }
.bills-header {
  margin-top: .3rem;
  margin-bottom: .9rem;
}

/* Segmented bar */
.seg {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  user-select: none;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
}
.seg-btn {
  border: none;
  background: transparent;
  padding: .7rem 1rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  text-align: center;
  z-index: 2;
}
.seg-btn.active { color: #ffffffff; }
.seg:focus-within { outline: none; }
.seg-btn:focus { outline: none; box-shadow: none; }
.seg-indicator {
  position: absolute; top: 0; bottom: 0;
  width: 50.2%;
  background: #48dbfb;
  box-shadow: 0 4px 14px rgba(0,0,0,.08), inset 0 0 0 1px #e5e7eb;
  border-radius: 10px;
  transform: translateX(0%);
  transition: transform .22s ease;
  z-index: 1;
}
[data-mode="pay"] .seg .seg-indicator { transform: translateX(100%); }

/* Search + filters */
.search-wrap { margin: .25rem 0 .6rem; }
.search-input { width:100%; }
.filters {
  display:grid;
  grid-template-columns: 1fr 160px 1fr 1fr 100px;
  gap:.5rem;
  margin-bottom: .9rem;
}
@media (max-width: 720px){
  .filters { grid-template-columns: 1fr 1fr; }
}

/* Past Bill Cards */
.bill-list { display:flex; flex-direction:column; gap:.7rem; }
.bill-card.card {
  background:#fff;
  border-radius:10px;
  padding:1rem 1.2rem;
  box-shadow:0 2px 8px rgba(0,0,0,0.05);
  border: 2px solid transparent;
  box-sizing: border-box;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.25s ease,
    border-width 0.25s ease;
}
.bill-card .row.head { display:flex; align-items:flex-start; width:100%; }
.bill-card .left {
  flex: 1;
  display:flex; flex-direction:column; align-items:flex-start;
}
.bill-card .title { font-weight:600; margin-bottom:.25rem; }
.bill-card .sub { font-size:.85rem; color:#64748b; }
.bill-card .date-only { margin-top: 0; }
.bill-card .meta-line { margin-top:.15rem; }
.bill-card .right {
  margin-left:auto;
  text-align:right;
  min-width:180px;
  display:flex; flex-direction:column; align-items:flex-end;
}
.bill-card .total-label { font-size:.75rem; color:#64748b; }
.bill-card .total-amount { font-weight:700; font-size:1.1rem; margin-bottom:.3rem; }
.me-line { font-size:.9rem; display:flex; gap:.35rem; align-items:center; justify-content:flex-end; }
.me-line.neutral .me-label { color:#475569; }
.me-line.pos .me-label { color:#16a34a; }
.me-line.neg .me-label { color:#dc2626; }
.me-line .me-amount { font-weight:600; }
/* Badges row under each person */
.bd-person .badges {
  display: flex;
  gap: .4rem;
  flex-wrap: wrap;
  margin: .25rem 0 .35rem;
}

/* Badge variants (uses your global .badge base if present) */
.badge.payer {
  background: var(--chip-bg);
  color: var(--primary-600);
  border-color: var(--primary-600);
  font-weight: 700;
}
.badge.paid {
  background: var(--green-50);
  color: var(--green-600);
  border-color: transparent;
  font-weight: 600;
}
.badge.unpaid {
  background: var(--red-50);
  color: var(--red-600);
  border-color: transparent;
  font-weight: 600;
}


/* Hover animation */
.bill-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.12);
  border-width: 3px;
}
.bill-card[data-status="pos"]:hover {
  border-color: #16a34a; /* green – you're owed */
}
.bill-card[data-status="neg"]:hover {
  border-color: #dc2626; /* red – you owe */
}
.bill-card[data-status="neutral"]:hover {
  border-color: #94a3b8; /* gray – paid */
}
.bill-card:hover::before {
  filter: brightness(1.15);
}
.demo-clear-wrap {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
#demo-clear {
  background: #ef4444;
  color: #fff;
  border: none;
  font-weight: 600;
  transition: filter .2s ease;
}
#demo-clear:hover {
  filter: brightness(1.1);
}

/* Bill Detail */
.bill-detail { display:flex; flex-direction:column; gap:.75rem; }
.bd-title { font-size:1.25rem; font-weight:700; margin-top:.25rem; }
.bd-meta { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:.5rem; }
@media (max-width: 720px){ .bd-meta { grid-template-columns: 1fr; } }

.card { background:#fff; border-radius:10px; padding:1rem 1.1rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); }

.bd-total .label { font-size:.8rem; color:#64748b; }
.bd-total .amount { font-size:1.4rem; font-weight:800; }

.bd-items h3, .bd-extras h3, .bd-people h3 { font-size:1rem; margin-bottom:.5rem; }
.bd-items-list { display:flex; flex-direction:column; gap:.6rem; }
.bd-item .i-top { display:flex; justify-content:space-between; gap:.75rem; }
.bd-item .i-name { font-weight:600; }
.bd-item .i-price { font-weight:600; }
.bd-item .i-sub { font-size:.9rem; margin-top:.15rem; }

.bd-extras .grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap:.5rem; }

.bd-people-list { display:grid; grid-template-columns: 1fr 1fr; gap:.6rem; }
@media (max-width: 720px){ .bd-people-list { grid-template-columns: 1fr; } }
.bd-person { background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:.7rem .8rem; }
.bd-person .p-row { display:flex; justify-content:space-between; margin:.15rem 0; }
.bd-person .p-row.total { margin-top:.3rem; font-weight:700; }
.bd-person .p-row .strong { font-weight:800; }

.empty { text-align:center; margin:1rem 0; color:#64748b; }

.fade-out { opacity:0; transition: opacity .12s ease; }
.fade-in  { animation: fadein .25s ease; }
@keyframes fadein { from{opacity:0;} to{opacity:1;} }

/* Bill Detail CTA banner (same sizing as .card / Total) */
.bd-cta.card {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  padding: 1rem 1.1rem; /* match .card */
}

/* Cyan “Pay bill” look */
.bd-cta.pay {
  background: #48dbfb;
  color: #0f172a;
  box-shadow: 0 4px 14px rgba(0,0,0,.08), inset 0 0 0 1px #e5e7eb;
  cursor: pointer;
  user-select: none;
}

/* White “Paid” look */
.bd-cta.done {
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
}

/* Left status strip on bill cards */
.bill-card {
  position: relative;
  overflow: hidden;
}
.bill-card::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 10px;
  background: #cbd5e1;
  transition: background 0.2s ease, filter 0.2s ease;
}
/* Notify banner (for “you're owed”) */
.bd-cta.notify {
  background: #fef08a;   /* warm yellow tone */
  color: #78350f;
  border: 1px solid #facc15;
  cursor: pointer;
  user-select: none;
}
.bd-cta.notify:hover {
  filter: brightness(1.05);
}

/* Status colors */
.bill-card[data-status="pos"]::before { background: #16a34a; }
.bill-card[data-status="neg"]::before { background: #dc2626; }
.bill-card[data-status="neutral"]::before { background: #94a3b8; }
`;
document.head.appendChild(style);




// Developer note for future readers:
// Clicking the cyan "Pay bill" banner in the bill detail will zero-out *your* share on that bill,
// which immediately removes the debt from Home balances derived via calculateBalances().
