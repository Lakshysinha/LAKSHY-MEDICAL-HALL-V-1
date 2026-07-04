const assert = require('node:assert/strict');
const core = require('./app-core');

const seed = [{ name: 'Test Med', composition: 'ABC', brand: 'Brand', manufacturer: 'Maker', batch: 'B1', mfg: '2026-01-01', exp: '2027-01-01', stock: 5, price: 10, reorderLevel: 3, code: 'CODE1', notes: '' }];
const state = core.buildInitialState(seed.map(item => ({ ...item })));

assert.equal(core.validateDates('2026-01-01', '2027-01-01'), true);
assert.equal(core.validateDates('2027-01-01', '2026-01-01'), false);
assert.equal(core.isLowStock({ stock: 3 }), true);
assert.equal(core.isLowStock({ stock: 4 }), false);

core.upsertMedicine(state, { name: 'New Med', composition: 'XYZ', brand: 'N', manufacturer: 'M', batch: 'B2', mfg: '2026-01-01', exp: '2028-01-01', stock: 2, price: 20, reorderLevel: 3, code: 'CODE2', notes: '' }, { name: 'Tester', role: 'Owner/Admin' });
assert.equal(state.medicines.length, 2);
assert.equal(state.auditLogs[0].action, 'MEDICINE_ADDED');

const sale = core.createSale(state, { batch: 'B1', quantity: 2, tablets: 2, strips: 0, rate: 10, paymentMode: 'Cash', customer: 'Ravi' }, { name: 'Tester', role: 'Staff/Billing user' });
assert.equal(sale.total, 20);
assert.equal(state.medicines.find(item => item.batch === 'B1').stock, 3);
assert.equal(state.customers[0].name, 'Ravi');

const totals = core.dailyTotals(state.sales, core.todayKey());
assert.equal(totals.totalSold, 2);
assert.equal(totals.cash, 20);
assert.equal(totals.online, 0);
assert.equal(core.searchMedicines(state.medicines, 'code2').length, 1);

core.createStockTransaction(state, 'B1', 'Stock In', 4, 'Purchase', { name: 'Tester', role: 'Pharmacist' });
assert.equal(state.medicines.find(item => item.batch === 'B1').stock, 7);

console.log('All app-core tests passed');
