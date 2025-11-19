import { fmt, clamp2 } from '../utils.js';
import { App } from '../state.js';

/** Ensure each participant has an immutable originalShare for display purposes */
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

    // Use the *current* share for balance math (can be 0 after settlement)
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
  // Make sure immutable originalShare exists before any rendering
  ensureOriginalShares(App);

  const balances = calculateBalances(App.bills || []);
  const youOwe = clamp2(balances.filter(b => b.fromUserId === 'me').reduce((s,b)=>s+b.amount,0));
  const owedToYou = clamp2(balances.filter(b => b.toUserId === 'me').reduce((s,b)=>s+b.amount,0));
  const net = clamp2(owedToYou - youOwe);
  const cur = App.preferences?.currency || 'USD';
  const recentBills = [...(App.bills || [])].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

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
        <h2>Recent Bills</h2>
        ${recentBills.length === 0 ? `
          <div class="empty muted">No recent bills yet.</div>
        ` : `
          <div class="recent-list">
            ${recentBills.map(bill => {
              const payer = bill.participants.find(p=>p.paid);
              const isPaidByYou = payer?.userId === 'me';

              // IMPORTANT: use immutable originalShare so it never drops to $0 after you settle
              const yourInitial = bill.participants.find(p=>p.userId==='me')?.originalShare || 0;

              // What the bill meant for you at creation time (display-only)
              const diff = isPaidByYou ? Number(bill.total || 0) - yourInitial : -yourInitial;

              return `
                <div class="bill-card">
                  <div class="info">
                    <div class="title">${bill.title}</div>
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
  // Ensure original shares exist on first bind as well
  ensureOriginalShares(App);

  const bindTabs = () => {
    document.getElementById('tab-bills')?.addEventListener('click', ()=> navigate('bills'));
    document.getElementById('tab-profile')?.addEventListener('click', ()=> navigate('profile'));
  };

  const refreshHome = () => {
    const container = document.getElementById('home');
    if (container) {
      container.innerHTML = renderHome(App);
      bindTabs();
    }
  };

  bindTabs();
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
.tile.owe {
  background: #fee2e2;
  color: #dc2626;
}
.tile.owed {
  background: #dcfce7;
  color: #16a34a;
}
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
  transition: box-shadow .2s ease;
}
.bill-card:hover { box-shadow: 0 6px 14px rgba(0,0,0,0.1); }
.bill-card .info .title { font-weight: 600; margin-bottom: 0.25rem; }
.bill-card .info .date { font-size: 0.85rem; color: #64748b; }
.bill-card .amount { font-weight: 600; font-size: 1.2rem; }
.bill-card .amount.pos { color: #16a34a; }
.bill-card .amount.neg { color: #dc2626; }
.empty { text-align: center; margin-top: 1rem; }
`;
document.head.appendChild(style);
