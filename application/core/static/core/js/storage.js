const STORAGE_KEY = 'Bill Divideter_store';
const AUTH_KEY = 'Bill Divideter_auth';
const DRAFT_KEY = 'Bill Divideter_newBillDraft';

export const Keys = { STORAGE_KEY, AUTH_KEY, DRAFT_KEY };

export function loadStore(fallback){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      bills: parsed.bills ?? fallback.bills,
      preferences: parsed.preferences ?? fallback.preferences,
      paymentHandles: parsed.paymentHandles ?? fallback.paymentHandles,
    };
  }catch(e){
    console.error('loadStore', e);
    return fallback;
  }
}

export function saveStore(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    bills: state.bills,
    preferences: state.preferences,
    paymentHandles: state.paymentHandles,
  }));
}

export const auth = {
  load(){
    try{ return JSON.parse(localStorage.getItem(AUTH_KEY)||'{}'); }catch{ return {}; }
  },
  save(payload){ localStorage.setItem(AUTH_KEY, JSON.stringify(payload)); },
  clear(){ localStorage.removeItem(AUTH_KEY); }
};

export const drafts = {
  get(){ try{ return JSON.parse(localStorage.getItem(DRAFT_KEY)||'null'); }catch{ return null; } },
  set(v){ localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); },
  clear(){ localStorage.removeItem(DRAFT_KEY); }
};
