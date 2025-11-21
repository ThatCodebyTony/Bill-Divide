// filepath: /home/tony/HCI/Bill-Divide/application/core/static/core/js/views/home.js
import { fmt, clamp2 } from '../utils.js';
import { App } from '../state.js';

/** Ensure each participant has an immutable originalShare for display-only purposes */
function ensureOriginalShares(app){
  (app.bills || []).forEach(bill => {
    bill.participants = bill.participants.map(p => ({
      ...p,
      originalShare: p.originalShare ?? p.share
    }));
  });
}

function calculateBalances(bills){
  const map = new Map();
  for(const bill of bills){
    const payer = bill.participants.find(p => p.paid) || bill.participants[0];
    if(!payer) continue;
    for(const part of bill.participants){
      if(part.userId === payer.userId) continue;
      if(!part.paid && part.share > 0){
        const key = `${part.userId}->${payer.userId}`;
        map.set(key, (map.get(key) || 0) + part.share);
      }
    }
  }

  const nameFor = (id, bills) => {
    if(id === 'me') return 'You';
    for(const b of bills){
      const p = b.participants.find(x => x.userId === id);
      if(p) return p.name;
    }
    return 'Friend';
  };

  const res = [];
  for(const [key, amount] of map.entries()){
    const [from, to] = key.split('->');
    res.push({
      fromUserId: from,
      toUserId: to,
      fromName: nameFor(from, bills),
      toName: nameFor(to, bills),
      amount: clamp2(amount)
    });
  }
  return res;
}

export function renderHome(App){
  ensureOriginalShares(App);

  const balances = calculateBalances(App.bills || []);
  const youOwe = clamp2(balances.filter(b => b.fromUserId === 'me').reduce((s,b)=>s+b.amount,0));
  const owedToYou = clamp2(balances.filter(b => b.toUserId === 'me').reduce((s,b)=>s+b.amount,0));
  const net = clamp2(owedToYou - youOwe);
  const cur = App.preferences?.currency || 'USD';
  const recentBills = [...(App.bills || [])]
    .sort((a,b)=>new Date(b.date)-new Date(a.date))
    .slice(0,5);

  return `
    <div id="home" class="home-view fade-in">
      <section class="card card--main-balance">
        <div class="muted">Your Balance</div>
        <div class="amount ${net>=0?'pos':'neg'}">
          ${net>=0?'+':''}${fmt(net, cur)}
        </div>
      </section>

      <section class="balance-grid">
        <div class="tile owe">
          <div class="label">You Owe</div>
          <div class="value">${fmt(youOwe, cur)}</div>
        </div>
        <div class="tile owed">
          <div class="label">You're Owed</div>
          <div class="value">${fmt(owedToYou, cur)}</div>
        </div>
      </section>

      <section class="recent">
        <h2>Recent History</h2>
        ${recentBills.length === 0 ? `
          <div class="empty muted">No recent history yet.</div>
        ` : `
          <div class="recent-list" id="recent-list">
            ${recentBills.map(bill => {
              // compute status same as bills.js so the recent card colors match past-bill cards
              const payer = (bill.participants || []).find(p => p.paid) || null;
              const yourShare = (bill.participants || []).find(p => p.userId === 'me')?.share || 0;
              const total = Number(bill.total || 0);
              let lineClass = 'neutral';
              if (payer?.userId === 'me' && total > yourShare + 0.005) lineClass = 'pos';
              else if (payer?.userId !== 'me' && yourShare > 0.005) lineClass = 'neg';

              // display amount as before (positive if you paid, negative if you owe)
              const isPaidByYou = payer?.userId === 'me';
              const yourInitial = bill.participants.find(p=>p.userId==='me')?.originalShare || 0;
              const diff = isPaidByYou ? Number(bill.total || 0) - yourInitial : -yourInitial;

              const idAttr = bill.id ? `data-bill="${bill.id}"` : '';
              const aria = `aria-label="Open ${bill.title || 'bill'} from ${new Date(bill.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}"`;

              return `
                <div
                  class="bill-card clickable"
                  ${idAttr}
                  data-status="${lineClass}"
                  role="button"
                  tabindex="0"
                  ${aria}
                >
                  <div class="info">
                    <div class="title">${bill.title || 'Untitled'}</div>
                    <div class="date">${new Date(bill.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                  </div>
                  <div class="amount ${isPaidByYou?'pos':'neg'}">
                    ${isPaidByYou?'+':''}${fmt(diff,cur)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </section>
    </div>
  `;
}

export function bindHome(App, {navigate}){
  const bindTabs = () => {
    // navigate expects numeric indexes: 0=Home, 1=Bills, 2=Profile
    document.getElementById('tab-bills')?.addEventListener('click', ()=> navigate(1));
    document.getElementById('tab-profile')?.addEventListener('click', ()=> navigate(2));
  };

  const bindRecent = () => {
    const list = document.getElementById('recent-list');
    if(!list) return;

    const openBill = (el) => {
      const card = el.closest('.bill-card[data-bill]');
      if(!card) return;
      const id = card.getAttribute('data-bill');
      App.viewBillId = id;            // tell Bills view which bill to show
      App.showCreateBill = false;     // ensure we're not on create form
      // Re-render so the Bills view is generated with App.viewBillId set,
      // then perform the navigation so the detail is visible immediately.
      App._rerender?.();
      navigate(1);                    // go to Bills; bills.js will render detail
    };

    list.addEventListener('click', (e)=> openBill(e.target));
    list.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openBill(e.target);
      }
    });
  };

  const refreshHome = () => {
    const container = document.getElementById('home');
    if (container) {
      container.innerHTML = renderHome(App);
      bindTabs();
      bindRecent();
    }
  };

  bindTabs();
  bindRecent();
  document.addEventListener('app:updated', refreshHome);
}

// Optional styles injection for a modern look
const style = document.createElement('style');
style.textContent = `
.home-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.25rem;
}
.fade-in {
  animation: fadein 0.3s ease;
}
@keyframes fadein { from{opacity:0;} to{opacity:1;} }

.card--main-balance {
  background: linear-gradient(135deg, var(--fg-dark, #0f172a), #312e81);
  color: #fff;
  padding: 1.5rem;
  border-radius: 14px;
  text-align: center;
  margin-bottom: 1.2rem;
  box-shadow: 0 8px 18px rgba(0,0,0,.25);
}
.card--main-balance .muted { 
  color: #000000ff;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.card--main-balance .amount { font-size: 2.2rem; font-weight: 700; }
.card--main-balance .amount.pos { color: #4ade80; }
.card--main-balance .amount.neg { color: #f87171; }

.balance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.8rem;
}
.tile {
  border-radius: 10px;
  padding: 1rem;
}
.tile.owe { background: #fee2e2; color: #dc2626; }
.tile.owed { background: #dcfce7; color: #16a34a; }
.tile .label { font-size: 0.9rem; color: #475569; margin-bottom: 0.25rem; }
.tile .value { font-size: 1.5rem; font-weight: 600; }

.recent h2 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: var(--fg, #0f172a);
}
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.bill-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 0.9rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow .2s ease, transform .15s ease;
}
.bill-card:hover { box-shadow: 0 6px 14px rgba(0,0,0,0.1); transform: translateY(-2px); }
.bill-card .info .title { font-weight: 600; margin-bottom: 0.25rem; }
.bill-card .info .date { font-size: 0.85rem; color: #64748b; }
.bill-card .amount { font-weight: 600; font-size: 1.2rem; }
.bill-card .amount.pos { color: #16a34a; }
.bill-card .amount.neg { color: #dc2626; }
.bill-card.clickable { cursor: pointer; }
.bill-card.clickable:focus { outline: 2px solid #0ea5e9; outline-offset: 2px; }
.empty { text-align: center; margin-top: 1rem; }
`;
document.head.appendChild(style);
