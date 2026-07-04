# Medicine Information, Inventory & Sales App – 5-Phase Plan of Action

## Project Goal
Build a pharmacy management app that handles complete medicine master data, inventory tracking, low-stock visibility, scanner-assisted lookup, and detailed daily sales records (including customer record, units sold, payment mode, and cash/online totals).

## Scope Summary (Combined Existing + New Requirements)
The app should support:
- Medicine master management with full labels and metadata.
- Batch-level inventory with MFG/EXP validation.
- Search and scanner-based medicine retrieval.
- Automatic low-stock “Short List” when quantity is `<= 3`.
- A dedicated **Sales Entry** section where users can record for each sale:
  - Medicine name
  - Quantity sold
  - Tablets sold
  - Strips sold
  - Unit/rate and total cost
  - Payment mode (`Cash` or `Online`)
  - Customer sale record (full transaction record for the day; customer name optional)
- Daily reporting with:
  - Total medicines sold
  - Total sales amount
  - Separate total by payment mode (Cash total vs Online total)
  - Day-to-day historical sales and stock movement records

---

## Phase 1: Requirement Finalization & Workflow Mapping
1. Finalize user roles and permissions:
   - Owner/Admin
   - Pharmacist
   - Staff/Billing user
2. Finalize medicine master fields:
   - Medicine Name
   - Generic/Composition
   - Brand
   - Manufacturer
   - Batch No.
   - MFG Date
   - EXP Date
   - Quantity/Stock
   - Price/Rate
   - Label/Notes
   - QR/Code value
3. Finalize application modules:
   - Dashboard
   - Add/Edit Medicine
   - Search Tab
   - Scanner
   - Short List (Low Stock)
   - Sales Entry
   - Daily Sales & Payment Summary
4. Confirm workflow rules:
   - Search displays “Medicine Available” when found, otherwise “No medicine available”.
   - Stock `<= 3` should auto-appear in Short List.
   - Each sale entry must capture sold units and payment mode.
5. Prepare UX wireframes for:
   - Medicine entry form
   - Search + scanner flow
   - Sales form
   - Daily summary dashboard

---

## Phase 2: Data Model & System Design
1. Design database schema:
   - `medicines`
   - `batches`
   - `stock_transactions`
   - `short_list`
   - `sales`
   - `sale_items`
   - `payment_transactions`
   - `customer_records`
   - `users`
2. Define key constraints and validation:
   - Batch number uniqueness per medicine batch.
   - EXP Date must be greater than MFG Date.
   - Stock cannot be negative.
   - Sold quantity (tablets/strips) cannot exceed available stock.
   - Payment mode required for every completed sale.
3. Define API endpoints/services:
   - Add/update/search medicine by name/batch/code
   - Scan code and fetch mapped medicine
   - Create sale with line items and payment mode
   - Get day-wise totals (overall + cash + online)
   - Get customer transaction history by date/day
   - Auto-sync short list based on threshold
4. Security and audit planning:
   - Authentication and role-based access control
   - Audit logs for stock edits and sales entries

---

## Phase 3: Core Feature Development
1. Build medicine module:
   - Add/edit medicine with labels, batch, and date fields
   - Batch-wise stock management
2. Build search + scanner module:
   - Search by medicine name and batch number
   - Scanner integration for strip/QR code lookup
3. Build low-stock automation:
   - Auto-add to Short List at quantity `<= 3`
   - Auto-remove when quantity goes above threshold
4. Build sales section (new key requirement):
   - Sales form to record medicine, quantity, tablets, strips, cost, payment mode
   - Capture customer transaction record (name optional, but full sale record mandatory)
   - Auto-update inventory after each sale
5. Build reporting dashboard:
   - Daily total medicines sold
   - Daily total sales amount
   - Separate payment totals: Cash total and Online total
   - Day-to-day sales and stock trend view

---

## Phase 4: Testing, Validation & Reliability
1. Unit tests:
   - Search availability logic
   - Low-stock threshold logic
   - Date validation logic (MFG/EXP)
   - Sales calculation logic (line item + total + payment split)
2. Integration tests:
   - Batch and scanner retrieval flow
   - Sale creation updates stock correctly
   - Daily summaries (overall/cash/online) are accurate
3. UI and workflow tests:
   - Sales entry usability
   - Daily report correctness
   - Short List consistency after sales/returns
4. Reliability and safety checks:
   - Backup/restore test for sales + inventory data
   - Multi-device scanner compatibility checks

---

## Phase 5: Deployment, Training & Operational Rollout
1. Deploy backend, database, and frontend/mobile app.
2. Configure production monitoring, logs, and automated backups.
3. Train pharmacy users on SOPs:
   - Add and manage medicine records
   - Search and scan medicine
   - Enter sales with tablet/strip quantities and payment mode
   - Review daily totals and payment split reports
4. Go-live checklist:
   - Master data import
   - User account setup
   - Daily closing report verification
5. Post-launch enhancement backlog:
   - Expiry alerts and reorder reminders
   - Barcode + QR dual support
   - Supplier/purchase module
   - Invoice/GST-ready reporting

--Run tests: -p 'test_*.py'
```
