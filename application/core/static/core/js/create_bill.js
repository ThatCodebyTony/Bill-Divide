// ----- Bill Splitter logic -----

let users = [];
let items = [];

// Load saved preferences & initial render
window.onload = function () {
    const savedTax = localStorage.getItem('savedTax');
    const savedTip = localStorage.getItem('savedTip');

    if (savedTax) {
        document.getElementById('taxInput').value = savedTax;
        document.getElementById('rememberTax').checked = true;
    }

    if (savedTip) {
        document.getElementById('tipInput').value = savedTip;
        document.getElementById('rememberTip').checked = true;
    }

    renderUsers();
    renderItems();
    calculate();

    // Enter-to-add interactions
    const userName = document.getElementById('userName');
    const itemName = document.getElementById('itemName');
    const itemPrice = document.getElementById('itemPrice');

    if (userName) {
        userName.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addUser();
        });
    }
    if (itemName) {
        itemName.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                itemPrice?.focus();
            }
        });
    }
    if (itemPrice) {
        itemPrice.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addItem();
        });
    }
};

function addUser() {
    const input = document.getElementById('userName');
    const name = (input.value || '').trim();

    if (name && !users.includes(name)) {
        users.push(name);
        input.value = '';
        renderUsers();
        renderItems();
        calculate();
    }
}

function removeUser(name) {
    users = users.filter(u => u !== name);
    items.forEach(item => {
        item.splitWith = item.splitWith.filter(u => u !== name);
    });
    renderUsers();
    renderItems();
    calculate();
}

function renderUsers() {
    const container = document.getElementById('usersList');

    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = '<div style="color: #999; font-size: 14px;">No people added yet. Add people to start splitting!</div>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-chip">
            <span>${escapeHtml(user)}</span>
            <button onclick="removeUser('${escapeAttr(user)}')" title="Remove">×</button>
        </div>
    `).join('');
}

function addItem() {
    const nameInput = document.getElementById('itemName');
    const priceInput = document.getElementById('itemPrice');

    const name = (nameInput.value || '').trim();
    const price = parseFloat(priceInput.value);

    if (name && price > 0) {
        items.push({
            id: Date.now(),
            name: name,
            price: price,
            splitWith: []
        });

        nameInput.value = '';
        priceInput.value = '';
        renderItems();
        calculate();
    }
}

function removeItem(id) {
    items = items.filter(item => item.id !== id);
    renderItems();
    calculate();
}

function toggleSplit(itemId, userName) {
    const item = items.find(i => i.id === itemId);
    if (item) {
        const index = item.splitWith.indexOf(userName);
        if (index > -1) {
            item.splitWith.splice(index, 1);
        } else {
            item.splitWith.push(userName);
        }
        renderItems();
        calculate();
    }
}

function editItem(id) {
    const item = items.find(i => i.id === id);
    if (item) {
        item.editing = true;
        renderItems();
    }
}

function saveItem(id) {
    const nameInput = document.getElementById(`edit-name-${id}`);
    const priceInput = document.getElementById(`edit-price-${id}`);

    const item = items.find(i => i.id === id);
    if (item && nameInput && priceInput) {
        const newName = (nameInput.value || '').trim();
        const newPrice = parseFloat(priceInput.value);

        if (newName && newPrice > 0) {
            item.name = newName;
            item.price = newPrice;
            item.editing = false;
            renderItems();
            calculate();
        }
    }
}

function cancelEdit(id) {
    const item = items.find(i => i.id === id);
    if (item) {
        item.editing = false;
        renderItems();
    }
}

function renderItems() {
    const container = document.getElementById('itemsList');

    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 14px;">No items added yet.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-header">
                <div class="item-info">
                    ${item.editing ? `
                        <input 
                            type="text" 
                            id="edit-name-${item.id}" 
                            class="item-edit-input" 
                            value="${escapeAttr(item.name)}"
                        />
                        <input 
                            type="number" 
                            id="edit-price-${item.id}" 
                            class="item-edit-price" 
                            value="${item.price}" 
                            step="0.01" 
                            min="0"
                        />
                    ` : `
                        <div class="item-name">${escapeHtml(item.name)}</div>
                        <div class="item-price">$${item.price.toFixed(2)}</div>
                    `}
                </div>
                <div class="item-actions">
                    ${item.editing ? `
                        <button class="btn btn-save" onclick="saveItem(${item.id})">Save</button>
                        <button class="btn btn-cancel" onclick="cancelEdit(${item.id})">Cancel</button>
                    ` : `
                        <button class="btn btn-edit" onclick="editItem(${item.id})">Edit</button>
                        <button class="btn btn-danger" onclick="removeItem(${item.id})">Remove</button>
                    `}
                </div>
            </div>
            ${users.length > 0 ? `
                <div class="item-split">
                    <span class="split-label">Split between:</span>
                    <div class="split-users">
                        ${users.map(user => `
                            <button 
                                class="split-user-btn ${item.splitWith.includes(user) ? 'active' : ''}"
                                onclick="toggleSplit(${item.id}, '${escapeAttr(user)}')"
                            >
                                ${escapeHtml(user)}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : (!item.editing ? '<div class="split-label" style="color: #ff4757;">Add people first to split this item</div>' : '')}
        </div>
    `).join('');
}

function calculate() {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const taxRate = parseFloat(document.getElementById('taxInput').value) || 0;
    const tipRate = parseFloat(document.getElementById('tipInput').value) || 0;

    const taxAmount = subtotal * (taxRate / 100);
    const tipAmount = subtotal * (tipRate / 100);
    const total = subtotal + taxAmount + tipAmount;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('taxAmount').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('tipAmount').textContent = `$${tipAmount.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;

    calculatePerPerson(taxRate, tipRate);
}

function calculatePerPerson(taxRate, tipRate) {
    const breakdown = {};
    users.forEach(user => { breakdown[user] = 0; });

    items.forEach(item => {
        if (item.splitWith.length > 0) {
            const perPerson = item.price / item.splitWith.length;
            item.splitWith.forEach(user => { breakdown[user] += perPerson; });
        }
    });

    const container = document.getElementById('personBreakdown');
    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = '<div style="color: #667eea; text-align: center; padding: 10px;">Add people to see breakdown</div>';
        return;
    }

    const html = users.map(user => {
        const userSubtotal = breakdown[user];
        const userTax = userSubtotal * (taxRate / 100);
        const userTip = userSubtotal * (tipRate / 100);
        const userTotal = userSubtotal + userTax + userTip;

        return `
            <div class="person-row">
                <div class="person-header">
                    <span class="person-name">${escapeHtml(user)}</span>
                    <span class="person-amount">$${userTotal.toFixed(2)}</span>
                </div>
                <div class="person-details">
                    <div class="person-detail-item">
                        <span class="person-detail-label">Subtotal:</span>
                        <span class="person-detail-value">$${userSubtotal.toFixed(2)}</span>
                    </div>
                    <div class="person-detail-item">
                        <span class="person-detail-label">Tax:</span>
                        <span class="person-detail-value">$${userTax.toFixed(2)}</span>
                    </div>
                    <div class="person-detail-item">
                        <span class="person-detail-label">Tip:</span>
                        <span class="person-detail-value">$${userTip.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function handleRememberTax() {
    const checkbox = document.getElementById('rememberTax');
    const taxValue = document.getElementById('taxInput').value;

    if (checkbox.checked && taxValue) {
        localStorage.setItem('savedTax', taxValue);
    } else {
        localStorage.removeItem('savedTax');
    }
}

function handleRememberTip() {
    const checkbox = document.getElementById('rememberTip');
    const tipValue = document.getElementById('tipInput').value;

    if (checkbox.checked && tipValue) {
        localStorage.setItem('savedTip', tipValue);
    } else {
        localStorage.removeItem('savedTip');
    }
}

/* --- Small helpers to safely inject text --- */
function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
function escapeAttr(str) {
    // Slightly stricter for attribute contexts
    return escapeHtml(str).replaceAll('`', '&#096;');
}

// ----- Floating Create Bill button logic -----
(function () {
  const fab = document.getElementById('createBillFab');
  if (!fab) return; // if the element isn't on this page, bail

  // Define the minimal requirements:
  // - at least 1 person (a .user-chip rendered in #usersList)
  // - at least 1 item with a positive price (we look for .item-card OR numeric price text)
  function meetsMinimalRequirements() {
    const hasPerson = !!document.querySelector('#usersList .user-chip');

    // Prefer item cards if your UI renders them; fallback to any number > 0 we can detect
    const hasItemCard = !!document.querySelector('#itemsList .item-card');
    let hasPricedItem = hasItemCard;

    if (!hasPricedItem) {
      // Fallback heuristic: scan any $amounts inside itemsList
      const priceTexts = Array.from(document.querySelectorAll('#itemsList *'))
        .map(n => n.textContent || '')
        .join(' ');
      const match = priceTexts.match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      hasPricedItem = match ? parseFloat(match[1]) > 0 : false;
    }

    return hasPerson && hasPricedItem;
  }

  function updateFabVisibility() {
    fab.hidden = !meetsMinimalRequirements();
  }

  // Watch the users and items containers for changes
  const usersList = document.getElementById('usersList');
  const itemsList = document.getElementById('itemsList');
  const observerConfig = { childList: true, subtree: true };

  if (usersList) new MutationObserver(updateFabVisibility).observe(usersList, observerConfig);
  if (itemsList) new MutationObserver(updateFabVisibility).observe(itemsList, observerConfig);

  // Also update after any input changes in the items section (in case you allow inline editing)
  document.addEventListener('input', (e) => {
    if (itemsList && itemsList.contains(e.target)) updateFabVisibility();
  });

  // Initial state
  document.addEventListener('DOMContentLoaded', updateFabVisibility);

  // Click behavior for Create Bill
  fab.addEventListener('click', () => {
    // TODO: replace with your real "finalize" action.
    // Example: submit a form, call an API, or navigate to a confirmation page.

    // If you already have a function that computes and finalizes, call it here:
    // finalizeBill();

    // For now, show a lightweight confirmation preview:
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    const subtotal = subtotalEl ? subtotalEl.textContent.trim() : '';
    const total = totalEl ? totalEl.textContent.trim() : '';

    alert(`Creating bill...\n\nSubtotal: ${subtotal}\nTotal: ${total}\n\n(Replace this with your actual submit logic.)`);
  });
})();
