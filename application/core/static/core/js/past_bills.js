// --- Mock data for past bills ---
const bills = [
  {
    id: 1,
    title: "Dinner at Luigi's Restaurant",
    date: "2025-11-03",
    total: 156.75,
    participants: [
      { name: "Alice", amount: 52.25, paid: true },
      { name: "Bob", amount: 52.25, paid: false },
      { name: "Charlie", amount: 52.25, paid: true }
    ]
  },
  {
    id: 2,
    title: "Movie Night & Snacks",
    date: "2025-10-28",
    total: 89.50,
    participants: [
      { name: "Alice", amount: 44.75, paid: true },
      { name: "Dana", amount: 44.75, paid: true }
    ]
  },
  {
    id: 3,
    title: "Weekend Groceries",
    date: "2025-10-25",
    total: 234.80,
    participants: [
      { name: "Alice", amount: 78.27, paid: true },
      { name: "Bob", amount: 78.27, paid: true },
      { name: "Charlie", amount: 78.26, paid: false }
    ]
  },
  {
    id: 4,
    title: "Coffee Shop Meetup",
    date: "2025-10-20",
    total: 47.25,
    participants: [
      { name: "Alice", amount: 15.75, paid: true },
      { name: "Bob", amount: 15.75, paid: true },
      { name: "Dana", amount: 15.75, paid: true }
    ]
  },
  {
    id: 5,
    title: "Birthday Party Supplies",
    date: "2025-10-15",
    total: 312.40,
    participants: [
      { name: "Alice", amount: 62.48, paid: false },
      { name: "Bob", amount: 62.48, paid: true },
      { name: "Charlie", amount: 62.48, paid: false },
      { name: "Dana", amount: 62.48, paid: true },
      { name: "Eve", amount: 62.48, paid: false }
    ]
  }
];

let currentFilter = "all";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function viewBillDetails(billId) {
  alert(
    `Viewing details for bill #${billId}\n\nIn a full implementation, this would show:\n- Complete item breakdown\n- Payment history\n- Options to send reminders\n- Mark payments as received`
  );
}

function renderBills(filter = "all") {
  const container = document.getElementById("billsList");
  if (!container) return;

  let filtered = bills;
  if (filter === "pending") {
    filtered = bills.filter(b => b.participants.some(p => !p.paid));
  } else if (filter === "settled") {
    filtered = bills.filter(b => b.participants.every(p => p.paid));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No bills found</div>
        <div class="empty-text">Try adjusting your filters</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(bill => {
    const paidCount = bill.participants.filter(p => p.paid).length;
    const totalCount = bill.participants.length;

    return `
      <div class="bill-card" data-id="${bill.id}">
        <div class="bill-card-header">
          <div class="bill-info">
            <div class="bill-title">${bill.title}</div>
            <div class="bill-date">${formatDate(bill.date)}</div>
          </div>
          <div class="bill-amount">
            <div class="bill-total-label">Total</div>
            <div class="bill-total">$${bill.total.toFixed(2)}</div>
          </div>
        </div>

        <div class="bill-participants">
          <span class="participants-label">Participants</span>
          <div class="participants-list">
            ${bill.participants.map(p => `
              <div class="participant-item">
                <div>
                  <span class="participant-name">${p.name}</span>
                  <span class="participant-amount">• $${p.amount.toFixed(2)}</span>
                </div>
                <span class="status-badge ${p.paid ? "paid" : "unpaid"}">
                  ${p.paid ? "✓ Paid" : "Unpaid"}
                </span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="bill-summary">
          <div class="payment-status">
            <div class="status-item">
              <span class="status-dot paid"></span>
              <span>${paidCount} paid</span>
            </div>
            <div class="status-item">
              <span class="status-dot unpaid"></span>
              <span>${totalCount - paidCount} unpaid</span>
            </div>
          </div>
          <button class="view-details" data-view="${bill.id}">View Details</button>
        </div>
      </div>
    `;
  }).join("");

  // Click handlers (card + button)
  container.querySelectorAll(".bill-card").forEach(card => {
    card.addEventListener("click", () => viewBillDetails(card.dataset.id));
    const btn = card.querySelector('[data-view]');
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        viewBillDetails(btn.dataset.view);
      });
    }
  });
}

function initFilters() {
  const wrapper = document.getElementById("filters");
  if (!wrapper) return;

  wrapper.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    // set active
    wrapper.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.dataset.filter || "all";
    renderBills(currentFilter);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  renderBills(currentFilter);
});
