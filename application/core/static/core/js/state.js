import { uid } from './utils.js';
import { loadStore } from './storage.js';
import { applyTheme } from './theme.js';

const currentUser = { id:'me', name:'You', email:'you@example.com' };
export { currentUser };

const initialBills = [
  {
    id: uid('bill'),
    title: "Dinner at Mario's",
    date: new Date(Date.now()-86400000*2).toISOString().slice(0,10),
    total: 86.40,
    notes: 'Tax: 8.5%, Tip: 18%',
    status: 'partial',
    createdBy: currentUser.id,
    participants: [
      { userId:'me', name:'You', share:46.40, paid:true },
      { userId:'p2', name:'Alex', share:20, paid:false },
      { userId:'p3', name:'Sam', share:20, paid:false },
    ]
  },
  {
    id: uid('bill'),
    title: "Rideshare to airport",
    date: new Date(Date.now()-86400000*5).toISOString().slice(0,10),
    total: 52,
    notes: 'Tax: 0%, Tip: 0%',
    status: 'settled',
    createdBy: currentUser.id,
    participants: [
      { userId:'me', name:'You', share:26, paid:true },
      { userId:'p4', name:'Jamie', share:26, paid:true },
    ]
  }
];

const initialPreferences = { currency:'USD', theme:'light', notifications:true };
const initialPaymentHandles = [
  { type:'Venmo', value:'@your-handle' },
  { type:'CashApp', value:'$yourname' },
];

const fallback = {
  bills: initialBills,
  preferences: initialPreferences,
  paymentHandles: initialPaymentHandles
};

export const App = {
  isLoggedIn:false,
  username:'',
  currentIndex:0,
  lastIndex:0,
  bills:[],
  preferences:{},
  paymentHandles:[],
  shouldOpenCreateForm:false,
  searchQuery:'',
  statusFilter:'all',
};

export function initState(auth){
  const store = loadStore(fallback);
  App.bills = store.bills;
  App.preferences = store.preferences;
  App.paymentHandles = store.paymentHandles;
  if(auth?.isLoggedIn){ App.isLoggedIn = true; App.username = auth.username||''; }
  applyTheme(App.preferences);
}
