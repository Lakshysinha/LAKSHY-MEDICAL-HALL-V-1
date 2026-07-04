(function (root) {
  const LOW_STOCK_THRESHOLD = 3;

  function money(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  function todayKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  function validateDates(mfg, exp) {
    return Boolean(mfg && exp && new Date(exp) > new Date(mfg));
  }

  function isLowStock(medicine) {
    return Number(medicine.stock) <= LOW_STOCK_THRESHOLD;
  }

  function isExpiringSoon(medicine, now = new Date(), days = 90) {
    const expiry = new Date(medicine.exp);
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  }

  function buildInitialState(seedMedicines) {
    return {
      currentUser: { name: 'Owner', role: 'Owner/Admin' },
      medicines: seedMedicines,
      sales: [],
      purchases: [],
      stockTransactions: [],
      auditLogs: [],
      customers: [],
      suppliers: [],
      stockTransactions: [],
      auditLogs: [],
      customers: [],
      settings: { lowStockThreshold: LOW_STOCK_THRESHOLD, backupEnabled: true }
    };
  }

  function addAudit(state, action, detail, user) {
    state.auditLogs.unshift({
      time: new Date().toISOString(),
      user: user?.name || state.currentUser?.name || 'System',
      role: user?.role || state.currentUser?.role || 'System',
      action,
      detail
    });
  }

  function upsertMedicine(state, medicine, user) {
    if (!validateDates(medicine.mfg, medicine.exp)) {
      throw new Error('EXP Date must be greater than MFG Date.');
    }
    if (Number(medicine.stock) < 0) {
      throw new Error('Stock cannot be negative.');
    }

    const normalizedBatch = medicine.batch.trim().toLowerCase();
    const existingIndex = state.medicines.findIndex(item => item.batch.toLowerCase() === normalizedBatch);
    const saved = { ...medicine, stock: Number(medicine.stock), price: Number(medicine.price), reorderLevel: Number(medicine.reorderLevel || LOW_STOCK_THRESHOLD) };

    if (existingIndex >= 0) {
      state.medicines[existingIndex] = saved;
      addAudit(state, 'MEDICINE_UPDATED', `${saved.name} (${saved.batch}) updated`, user);
    } else {
      state.medicines.push(saved);
      addAudit(state, 'MEDICINE_ADDED', `${saved.name} (${saved.batch}) added`, user);
    }
    return saved;
  }

  function createStockTransaction(state, batch, type, quantity, note, user) {
    const medicine = state.medicines.find(item => item.batch === batch);
    if (!medicine) throw new Error('Medicine batch not found.');
    const delta = type === 'Stock Out' ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));
    const nextStock = Number(medicine.stock) + delta;
    if (nextStock < 0) throw new Error('Stock cannot be negative.');
    medicine.stock = nextStock;
    const transaction = { date: todayKey(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), medicineName: medicine.name, batch, type, quantity: Math.abs(Number(quantity)), note };
    state.stockTransactions.unshift(transaction);
    addAudit(state, 'STOCK_TRANSACTION', `${type} ${transaction.quantity} for ${medicine.name}`, user);
    return transaction;
  }

  function createPurchase(state, purchaseInput, user) {
    const medicine = state.medicines.find(item => item.batch === purchaseInput.batch);
    if (!medicine) throw new Error('Medicine batch not found.');
    const quantity = Math.abs(Number(purchaseInput.quantity));
    const unitCost = Number(purchaseInput.unitCost || 0);
    if (quantity <= 0) throw new Error('Purchase quantity must be greater than zero.');

    medicine.stock = Number(medicine.stock) + quantity;
    const purchase = {
      id: `PUR-${Date.now()}`,
      date: todayKey(),
      supplier: purchaseInput.supplier?.trim() || 'Unknown supplier',
      medicineName: medicine.name,
      batch: medicine.batch,
      quantity,
      unitCost,
      total: quantity * unitCost,
      invoice: purchaseInput.invoice?.trim() || 'N/A'
    };
    state.purchases.unshift(purchase);
    if (purchase.supplier !== 'Unknown supplier') {
      state.suppliers.unshift({ name: purchase.supplier, date: purchase.date, purchaseId: purchase.id, amount: purchase.total });
    }
    state.stockTransactions.unshift({ date: purchase.date, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), medicineName: purchase.medicineName, batch: purchase.batch, type: 'Purchase', quantity, note: purchase.invoice });
    addAudit(state, 'PURCHASE_CREATED', `${purchase.medicineName} x ${quantity} from ${purchase.supplier}`, user);
    return purchase;
  }

  function createSale(state, saleInput, user) {
    const medicine = state.medicines.find(item => item.batch === saleInput.batch);
    if (!medicine) throw new Error('Medicine batch not found.');
    const quantity = Number(saleInput.quantity);
    const tablets = Number(saleInput.tablets || 0);
    const strips = Number(saleInput.strips || 0);
    const rate = Number(saleInput.rate);
    if (quantity <= 0) throw new Error('Quantity sold must be greater than zero.');
    if (quantity > Number(medicine.stock)) throw new Error('Sold quantity cannot exceed available stock.');
    if (!['Cash', 'Online'].includes(saleInput.paymentMode)) throw new Error('Payment mode is required.');

    medicine.stock = Number(medicine.stock) - quantity;
    const sale = {
      id: `SALE-${Date.now()}`,
      date: todayKey(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      medicineName: medicine.name,
      batch: medicine.batch,
      quantity,
      tablets,
      strips,
      rate,
      total: quantity * rate,
      paymentMode: saleInput.paymentMode,
      customer: saleInput.customer?.trim() || 'Walk-in'
    };
    state.sales.unshift(sale);
    state.stockTransactions.unshift({ date: sale.date, time: sale.time, medicineName: sale.medicineName, batch: sale.batch, type: 'Sale', quantity, note: sale.id });
    if (sale.customer !== 'Walk-in') {
      state.customers.unshift({ name: sale.customer, date: sale.date, saleId: sale.id, amount: sale.total });
    }
    addAudit(state, 'SALE_CREATED', `${sale.medicineName} x ${quantity} paid by ${sale.paymentMode}`, user);
    return sale;
  }

  function dailyTotals(sales, date = todayKey()) {
    const selected = sales.filter(sale => sale.date === date);
    return {
      date,
      totalSold: selected.reduce((sum, sale) => sum + Number(sale.quantity), 0),
      totalAmount: selected.reduce((sum, sale) => sum + Number(sale.total), 0),
      cash: selected.filter(sale => sale.paymentMode === 'Cash').reduce((sum, sale) => sum + Number(sale.total), 0),
      online: selected.filter(sale => sale.paymentMode === 'Online').reduce((sum, sale) => sum + Number(sale.total), 0),
      rows: selected
    };
  }

  function searchMedicines(medicines, query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return medicines.filter(item => [item.name, item.composition, item.brand, item.batch, item.code].some(value => String(value || '').toLowerCase().includes(normalized)));
  }

  const api = { LOW_STOCK_THRESHOLD, money, todayKey, validateDates, isLowStock, isExpiringSoon, buildInitialState, addAudit, upsertMedicine, createStockTransaction, createPurchase, createSale, dailyTotals, searchMedicines };
  const api = { LOW_STOCK_THRESHOLD, money, todayKey, validateDates, isLowStock, isExpiringSoon, buildInitialState, addAudit, upsertMedicine, createStockTransaction, createSale, dailyTotals, searchMedicines };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LMHCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
