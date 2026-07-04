# Updated things

## Current progress
- Upgraded the project into a company-ready, offline-capable pharmacy management app covering all five README phases in one browser app.
- Replaced localStorage persistence with IndexedDB-backed storage so the app can handle heavier local datasets than ordinary key/value browser storage.
- Added a PWA manifest and service worker so the app can be installed and opened offline after first load.
- Added role/user switching for Owner/Admin, Pharmacist, and Staff/Billing workflows.
- Added medicine master entry with name, composition, brand, manufacturer, batch, MFG/EXP, stock, rate, reorder level, notes, and QR/barcode fields.
- Added schema-style local collections for medicines, sales, purchases, stock transactions, audit logs, customer records, supplier records, and settings.
- Added validation for EXP Date greater than MFG Date, non-negative stock, required payment mode, purchase quantity, and preventing sales above available stock.
- Added search/scanner-style lookup by medicine name, composition, brand, batch number, or code with “Medicine Available” / “No medicine available” results.
- Added automatic Short List logic for medicines with stock quantity `<= 3` plus expiring-soon alerts.
- Added Sales Entry with quantity sold, tablets sold, strips sold, unit/rate, customer name, and Cash/Online payment mode.
- Added automatic inventory reduction after every valid sale and stock movement records for sale, stock in, stock out, and purchase events.
- Added supplier/company purchase entry with supplier name, purchase quantity, unit cost, invoice number, supplier history, and purchase audit logging.
- Added daily dashboard/report totals for medicines sold, total sales amount, cash total, online total, and transaction rows.
- Added customer history for named customers.
- Added audit logs for medicine edits, stock transactions, purchase entries, and sale entries.
- Added backup export/import controls, reset demo data control, CSV sales export, printable daily report, and a go-live/training checklist.
- Added reusable app-core logic and automated Node tests for validations, sales, purchases, totals, search, audit, and stock transactions.

## Done from README plan
- Phase 1 Requirement Finalization & Workflow Mapping: implemented as role switcher, module sections, medicine form, search/scanner flow, sales form, daily dashboard, and phase tracker.
- Phase 2 Data Model & System Design: implemented locally with IndexedDB persistence, schema-style collections, validation rules, stock transactions, purchases, customer records, supplier records, settings, and audit logs.
- Phase 3 Core Feature Development: implemented medicine module, batch stock, search, simulated scanner lookup, low-stock automation, sales entry, purchase entry, inventory update, customer record, supplier record, and reporting dashboard.
- Phase 4 Testing, Validation & Reliability: added reusable core functions and Node tests for key logic; added backup/restore UI and heavier IndexedDB storage for operational safety.
- Phase 5 Deployment, Training & Operational Rollout: added installable PWA files, offline cache, export/import backup controls, CSV export, printable report, and a go-live/training checklist inside the running app.

## Still pending / future production improvements
- Add a cloud sync backend when multiple shops or multiple devices must share one live database.
- Replace simulated scanner lookup with live camera barcode/QR scanning.
- Add real authentication sessions, passwords, encryption-at-rest strategy, and server-enforced role permissions for regulated deployments.
- Add invoice templates, GST-ready reporting, supplier purchase orders, and payment gateway integrations.
- Run browser-based end-to-end load tests once a browser engine is available in the environment.
