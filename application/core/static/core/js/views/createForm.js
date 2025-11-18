import { $, $$, on, uid, fmt, clamp2 } from '../utils.js';
import { toast } from '../components/toast.js';
import { App } from '../state.js';
import { saveStore, drafts } from '../storage.js';

const REM_TAX = 'rememberedTax';
const REM_TIP = 'rememberedTip';

/* ----------------------- Render ----------------------- */
export function renderCreateForm() {
  const draft = drafts.get();
  const today = new Date().toISOString().slice(0, 10);
  const savedTax = localStorage.getItem(REM_TAX) || '';
  const savedTip = localStorage.getItem(REM_TIP) || '';
  const rememberTax = !!savedTax;
  const rememberTip = !!savedTip;

  const init = {
    title: draft?.title || '',
    date: draft?.date || today,
    people: draft?.people || [{ id: 'me', name: 'You' }],
    payerId: draft?.payerId || 'me',
    items: draft?.items || [],
    taxPercent: draft?.taxPercent || savedTax || '',
    tipPercent: draft?.tipPercent || savedTip || '',
    rememberTax: draft?.rememberTax ?? rememberTax,
    rememberTip: draft?.rememberTip ?? rememberTip,
    photo: draft?.photo || '',
  };
  const initAttr = encodeURIComponent(JSON.stringify(init));

  return `
    <div id="create" data-init="${initAttr}">
      <h3 class="section-header">Create New Bill</h3>

      <div class="space-y-3" style="margin-top:8px">
        <label class="section-header">Bill Title</label>
        <input id="c-title" class="input" placeholder="Dinner at Mario's, Weekend trip, etc." value="${init.title}" />

        <label class="section-header">Date</label>
        <input id="c-date" class="input" type="date" value="${init.date}" />
      </div>

      <div class="divider"></div>

      <div class="space-y-2">
        <label class="section-header">Add People</label>
        <div class="row">
          <input id="c-person-input" class="input" placeholder="Enter person's name" />
          <button id="c-add-person" class="btn">➕</button>
        </div>
        <div id="c-people" class="chips">
          ${init.people.map(personChip).join('')}
        </div>
      </div>

      <div class="divider"></div>

      <div class="space-y-2">
        <label class="section-header">Who is paying?</label>
        <select id="c-payer" class="select">
          ${init.people.map(p => `<option value="${p.id}" ${p.id===init.payerId?'selected':''}>${p.name}${p.id==='me'?' (You)':''}</option>`).join('')}
        </select>
      </div>

      <div class="divider"></div>

      <div class="space-y-2">
        <label class="section-header">Take Photo (Optional)</label>
        <p class="hint">Snap a photo of your receipt for reference</p>
        ${init.photo ? `
          <img class="img-receipt" src="${init.photo}" alt="Receipt" />
          <div style="margin-top:6px"><button id="c-photo-remove" class="btn destructive">🗑️ Remove Photo</button></div>
        ` : `<input id="c-photo" class="file" type="file" accept="image/*" capture="environment"/>`}
      </div>

      <div class="divider"></div>

      <div>
        <label class="section-header">Add Items</label>
        <div class="row-2" style="margin-top:8px">
          <input id="c-item-name" class="input" placeholder="Item name" ${init.people.length? '':'disabled'} />
          <input id="c-item-price" class="input" type="number" min="0" step="0.01" placeholder="Price" ${init.people.length? '':'disabled'} />
        </div>
        <div style="margin-top:8px">
          ${init.people.length ? `<button id="c-item-add" class="btn primary" style="width:100%">Add Item</button>`
                               : `<p class="hint"><em>Add people first to add items</em></p>`}
        </div>
        <div id="c-items" class="space-y-2" style="margin-top:12px">
          ${init.items.map(i => itemBlock(i, init.people)).join('')}
        </div>
      </div>

      <div class="divider"></div>

      <div class="row-2">
        <div>
          <label class="section-header">Tax (%)</label>
          <input id="c-tax" class="input" type="number" min="0" max="100" step="0.01" placeholder="Tax %" value="${init.taxPercent}" />
          <label style="display:flex; align-items:center; gap:.5rem; margin-top:6px">
            <input id="c-remember-tax" type="checkbox" ${init.rememberTax?'checked':''}/> <span>Remember tax</span>
          </label>
        </div>
        <div>
          <label class="section-header">Tip (%)</label>
          <input id="c-tip" class="input" type="number" min="0" max="100" step="0.01" placeholder="Tip %" value="${init.tipPercent}" />
          <label style="display:flex; align-items:center; gap:.5rem; margin-top:6px">
            <input id="c-remember-tip" type="checkbox" ${init.rememberTip?'checked':''}/> <span>Remember tip</span>
          </label>
        </div>
      </div>

      <div id="c-summary" style="margin-top:12px"></div>

      <div class="row" style="gap:.5rem; margin-top:12px">
        <button id="c-submit" class="btn primary" style="flex:1">Create Bill</button>
        <button id="c-cancel" class="btn outline">Cancel</button>
      </div>
    </div>
  `;
}

/* ----------------------- Templating helpers ----------------------- */
function personChip(p){
  return `
    <span class="chip" data-person="${p.id}">
      <span>${p.name}${p.id==='me'?' (You)':''}</span>
      ${p.id==='me' ? '' : `<button class="btn ghost btn-x" title="Remove" style="padding:.1rem .35rem">✖</button>`}
    </span>
  `;
}

function itemBlock(item, people){
  return `
    <div class="card bg-subtle" data-item="${item.id}" style="padding:10px;">
      <div class="row" style="justify-content:space-between; align-items:center; margin-bottom:6px">
        <div class="row" style="gap:.5rem; align-items:center">
          <strong>${item.name}</strong>
          <span class="muted">${fmt(item.price, App.preferences.currency)}</span>
        </div>
        <div class="row" style="gap:.25rem">
          <button class="btn ghost btn-edit-item" title="Edit">✏️</button>
          <button class="btn ghost btn-del-item" title="Remove">🗑️</button>
        </div>
      </div>
      <div class="chips">
        ${people.map(p=>{
          const selected = (item.participants||[]).includes(p.id);
          return `<span class="chip chip-person ${selected?'active':''}" data-person="${p.id}">${p.name}</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

/* ----------------------- State helpers ----------------------- */
function parseCreateInit(){
  const n = $('#create'); if(!n) return null;
  return JSON.parse(decodeURIComponent(n.getAttribute('data-init')));
}

function currentFormState(){
  const init = parseCreateInit() || {};
  const title = $('#c-title')?.value || '';
  const date = $('#c-date')?.value || new Date().toISOString().slice(0,10);

  const people = [...$('#c-people').querySelectorAll('[data-person]')].map(ch=>{
    const id = ch.getAttribute('data-person');
    const nameNode = ch.querySelector('span');
    const label = nameNode ? nameNode.textContent : '';
    const name = (label || '').replace(' (You)','');
    return { id, name };
  });

  const payerId = $('#c-payer') ? $('#c-payer').value : (init.payerId || 'me');

  const items = [...$('#c-items').children].map(div=>{
    const id = div.getAttribute('data-item');
    const name = div.querySelector('strong').textContent;
    const priceText = div.querySelector('.muted').textContent;
    const price = Number(priceText.replace(/[^\d.]/g,'')) || 0;
    const participants = [...div.querySelectorAll('.chip-person.active')].map(x=>x.getAttribute('data-person'));
    return { id, name, price, participants };
  });

  const taxPercent = $('#c-tax')?.value || '';
  const tipPercent = $('#c-tip')?.value || '';
  const rememberTax = $('#c-remember-tax')?.checked || false;
  const rememberTip = $('#c-remember-tip')?.checked || false;
  const photo = $('#c-photo') ? '' : ($('.img-receipt')?.src || '');

  return { title, date, people, items, taxPercent, tipPercent, rememberTax, rememberTip, payerId, photo };
}

/** Ensure each item shows chips for exactly the provided people list (new people appear, removed people disappear). */
function syncItemChipsWithPeople(people){
  const peopleIds = new Set(people.map(p=>p.id));
  const itemsWrap = $('#c-items');
  if(!itemsWrap) return;

  [...itemsWrap.children].forEach(itemDiv=>{
    const chipsWrap = itemDiv.querySelector('.chips');
    if(!chipsWrap) return;

    // current chips
    const existing = new Map([...chipsWrap.querySelectorAll('.chip-person')].map(ch=>[ch.getAttribute('data-person'), ch]));

    // remove chips for people no longer present
    existing.forEach((chip, pid)=>{
      if(!peopleIds.has(pid)) chip.remove();
    });

    // add chips for any new people (inactive by default)
    people.forEach(p=>{
      if(!existing.has(p.id)){
        const span = document.createElement('span');
        span.className = 'chip chip-person';
        span.setAttribute('data-person', p.id);
        span.textContent = p.name;
        chipsWrap.appendChild(span);
      }
    });
  });
}

/** Remove a person from all items (chip + selection). */
function removePersonFromItems(personId){
  const itemsWrap = $('#c-items'); if(!itemsWrap) return;
  [...itemsWrap.children].forEach(itemDiv=>{
    const chip = itemDiv.querySelector(`.chip-person[data-person="${personId}"]`);
    if(chip) chip.remove();
  });
}

/** Keep payer select synchronized with current people. */
function updatePayerOptions(){
  const sel = $('#c-payer'); if(!sel) return;
  const keep = sel.value;
  const people = currentFormState().people;
  sel.innerHTML = people.map(p=> `<option value="${p.id}" ${p.id===keep?'selected':''}>${p.name}${p.id==='me'?' (You)':''}</option>`).join('');
  if(!people.find(p=>p.id===keep)){
    sel.value = 'me';
  }
}

/* ----------------------- Summary ----------------------- */
function renderSummary(){
  const s = currentFormState();
  const tax = parseFloat(s.taxPercent)||0;
  const tip = parseFloat(s.tipPercent)||0;

  const rows = s.people.map(person=>{
    let subtotal = 0;
    (s.items||[]).forEach(item=>{
      if((item.participants||[]).includes(person.id)){
        const share = item.price / Math.max(1, item.participants.length);
        subtotal += share;
      }
    });
    const taxAmt = subtotal>0 ? subtotal * tax/100 : 0;
    const tipAmt = subtotal>0 ? subtotal * tip/100 : 0;
    const total = clamp2(subtotal + taxAmt + tipAmt);
    return { person, subtotal:clamp2(subtotal), tax:clamp2(taxAmt), tip:clamp2(tipAmt), total };
  });

  const grand = clamp2(rows.reduce((a,r)=>a+r.total,0));
  const cur = App.preferences.currency;

  const html = rows.length && (s.items||[]).length ? `
    <div class="divider"></div>
    <label class="section-header">Summary</label>
    <div class="space-y-3" style="margin-top:8px">
      ${rows.map(r=>`
        <div class="card" style="background:color-mix(in srgb, var(--blue-100) 40%, transparent)">
          <div style="font-weight:600; margin-bottom:6px">${r.person.name}</div>
          <div class="space-y-2" style="font-size:.95rem">
            <div class="row" style="justify-content:space-between"><span class="muted">Subtotal:</span><span>${fmt(r.subtotal, cur)}</span></div>
            <div class="row" style="justify-content:space-between"><span class="muted">Tax (${s.taxPercent||0}%):</span><span>${fmt(r.tax, cur)}</span></div>
            <div class="row" style="justify-content:space-between"><span class="muted">Tip (${s.tipPercent||0}%):</span><span>${fmt(r.tip, cur)}</span></div>
            <div class="divider"></div>
            <div class="row" style="justify-content:space-between"><span>Total:</span><span style="font-weight:700">${fmt(r.total, cur)}</span></div>
          </div>
        </div>
      `).join('')}
      <div class="card bg-subtle">
        <div class="row" style="justify-content:space-between">
          <span style="font-weight:700">Grand Total:</span>
          <span style="font-weight:800">${fmt(grand, cur)}</span>
        </div>
      </div>
    </div>
  ` : '';
  $('#c-summary').innerHTML = html;
  return { rows, grand };
}

/* ----------------------- Draft & Bindings ----------------------- */
function saveDraftMaybe(){
  const s = currentFormState();
  const hasContent = (s.title.trim() || (s.people||[]).length>1 || (s.items||[]).length>0);
  if(hasContent){ drafts.set(s); } else { drafts.clear(); }
  updatePayerOptions();
  renderSummary();
}

export function bindCreateForm(){
  const wrap = $('#create'); if(!wrap) return;

  // Live draft + summary
  ['#c-title','#c-date','#c-tax','#c-tip','#c-remember-tax','#c-remember-tip','#c-payer']
    .forEach(sel => { const el=$(sel); if(el){ on(el,'input',saveDraftMaybe); on(el,'change',saveDraftMaybe); }});

  /* People add/remove (and sync to items) */
  const addPerson = ()=>{
    const inp = $('#c-person-input');
    const name = (inp.value||'').trim();
    if(!name){ toast('Please enter a name'); return; }
    const id = uid('person');

    const people = currentFormState().people.concat([{id, name}]);
    $('#c-people').innerHTML = people.map(personChip).join('');
    syncItemChipsWithPeople(people);

    inp.value='';
    saveDraftMaybe();
  };
  on($('#c-add-person'),'click',addPerson);
  on($('#c-person-input'),'keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addPerson(); }});

  on($('#c-people'),'click',(e)=>{
    const chip = e.target.closest('[data-person]'); if(!chip) return;
    if(e.target.closest('.btn-x')){
      const id = chip.getAttribute('data-person');
      if(id==='me'){ toast('You cannot remove yourself from the bill'); return; }
      chip.remove();
      removePersonFromItems(id);
      saveDraftMaybe();
    }
  });

  /* Photo handlers */
  const file = $('#c-photo');
  if(file){
    on(file,'change', ()=>{
      const f = file.files?.[0]; if(!f) return;
      if(f.size > 5*1024*1024){ toast('Image size must be less than 5MB'); file.value=''; return; }
      const reader = new FileReader();
      reader.onloadend = ()=>{
        const url = reader.result;
        const container = file.parentElement;
        container.innerHTML = `
          <img class="img-receipt" src="${url}" alt="Receipt"/>
          <div style="margin-top:6px"><button id="c-photo-remove" class="btn destructive">🗑️ Remove Photo</button></div>
        `;
        toast('Photo added successfully!');
        bindCreateForm();
        saveDraftMaybe();
      };
      reader.readAsDataURL(f);
    });
  }
  on($('#c-photo-remove'),'click', ()=>{
    const container = $('#c-photo-remove').parentElement.parentElement;
    container.innerHTML = `<input id="c-photo" class="file" type="file" accept="image/*" capture="environment"/>`;
    bindCreateForm(); saveDraftMaybe();
  });

  /* Items add/edit/remove + chip toggle */
  const tryAddItem = ()=>{
    const nameEl = $('#c-item-name'); const priceEl = $('#c-item-price');
    const name = (nameEl.value||'').trim();
    const price = parseFloat(priceEl.value||'');
    if(!name){ toast('Please enter an item name'); return false; }
    if(isNaN(price) || price<=0){ toast('Please enter a valid price'); return false; }

    const id = uid('item');
    const people = currentFormState().people;
    $('#c-items').insertAdjacentHTML('beforeend', itemBlock({id, name, price, participants:[]}, people));

    nameEl.value=''; priceEl.value='';
    saveDraftMaybe();
    return true;
  };
  on($('#c-item-add'),'click', tryAddItem);
  ['#c-item-name','#c-item-price'].forEach(sel=>{
    const el=$(sel); if(!el) return;
    on(el,'keydown',(e)=>{
      if(e.key==='Enter'){
        e.preventDefault();
        const ok = ($('#c-item-name').value||'').trim() && parseFloat($('#c-item-price').value||'')>0;
        if(ok) tryAddItem();
      }
    });
  });

  on($('#c-items'),'click',(e)=>{
    const item = e.target.closest('[data-item]'); if(!item) return;

    if(e.target.closest('.btn-del-item')){
      item.remove(); saveDraftMaybe(); return;
    }
    if(e.target.closest('.btn-edit-item')){
      const name = prompt('Item name', item.querySelector('strong').textContent);
      if(!name) return;
      const cur = Number(item.querySelector('.muted').textContent.replace(/[^\d.]/g,'')) || 0;
      const price = parseFloat(prompt('Item price', cur) || cur);
      if(isNaN(price) || price<=0){ toast('Invalid price'); return; }
      item.querySelector('strong').textContent = name;
      item.querySelector('span.muted').textContent = fmt(price, App.preferences.currency);
      saveDraftMaybe(); return;
    }

    const chip = e.target.closest('.chip-person');
    if(chip){
      chip.classList.toggle('active');
      saveDraftMaybe();
    }
  });

  // initial summary render
  renderSummary();

  /* Submit / Cancel */
  on($('#c-submit'),'click', ()=>{
    const st = currentFormState();
    if(!st.title.trim()){ toast('Please enter a bill title'); return; }
    if((st.people||[]).length === 0){ toast('Please add at least one person'); return; }
    if((st.items||[]).length === 0){ toast('Please add at least one item'); return; }

    const { rows, grand } = renderSummary();

    // Persist full itemization and metadata for past-bill details
    const newBill = {
      id: uid('bill'),
      title: st.title.trim(),
      date: st.date,
      total: grand,
      notes: `Tax: ${st.taxPercent||0}%, Tip: ${st.tipPercent||0}%`,
      items: (st.items||[]).map(i=>({
        id: i.id,
        name: i.name,
        price: i.price,
        participants: [...(i.participants||[])]
      })),
      photo: st.photo || '',
      taxPercent: st.taxPercent || '',
      tipPercent: st.tipPercent || '',
      payerId: st.payerId || 'me',
      participants: rows.map(r=>({
        userId: r.person.id,
        name: r.person.name,
        share: r.total,
        paid: r.person.id === st.payerId
      })),
      status: st.payerId ? 'partial' : 'pending',
      createdBy: 'me',
    };

    App.bills = [newBill, ...App.bills];
    saveStore(App);
    drafts.clear();
    if(st.rememberTax && st.taxPercent) localStorage.setItem(REM_TAX, st.taxPercent);
    if(st.rememberTip && st.tipPercent) localStorage.setItem(REM_TIP, st.tipPercent);
    toast('Bill created successfully!');
    App.shouldOpenCreateForm = false;
    App._rerender();
  });

  on($('#c-cancel'),'click', ()=>{
    drafts.clear();
    App.shouldOpenCreateForm = false;
    App._rerender();
  });

  // prevent Enter from submitting whole form unexpectedly
  ['c-title','c-date','c-person-input','c-item-name','c-item-price'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) on(el,'keydown', e=>{
      if(e.key==='Enter' && id!=='c-item-name' && id!=='c-item-price'){ e.preventDefault(); }
    });
  });
}
