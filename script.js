const seedMedicines = [
  { name: 'Paracetamol 500', composition: 'Paracetamol', brand: 'Calpol', manufacturer: 'GSK', batch: 'PCM-001', mfg: '2026-01-01', exp: '2027-12-31', stock: 24, price: 12, code: '890PCM001', notes: 'Fever and pain relief' },
  { name: 'Cetirizine 10', composition: 'Cetirizine', brand: 'Cetzine', manufacturer: 'Dr Reddy', batch: 'CTZ-014', mfg: '2026-02-10', exp: '2028-02-09', stock: 3, price: 8, code: '890CTZ014', notes: 'Allergy tablet' },
  { name: 'ORS Sachet', composition: 'Oral rehydration salts', brand: 'Electral', manufacturer: 'FDC', batch: 'ORS-008', mfg: '2026-03-15', exp: '2027-09-15', stock: 2, price: 22, code: '890ORS008', notes: 'Keep dry' }
];

const state = {
  medicines: JSON.parse(localStorage.getItem('lmhMedicines')) || seedMedicines,
  sales: JSON.parse(localStorage.getItem('lmhSales')) || []
};

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const todayKey = () => new Date().toISOString().slice(0, 10);
const save = () => {
  localStorage.setItem('lmhMedicines', JSON.stringify(state.medicines));
  localStorage.setItem('lmhSales', JSON.stringify(state.sales));
};

function showMessage(id, text, type = 'success') {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `message ${type}`;
}

function validateDates(mfg, exp) {
  return new Date(exp) > new Date(mfg);
}

function renderMedicineOptions() {
  const select = document.getElementById('saleMedicine');
  select.innerHTML = state.medicines.map((medicine, index) => `<option value="${index}">${medicine.name} • Stock ${medicine.stock}</option>`).join('');
  const selected = state.medicines[select.value] || state.medicines[0];
  document.getElementById('saleRate').value = selected ? selected.price : 0;
}

function renderShortList() {
  const lowStock = state.medicines.filter(medicine => Number(medicine.stock) <= 3);
  document.getElementById('shortList').innerHTML = lowStock.length
    ? lowStock.map(medicine => `<li><span>${medicine.name}</span><span>${medicine.stock} left</span></li>`).join('')
    : '<li><span>No low stock medicines</span><span>Healthy</span></li>';
  document.getElementById('lowStockCount').textContent = lowStock.length;
}

function todaysSales() {
  return state.sales.filter(sale => sale.date === todayKey());
}

function renderReports() {
  const sales = todaysSales();
  const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const cash = sales.filter(sale => sale.paymentMode === 'Cash').reduce((sum, sale) => sum + sale.total, 0);
  const online = sales.filter(sale => sale.paymentMode === 'Online').reduce((sum, sale) => sum + sale.total, 0);

  document.getElementById('heroSales').textContent = money(totalAmount);
  document.getElementById('heroItems').textContent = totalSold;
  document.getElementById('totalMedicines').textContent = state.medicines.length;
  document.getElementById('cashTotal').textContent = money(cash);
  document.getElementById('onlineTotal').textContent = money(online);
  document.getElementById('reportSold').textContent = totalSold;
  document.getElementById('reportAmount').textContent = money(totalAmount);
  document.getElementById('reportCash').textContent = money(cash);
  document.getElementById('reportOnline').textContent = money(online);

  document.getElementById('salesTable').innerHTML = sales.length
    ? sales.map(sale => `<tr><td>${sale.time}</td><td>${sale.medicineName}</td><td>${sale.quantity}</td><td>${sale.tablets}</td><td>${sale.strips}</td><td>${sale.paymentMode}</td><td>${money(sale.total)}</td><td>${sale.customer || 'Walk-in'}</td></tr>`).join('')
    : '<tr><td colspan="8">No sales recorded today.</td></tr>';
}

function render() {
  renderMedicineOptions();
  renderShortList();
  renderReports();
  save();
}

document.getElementById('medicineForm').addEventListener('submit', event => {
  event.preventDefault();
  const medicine = {
    name: medicineName.value.trim(),
    composition: composition.value.trim(),
    brand: brand.value.trim(),
    manufacturer: manufacturer.value.trim(),
    batch: batch.value.trim(),
    mfg: mfg.value,
    exp: exp.value,
    stock: Number(stock.value),
    price: Number(price.value),
    code: code.value.trim(),
    notes: notes.value.trim()
  };

  if (!validateDates(medicine.mfg, medicine.exp)) {
    showMessage('medicineMessage', 'EXP Date must be greater than MFG Date.', 'error');
    return;
  }

  const existingIndex = state.medicines.findIndex(item => item.batch.toLowerCase() === medicine.batch.toLowerCase());
  if (existingIndex >= 0) state.medicines[existingIndex] = medicine;
  else state.medicines.push(medicine);

  event.target.reset();
  showMessage('medicineMessage', 'Medicine record saved and short list synced.');
  render();
});

document.getElementById('saleMedicine').addEventListener('change', event => {
  const medicine = state.medicines[event.target.value];
  document.getElementById('saleRate').value = medicine ? medicine.price : 0;
});

document.getElementById('salesForm').addEventListener('submit', event => {
  event.preventDefault();
  const index = Number(saleMedicine.value);
  const medicine = state.medicines[index];
  const quantity = Number(saleQuantity.value);
  const rate = Number(saleRate.value);

  if (!medicine || quantity > Number(medicine.stock)) {
    showMessage('saleMessage', 'Sold quantity cannot exceed available stock.', 'error');
    return;
  }

  medicine.stock = Number(medicine.stock) - quantity;
  state.sales.unshift({
    date: todayKey(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    medicineName: medicine.name,
    quantity,
    tablets: Number(tablets.value || 0),
    strips: Number(strips.value || 0),
    rate,
    total: quantity * rate,
    paymentMode: paymentMode.value,
    customer: customer.value.trim()
  });

  event.target.reset();
  showMessage('saleMessage', 'Sale recorded, inventory updated, and daily summary refreshed.');
  render();
});

document.getElementById('searchButton').addEventListener('click', () => {
  const query = searchInput.value.trim().toLowerCase();
  const medicine = state.medicines.find(item => [item.name, item.batch, item.code].some(value => value.toLowerCase().includes(query)));
  document.getElementById('searchResult').innerHTML = medicine
    ? `<strong>Medicine Available</strong><br>${medicine.name} (${medicine.batch}) • Stock ${medicine.stock} • Rate ${money(medicine.price)}<br><small>${medicine.notes || 'No notes added'}</small>`
    : '<strong>No medicine available</strong><br>Add this item in the medicine master before billing.';
});

render();
