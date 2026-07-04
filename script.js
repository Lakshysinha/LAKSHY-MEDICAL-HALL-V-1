const { money, todayKey, validateDates, isLowStock, isExpiringSoon, buildInitialState, upsertMedicine, createStockTransaction, createSale, dailyTotals, searchMedicines } = window.LMHCore;

const seedMedicines = [
  { name: 'Paracetamol 500', composition: 'Paracetamol', brand: 'Calpol', manufacturer: 'GSK', batch: 'PCM-001', mfg: '2026-01-01', exp: '2027-12-31', stock: 24, price: 12, reorderLevel: 3, code: '890PCM001', notes: 'Fever and pain relief' },
  { name: 'Cetirizine 10', composition: 'Cetirizine', brand: 'Cetzine', manufacturer: 'Dr Reddy', batch: 'CTZ-014', mfg: '2026-02-10', exp: '2028-02-09', stock: 3, price: 8, reorderLevel: 3, code: '890CTZ014', notes: 'Allergy tablet' },
  { name: 'ORS Sachet', composition: 'Oral rehydration salts', brand: 'Electral', manufacturer: 'FDC', batch: 'ORS-008', mfg: '2026-03-15', exp: '2027-09-15', stock: 2, price: 22, reorderLevel: 3, code: '890ORS008', notes: 'Keep dry' },
  { name: 'Amoxicillin 250', composition: 'Amoxicillin', brand: 'Mox', manufacturer: 'Sun Pharma', batch: 'AMX-250', mfg: '2026-04-01', exp: '2026-09-20', stock: 9, price: 45, reorderLevel: 5, code: '890AMX250', notes: 'Prescription required' }
];

const phaseItems = [
  ['Phase 1', 'Roles, modules, forms, and workflow mapping are available in the running UI.'],
  ['Phase 2', 'Local schema-style collections, validation, stock movement, customer records, and audit logs are implemented.'],
  ['Phase 3', 'Medicine, search, short list, sales, inventory update, and reports are implemented.'],
  ['Phase 4', 'Validation helpers and automated Node tests cover critical rules.'],
  ['Phase 5', 'Backup export/import, training checklist, and go-live checklist are available.']
];

const storedState = JSON.parse(localStorage.getItem('lmhCompleteState') || 'null');
let state = storedState || buildInitialState(seedMedicines);

function currentUser() {
  state.currentUser = { name: userName.value.trim() || 'User', role: roleSelect.value };
  return state.currentUser;
}

function save() {
  localStorage.setItem('lmhCompleteState', JSON.stringify(state));
}

function showMessage(id, text, type = 'success') {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `message ${type}`;
}

function rows(items, empty, mapper) {
  return items.length ? items.map(mapper).join('') : empty;
}

function renderPhaseGrid() {
  phaseGrid.innerHTML = phaseItems.map(([phase, detail]) => `<article><strong>${phase}</strong><span>Implemented</span><p>${detail}</p></article>`).join('');
}

function renderMedicineTables() {
  medicineTable.innerHTML = rows(state.medicines, '<tr><td colspan="6">No medicines added.</td></tr>', medicine => {
    const alerts = [];
    if (isLowStock(medicine)) alerts.push('Low stock');
    if (isExpiringSoon(medicine)) alerts.push('Expiring soon');
    return `<tr><td>${medicine.name}<small>${medicine.composition || 'No composition'}</small></td><td>${medicine.batch}</td><td>${medicine.stock}</td><td>${medicine.exp}</td><td>${money(medicine.price)}</td><td>${alerts.join(', ') || 'OK'}</td></tr>`;
  });
}

function renderMedicineOptions() {
  const options = state.medicines.map(medicine => `<option value="${medicine.batch}">${medicine.name} • ${medicine.batch} • Stock ${medicine.stock}</option>`).join('');
  saleMedicine.innerHTML = options;
  stockBatch.innerHTML = options;
  const selected = state.medicines.find(medicine => medicine.batch === saleMedicine.value) || state.medicines[0];
  saleRate.value = selected ? selected.price : 0;
}

function renderShortList() {
  const alerts = state.medicines.filter(medicine => isLowStock(medicine) || isExpiringSoon(medicine));
  shortList.innerHTML = rows(alerts, '<li><span>No low stock or expiry alerts</span><strong>Healthy</strong></li>', medicine => {
    const reason = isLowStock(medicine) ? `${medicine.stock} left` : `EXP ${medicine.exp}`;
    return `<li><span>${medicine.name}</span><strong>${reason}</strong></li>`;
  });
  lowStockCount.textContent = state.medicines.filter(isLowStock).length;
  expiringCount.textContent = state.medicines.filter(medicine => isExpiringSoon(medicine)).length;
}

function renderReports() {
  const totals = dailyTotals(state.sales, todayKey());
  heroSales.textContent = money(totals.totalAmount);
  heroItems.textContent = totals.totalSold;
  totalMedicines.textContent = state.medicines.length;
  auditCount.textContent = state.auditLogs.length;
  reportSold.textContent = totals.totalSold;
  reportAmount.textContent = money(totals.totalAmount);
  reportCash.textContent = money(totals.cash);
  reportOnline.textContent = money(totals.online);
  salesTable.innerHTML = rows(totals.rows, '<tr><td colspan="9">No sales recorded today.</td></tr>', sale => `<tr><td>${sale.time}</td><td>${sale.medicineName}</td><td>${sale.batch}</td><td>${sale.quantity}</td><td>${sale.tablets}</td><td>${sale.strips}</td><td>${sale.paymentMode}</td><td>${money(sale.total)}</td><td>${sale.customer}</td></tr>`);
}

function renderOperations() {
  stockTimeline.innerHTML = rows(state.stockTransactions.slice(0, 8), '<li>No stock movements yet.</li>', item => `<li><strong>${item.type}</strong><span>${item.medicineName} (${item.batch}) • ${item.quantity} • ${item.note || 'No note'}</span></li>`);
  customerList.innerHTML = rows(state.customers.slice(0, 8), '<li>No named customer records yet.</li>', item => `<li><strong>${item.name}</strong><span>${item.date} • ${item.saleId} • ${money(item.amount)}</span></li>`);
  auditList.innerHTML = rows(state.auditLogs.slice(0, 10), '<li>No audit logs yet.</li>', item => `<li><strong>${item.action}</strong><span>${new Date(item.time).toLocaleString()} • ${item.user} (${item.role}) • ${item.detail}</span></li>`);
}

function render() {
  activeUser.textContent = `${state.currentUser.name} / ${state.currentUser.role}`;
  roleSelect.value = state.currentUser.role;
  userName.value = state.currentUser.name;
  renderPhaseGrid();
  renderMedicineOptions();
  renderMedicineTables();
  renderShortList();
  renderReports();
  renderOperations();
  save();
}

medicineForm.addEventListener('submit', event => {
  event.preventDefault();
  const medicine = { name: medicineName.value.trim(), composition: composition.value.trim(), brand: brand.value.trim(), manufacturer: manufacturer.value.trim(), batch: batch.value.trim(), mfg: mfg.value, exp: exp.value, stock: Number(stock.value), price: Number(price.value), reorderLevel: Number(reorderLevel.value || 3), code: code.value.trim(), notes: notes.value.trim() };
  try {
    upsertMedicine(state, medicine, currentUser());
    medicineForm.reset();
    reorderLevel.value = 3;
    showMessage('medicineMessage', 'Medicine saved, batch stock updated, and audit log recorded.');
    render();
  } catch (error) {
    showMessage('medicineMessage', error.message, 'error');
  }
});

saleMedicine.addEventListener('change', () => {
  const selected = state.medicines.find(medicine => medicine.batch === saleMedicine.value);
  saleRate.value = selected ? selected.price : 0;
});

salesForm.addEventListener('submit', event => {
  event.preventDefault();
  try {
    createSale(state, { batch: saleMedicine.value, quantity: saleQuantity.value, tablets: tablets.value, strips: strips.value, rate: saleRate.value, paymentMode: paymentMode.value, customer: customer.value }, currentUser());
    salesForm.reset();
    showMessage('saleMessage', 'Sale recorded, stock reduced, customer history updated, and payment report refreshed.');
    render();
  } catch (error) {
    showMessage('saleMessage', error.message, 'error');
  }
});

stockForm.addEventListener('submit', event => {
  event.preventDefault();
  try {
    createStockTransaction(state, stockBatch.value, stockType.value, stockQuantity.value, stockNote.value, currentUser());
    stockForm.reset();
    render();
  } catch (error) {
    alert(error.message);
  }
});

function displaySearch(query) {
  const matches = searchMedicines(state.medicines, query);
  searchResult.innerHTML = matches.length
    ? matches.map(medicine => `<div><strong>Medicine Available</strong><br>${medicine.name} (${medicine.batch}) • Stock ${medicine.stock} • Rate ${money(medicine.price)} • Code ${medicine.code || 'N/A'}</div>`).join('')
    : '<strong>No medicine available</strong><br>Add this item in the medicine master before billing.';
}

searchButton.addEventListener('click', () => displaySearch(searchInput.value));
scanButton.addEventListener('click', () => {
  const firstCode = state.medicines[0]?.code || '';
  searchInput.value = firstCode;
  displaySearch(firstCode);
});

roleSelect.addEventListener('change', () => { currentUser(); render(); });
userName.addEventListener('change', () => { currentUser(); render(); });

exportButton.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `lakshy-medical-hall-backup-${todayKey()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener('change', event => {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state = JSON.parse(reader.result);
    render();
  };
  reader.readAsText(file);
});

resetButton.addEventListener('click', () => {
  state = buildInitialState(seedMedicines);
  render();
});

render();
