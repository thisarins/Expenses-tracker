
 // ---------- Element references ----------
const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const formError = document.getElementById("formError");
const clearBtn = document.getElementById("clearBtn");

const filterSelect = document.getElementById("filterType");
const searchInput = document.getElementById("search");
const tableBody = document.getElementById("transactionBody");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const balanceEl = document.getElementById("currentBalance");

const STORAGE_KEY = "personalExpenseTracker.transactions";

// ---------- State ----------
let transactions = loadTransactions();

// ---------- Storage ----------
function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    showToast("Could not save to browser storage.", true);
  }
}

// ---------- Helpers ----------
function formatLKR(value) {
  return "LKR " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 10);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let toastTimer;
function showToast(message, isError = false) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  // force reflow so the transition restarts
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------- Validation ----------
function validate() {
  [typeInput, descInput, amountInput, categoryInput, dateInput]
    .forEach(el => el.classList.remove("invalid"));

  const errors = [];

  if (!descInput.value.trim()) {
    errors.push("Enter a description.");
    descInput.classList.add("invalid");
  }

  const amount = parseFloat(amountInput.value);
  if (amountInput.value === "" || isNaN(amount) || amount <= 0) {
    errors.push("Enter an amount greater than zero.");
    amountInput.classList.add("invalid");
  }

  if (!categoryInput.value) {
    errors.push("Select a category.");
    categoryInput.classList.add("invalid");
  }

  if (!dateInput.value) {
    errors.push("Select a date.");
    dateInput.classList.add("invalid");
  }

  if (errors.length) {
    formError.textContent = errors.join(" ");
    formError.hidden = false;
    return false;
  }

  formError.hidden = true;
  return true;
}

// ---------- Core features ----------
function addTransaction(e) {
  e.preventDefault();
  if (!validate()) return;

  transactions.push({
    id: Date.now(),
    type: typeInput.value,
    description: descInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  });

  saveTransactions();
  render();
  resetForm();
  showToast("Transaction added successfully!");
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  render();
  showToast("Transaction deleted.");
}

function resetForm() {
  form.reset();
  dateInput.value = todayISO();
  formError.hidden = true;
  [typeInput, descInput, amountInput, categoryInput, dateInput]
    .forEach(el => el.classList.remove("invalid"));
}

function updateTotals() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  totalIncomeEl.textContent = formatLKR(income);
  totalExpensesEl.textContent = formatLKR(expenses);
  balanceEl.textContent = formatLKR(income - expenses);
}

function getVisibleTransactions() {
  const filter = filterSelect.value;
  const query = searchInput.value.trim().toLowerCase();

  return transactions.filter(t => {
    const matchesType = filter === "all" || t.type === filter;
    const matchesSearch =
      !query ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
}

function renderTable() {
  const visible = getVisibleTransactions();

  if (visible.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="empty">No transactions found.</td></tr>';
    return;
  }

  tableBody.innerHTML = visible.map(t => {
    const sign = t.type === "income" ? "+" : "\u2212";
    return `
      <tr>
        <td>${escapeHTML(t.date)}</td>
        <td>${escapeHTML(t.description)}</td>
        <td><span class="badge ${t.type}">${t.type}</span></td>
        <td>${escapeHTML(t.category)}</td>
        <td class="num amount-${t.type}">${sign} ${formatLKR(t.amount)}</td>
        <td><button type="button" class="btn-delete" data-id="${t.id}">Delete</button></td>
      </tr>`;
  }).join("");
}

function render() {
  updateTotals();
  renderTable();
}

// ---------- Events ----------
form.addEventListener("submit", addTransaction);
clearBtn.addEventListener("click", resetForm);
filterSelect.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);

// Event delegation for delete buttons (rows are rebuilt dynamically)
tableBody.addEventListener("click", e => {
  const btn = e.target.closest(".btn-delete");
  if (btn) deleteTransaction(Number(btn.dataset.id));
});

// ---------- Init ----------
dateInput.value = todayISO();
render();