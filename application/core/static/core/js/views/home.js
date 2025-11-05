import { $, fmt, clamp2 } from '../utils.js';
import { currentUser } from '../state.js';

function calculateBalances(bills){
  const map = new Map();
  for(const bill of bills){
    const payer = bill.participants.find(p=>p.paid) || bill.participants[0];
    if(!payer) continue;
    for(const part of bill.participants){
      if(part.userId===payer.userId) continue;
      if(!part.paid && part.share>0){
        const key = `${part.userId}->${payer.userId}`;
        map.set(key, (map.get(key)||0) + part.share);
      }
    }
  }
  const nameFor = (id, bills) => {
    if(id==='me') return 'You';
    for(const b of bills){
      const p = b.participants.find(x=>x.userId===id);
      if(p) return p.name;
    }
    return 'Friend';
  };
  const res = [];
  for(const [key, amount] of map.entries()){
    const [from,to] = key.split('->');
    res.push({ fromUserId:from, toUserId:to, fromName:nameFor(from,bills), toName:nameFor(to,bills), amount:clamp2(amount) });
  }
  return res;
}

export function renderHome(App){
  const balances = calculateBalances(App.bills);
  const youOwe = clamp2(balances.filter(b=>b.fromUserId==='me').reduce((s,b)=>s+b.amount,0));
  const owedToYou = clamp2(balances.filter(b=>b.toUserId==='me').reduce((s,b)=>s+b.amount,0));
  const net = clamp2(owedToYou - youOwe);
  const cur = App.preferences.currency;
  const recentBills = [...App.bills].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const hasDraft = !!localStorage.getItem('Bill Divideter_newBillDraft');

  return `
    <div class="space-y-4">
      <div class="card">
        <h2>Balance Summary</h2>
        <div class="row-2" style="margin:10px 0 14px">
          <div class="center card" style="padding:12px;background:var(--neg-bg)">
            <div class="muted" style="margin-bottom:4px">You Owe</div>
            <div style="font-size:1.5rem;color:var(--neg-fg)">${fmt(youOwe, cur)}</div>
          </div>
          <div class="center card" style="padding:12px;background:var(--pos-bg)">
            <div class="muted" style="margin-bottom:4px">Owed to You</div>
            <div style="font-size:1.5rem;color:var(--pos-fg)">${fmt(owedToYou, cur)}</div>
          </div>
        </div>
        <div class="center card bg-subtle" style="padding:14px">
          <div class="muted" style="margin-bottom:6px">Net Balance</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:.5rem;font-size:1.6rem;${net>=0?'color:var(--pos-fg)':'color:var(--neg-fg)'}">
            ${net>=0?'📈 +':'📉 '}${fmt(net, cur)}
          </div>
        </div>
      </div>

      ${balances.length? `
        <div class="card">
          <h3>Outstanding Balances</h3>
          <div class="space-y-2" style="margin-top:8px">
            ${balances.map(b=>{
              const isYouOwe = b.fromUserId==='me';
              return `
                <div class="card" style="padding:10px;background:${isYouOwe?'var(--neg-bg)':'var(--pos-bg)'}">
                  <div class="row" style="justify-content:space-between;align-items:center">
                    <div>${isYouOwe ? `You owe <strong>${b.toName}</strong>` : `<strong>${b.fromName}</strong> owes you`}</div>
                    <div style="font-weight:600;${isYouOwe?'color:var(--neg-fg)':'color:var(--pos-fg)'}">${fmt(b.amount, cur)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `: ''}

      <div class="card">
        <h3>Quick Actions</h3>
        <div class="grid2" style="margin-top:8px">
          <button id="home-add" class="btn primary"><span class="i"/span>${hasDraft?'Continue Draft':'Add Bill'}</button>
          <button id="home-view" class="btn outline">View All Bills <span class="i"/span></button>
        </div>
      </div>

      <div class="card">
        <h3>Recent Activity</h3>
        ${recentBills.length? `
          <div class="space-y-3" style="margin-top:8px">
            ${recentBills.map(b=>{
              const d = new Date(b.date).toLocaleDateString('en-US',{month:'short',day:'numeric'});
              return `
                <div class="card bg-subtle" style="padding:10px">
                  <div class="row" style="justify-content:space-between">
                    <div>
                      <div style="font-weight:600">${b.title}</div>
                      <div class="muted" style="font-size:.9rem">${d}</div>
                    </div>
                    <div class="right" style="text-align:right">
                      <div style="font-weight:600">${fmt(b.total, cur)}</div>
                      <span class="badge status-${b.status}" style="font-size:.7rem;margin-top:4px">${b.status}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `: `<p class="center muted" style="padding:16px 0">No bills yet. Create your first bill!</p>`}
      </div>
    </div>
  `;
}

export function bindHome(App, {navigate}){
  document.getElementById('home-view')?.addEventListener('click', ()=> navigate(1));
  document.getElementById('home-add')?.addEventListener('click', ()=> { App.shouldOpenCreateForm = true; navigate(1); });
}
