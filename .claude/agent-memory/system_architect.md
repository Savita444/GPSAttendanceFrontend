# System Architect Memory

Private log for the system_architect agent. Read on startup, append after every
completed design/implementation iteration.

## Sections
- **Active task** — the `task_id` currently in flight (if any).
- **Decisions** — architectural decisions made (stack choices, patterns picked, trade-offs accepted).
- **History** — chronological log of iterations, files touched, assumptions noted.

---

## Active Task

T-2026-019 (stage: review)

## Decisions

- T-2026-019: chose target folder=accounts/ (plural) since it already holds the larger surface (34 files); added new subfolders billing/, executions/, common/, services/, vendors/, billing-reports/ under accounts/ to absorb the 14 files from account/ (singular); named vendor billing reports subfolder billing-reports/ to avoid collision with accounts/reports/ (GL financial reports).
- Path depth parity: both account/ and accounts/ are 4 levels deep from src/, so all relative imports (store, utils, tables, ui) in the moved files needed no content changes.
- Backend modules left unchanged: federation/account/ (singular) and federation/accounts/ (plural) serve different domains; no frontend refactor necessitates backend restructuring.

## History

- 2026-05-06T00:00:00Z T-2026-019 iteration 1: merged account/ into accounts/ — 14 files copied to 6 new subfolders; 6 page import paths updated; account/ deleted; TSC 0 errors; Vite build success (3m 17s)

## Active Task
T-2026-021 (stage: review)

## Decisions (T-2026-021)
- Chose to consolidate backend federation/account (billing-operational) INTO federation/accounts/billing-operational/ subfolder
- HTTP mount paths preserved UNCHANGED: /federation/account for billing-operational, /federation/accounts for GL double-entry — frontend slices need zero changes
- All 25 files from account/ (8 entities, 6 services, 6 controllers, 2 validators, 1 routes, 2 seeds) copied to billing-operational/ subfolders
- Import depth: 4-level → 5-level for external deps (core/, utils/, shared/); internal relative paths (../entity/, ../services/) unchanged
- federation.ts router import updated from account/routes/fed-account.routes to accounts/billing-operational/routes/fed-account.routes
- Old account/ folder deleted after successful TSC 0 errors + Vite build success

## History (T-2026-021)
- 2026-05-06T12:30:00Z system_architect iteration 1: backend merge complete — 25 files in billing-operational/ subfolders; federation.ts import updated; account/ deleted; TSC 0 errors backend; TSC 0 errors frontend; Vite build success (26.08s)

## Active Task
T-2026-029-double-entry (stage: complete)

## Decisions (T-2026-029-double-entry)
- Phase 1 commission capture: commissionPercent on fed_services (default 0), vendorCost+commissionPercent+commissionAmount on fed_executions; actualCost = vendorCost + commissionAmount; allocations still sum to actualCost.
- Stage 1 auto-journal (execution lock): Dr Vendor Cost Pass-through (5100-billing), Cr AP-Vendor (2100-billing or sub-account); uses QueryRunner wrapping lock UPDATE + postExecutionLockJournal; rollback on any posting failure.
- Stage 2 auto-journal (billing send): Dr AR-Society (1200.{shortId}), Cr Vendor Cost Recovery (4200), Cr Commission Income (4100-billing); idempotent via source/sourceId columns on fed_accounts_journal_entries.
- Idempotency for journal: source (varchar 30) + sourceId (uuid) columns on fed_accounts_journal_entries; check before each post.
- Idempotency for GL invoice bridge: sourceFedInvoiceId + societyId on fed_accounts_invoices; ON CONFLICT upsert.
- Backward compat: existing executions backfilled with vendorCost=actualCost, commissionPercent=0; no journal entries for pre-deployment locks.
- No active FY graceful degradation: sendInvoiceService checks for ACTIVE FY before GL bridge; operational billing still completes even without GL.
- Vendor AP sub-account by code: 2100.{shortVendorId} (first 8 chars of UUID with hyphens stripped); avoids needing sourceId column on FedAccount.
- Fixed import path: AccountType imported from ../../entity/fed-account.entity (not ../../../entity/fed-account.entity).
- InvoiceDetailDialog.tsx send success message updated to "Sent to societies — visible in their treasurer inbox."
- SQL migration (add_commission_columns.sql): IF NOT EXISTS guards + backfill UPDATE; manually applied by operator.
- Smoke test at tools/federation-accounting/T-2026-029-smoke.js: 7 condition checks (C1-C7).

## History (T-2026-029-double-entry)
- 2026-05-08T00:00:00Z system_architect iteration 1: all backend entities updated; new fed-journal-posting.service.ts; fed-execution.service.ts lock wrapped in QueryRunner; fed-billing.service.ts Phase 2 bridge; validators updated; migration SQL created; frontend: FedServiceSlice, FedExecutionSlice, CreateServiceForm, ServiceList, CreateExecutionForm, ExecutionList, InvoiceDetailDialog updated; TSC 0 errors backend; TSC 0 errors frontend; Vite build success (32.08s); smoke test script created

## Active Task
T-2026-031 (stage: complete)

## Decisions (T-2026-031)
- Single QueryRunner transaction wraps all 5 steps. On any error, full rollback.
- Society bank/cash account: `accounts_accounts` has no subType; returned all ASSET+isActive accounts (no BANK/CASH sub-classification exists in society CoA entity).
- Fed Stage 4 journal: `postTreasurerPayFederationJournal` added to existing `fed-journal-posting.service.ts`. Dr Bank code 1110, Cr AR-Society (1200.xxx preferred; fallback 1100.xxx with lazy-create).
- Society Stage 3 journal: new `fed-society-pay-journal.service.ts`. Lazy-creates "Federation Payable — <FedName>" LIABILITY account (code 2200-FED-<shortId>). Graceful degradation if society GL tables not accessible.
- Bank/cash endpoint: GET `/api/account/federation-invoices/bank-cash-accounts` registered BEFORE `/:id` to prevent UUID param swallowing.
- Idempotency: pre-check on (invoiceId, paidByUserId, amount) in payment_applications before transaction.
- Migration SQL: adds `source varchar(30)`, `"paidByUserId" uuid`, `"paidAt" timestamp` columns + 3 indexes.

## History (T-2026-031)
- 2026-05-08T10:00:00Z system_architect iteration 1: 13 files (7 backend, 6 frontend); TSC 0 errors backend+frontend; Vite build 37.52s.

## Active Task
T-2026-034 (stage: complete)

## Decisions (T-2026-034)
- Auto-pilot filter: `autoPilotEnabled = true` AND `billingMode = 'recurring'` — manual/unbilled services skipped at all 3 levels.
- Auto-close 24h cutoff: `createdAt < (refDate - 24h)`; zero-amount drafts (vendorCost=0 AND actualCost=0) skipped.
- Auto-billing period-end detection: `isLastDayOfMonth` for monthly; `isLastDayOfQuarter` (Mar/Jun/Sep/Dec) for quarterly.
- Idempotency on auto-billing: generateRecurringInvoiceService already throws on duplicate period; we catch that specific error, count as skipped, don't propagate.
- parseBillingPeriodLocal duplicated in fed-auto-billing.service.ts to keep service testable in isolation (doesn't import from fed-billing.service.ts).
- Migration SQL: idempotent DO $$ ... IF NOT EXISTS guards on all 3 columns.
- Manual triggers: same controller file as auto-execution (fed-auto-execution.controller.ts); same auth pattern.
- Frontend: Tooltip wraps the Auto-Pilot button when billingMode != 'recurring'; fields disabled when autoPilotEnabled=false.
- Tooltip import added to CreateServiceForm.tsx (was missing from MUI import list).

## History (T-2026-034)
- 2026-05-09T00:00:00Z system_architect iteration 1: 15 files (9 backend + migration, 4 frontend); TSC 0 errors backend; TSC 0 errors frontend; Vite build 29.85s.

## Active Task
T-2026-035 (stage: develop)

## Decisions (T-2026-035)
- InvoiceType enum extended with ADHOC = 'adhoc' on backend entity + frontend slice type.
- fed_invoice_items columns executionId/allocationId made nullable (were NOT NULL) via idempotent migration; new columns description (varchar 500), hsn (varchar 20), taxRate (numeric 5,2) added.
- generateAdhocInvoiceService creates one fed_invoice_items row per (lineItem × society) in a single QueryRunner transaction; total = sum(lineItems) × count(societies).
- New route POST /billing/adhoc/generate placed BEFORE /billing/invoices/:id to avoid UUID param swallowing.
- adhocInvoiceValidator in fed-account.validator.ts validates lineItems (non-empty array, each with description+amount>0), societyIds (non-empty UUIDs), optional notes.
- AdhocInvoiceBuilder.tsx: editable line items table (description, amount, optional HSN, optional tax%), multi-select society Autocomplete (mirrors ManualInvoiceBuilder), optional Notes textfield, grand total preview, submit button disabled until ≥1 valid line + ≥1 society.
- FederationAccountBillingPage.tsx: 3rd card uses ReceiptLongIcon color="warning", button color="warning" outlined (distinct from primary/secondary of existing two cards), adhocDialogOpen state, handleAdhocDone mirrors handleManualDone.
- HELP text updated to include Adhoc/Misc Bill entry.
- Postgres enum ADD VALUE is not transactional in PG < 12; migration uses DO $$ block to check pg_enum before adding 'adhoc'.
- Rollback migration documents the limitation (PG does not support DROP VALUE; destructive workaround documented for dev only).

## History (T-2026-035)
- 2026-05-09T06:00:00Z system_architect iteration 1: 8 files (3 backend modified, 3 backend new: migration+rollback sql, 2 frontend modified, 1 frontend new AdhocInvoiceBuilder); TSC 0 errors backend; TSC 0 errors frontend; Vite build 29.57s.

## Active Task
T-2026-039 (stage: develop)

## Decisions (T-2026-039)
- Root cause: two-layer bug. (1) PostgreSQL enum type fed_accounts_invoices_status_enum may be missing PARTIALLY_PAID/PAID/OVERDUE/CANCELLED values if DB was provisioned before these were added to the TypeORM entity; the pay service UPDATE would silently fail (transaction rollback) leaving paidAmount=0 and status=SENT. (2) Frontend stat cards (both federation InvoiceList.tsx and society FederationInvoicesList.tsx) computed postedCount/paidCount/outstandingAmt from only the client-side paginated slice rather than from backend aggregates — making counts wrong for datasets larger than one page and making them unaware of PARTIALLY_PAID status.
- Fix strategy: (a) New idempotent SQL migration add_invoice_status_paid_values.sql adds all 4 enum values with DO $$ guard; (b) Backend listInvoicesService and listFedInvoicesForSocietyService extended to return a stats{} object alongside paginated data — computed via a single aggregate SQL query over the full dataset; (c) Redux slices (FedAccountsInvoiceSlice, SocietyFedInvoicesSlice) updated to store stats{} and pass it through from the thunk; (d) Both InvoiceList.tsx components refactored to read stats from Redux rather than computing from client-side slice.
- Stat card "Paid" label updated to show "(+N Partial)" suffix when partiallyPaidCount > 0 — makes partial payments immediately visible to both federation admin and society admin.
- Outstanding formula in federation service: SUM(totalAmount - paidAmount) WHERE status NOT IN (CANCELLED, PAID) — matches the prior client-side logic exactly.
- Outstanding formula in society service: SUM(totalAmount - paidAmount) WHERE status != PAID — CANCELLED not in the visibility filter so no extra exclusion needed.
- Both aggregate queries combine count + status breakdown + financial totals in a single SQL pass (no N+1).

## History (T-2026-039)
- 2026-05-09T13:30:00Z system_architect iteration 1: 6 files (2 backend services modified, 1 SQL migration new, 2 frontend slices modified, 2 frontend components modified); TSC 0 errors backend; TSC 0 errors frontend; Vite build 46.91s.

## Active Task
T-2026-044 (stage: complete)

## Decisions (T-2026-044)
- Root cause: createPaymentService did not have an invoiceId path. The existing applyPaymentService is a separate endpoint used for post-hoc application. When Record Payment is triggered from the InvoiceDetailDialog, no invoiceId was forwarded from frontend to backend.
- Fix strategy: (a) extend createPaymentService data param with optional invoiceId; when provided, validate invoice membership/status/outstanding, set unappliedAmount=0, INSERT payment_application, UPDATE fed_accounts_invoices paidAmount/status/paidAt — all within the existing QueryRunner transaction; (b) extend createPaymentValidator with optional invoiceId UUID; also fix paymentMode enum to include DD and OTHER (front-end sends these modes); (c) extend CreatePaymentPayload with optional invoiceId; (d) CreatePaymentForm accepts invoiceId/invoiceNo props, passes invoiceId in payload, shows "Applying to invoice: <invoiceNo>" info banner; (e) FederationAccountingInvoicesPage.handleRecordPayment captures invoice.id as paymentInvoiceId and invoice.invoiceNo as paymentInvoiceNo, passes both as props to CreatePaymentForm.
- No migration needed: PARTIALLY_PAID/PAID enum values added in T-2026-039; payment_applications table and paidAmount column pre-exist.
- Backward compat: FederationAccountingPaymentsPage still uses CreatePaymentForm without invoiceId — new props are optional, standalone payment behavior unchanged (unappliedAmount = full amount).
- Status transition: PAID when newPaid >= totalAmount - 0.01 (same threshold as reference implementation); PARTIALLY_PAID otherwise; paidAt set only on PAID transition.
- Also fixed pre-existing bug in INSERT: original used '$6,$6' (amount twice for amount+unappliedAmount fields); new code uses separate variable unappliedAmount with '$6,$7' — explicit and correct.

## History (T-2026-044)
- 2026-05-09T19:30:00Z system_architect iteration 1: 5 files (2 backend modified, 3 frontend modified); TSC 0 errors backend; TSC 0 errors frontend; Vite build 24.88s; 21/21 backend+frontend static pattern checks; 7/7 regression checks.

## Active Task
T-2026-046 (stage: complete)

## Decisions (T-2026-046)
- Cross-layer advance deduction: new DB table fed_accounts_advance_applications + appliedAmount column on fed_accounts_advances; new GET /advances/available endpoint; FIFO advance deduction in both createPaymentService and payFederationInvoiceService; advance-only payment path (amount=0) with ADV- receipt prefix; two frontend payment dialogs extended with advance section.
- Both services compute newPaid = currentPaid + amount + advanceApplied; status threshold 0.005/0.01.
- Advance-only idempotency gap identified (pre-T-2026-047): amount=0 path skips payment_applications INSERT so idempotency check cannot find it.

## History (T-2026-046)
- 2026-05-09T22:00:00Z system_architect iteration 1: 13 files (9 backend, 4 frontend); TSC 0 errors; Vite 25.14s; all 13 ACs pass.

## Active Task
T-2026-047 (stage: develop)

## Decisions (T-2026-047)
- Root causes confirmed:
  1. Pre-existing data corruption: rows with status=PAID/PARTIALLY_PAID but paidAmount=0 from before T-2026-044 (createPaymentService never wrote paidAmount) or T-2026-039 (enum missing PAID value caused UPDATE to throw → rollback).
  2. Race condition in payFederationInvoiceService: invoice read at lines 91-109 OUTSIDE the transaction via AppDataSource.query() without FOR UPDATE. currentPaid captured before transaction could be stale if concurrent payment committed between pre-flight read and transaction start.
  3. Idempotency gap for advance-only payments: existingPmt check queries payment_applications with appliedAmount=$3 (amount). When amount=0 (advance-only), Step 3 is guarded by `if (amount > 0)` so no row is inserted → idempotency check misses it → double-application on network retry.
- Fix strategy:
  (a) payFederationInvoiceService: expand idempotency pre-check to cover advance-only payments via advance_applications with a 60-second dedup window.
  (b) payFederationInvoiceService: at Step 1 start, re-read invoice with FOR UPDATE inside transaction; use locked paidAmount/totalAmount for all computations; re-validate status post-lock.
  (c) New SQL migration repair_invoice_paid_amount.sql: repair rows where status IN ('PAID','PARTIALLY_PAID') AND paidAmount=0 by summing payment_applications + advance_applications; also fix reverse case (paidAmount>0 but status still SENT/POSTED).
- No frontend changes needed (code was already correct; data was wrong).
- createPaymentService left unchanged (already has FOR UPDATE inside transaction; idempotency covered by audit log pattern).

## History (T-2026-047)
- 2026-05-11T00:30:00Z system_architect iteration 1: 2 files modified (fed-accounts-invoice-society-pay.service.ts — idempotency fix + FOR UPDATE re-read), 1 file new (repair_invoice_paid_amount.sql); TSC 0 errors backend; Vite 39.95s frontend; no frontend changes.

## Active Task
T-2026-048 (stage: review)

## Decisions (T-2026-048)
- Root cause 1 (primary visible bug): listAdvancesService and getAdvanceByIdService used SELECT a.* which does NOT include a computed remainingAmount field. The fed_accounts_advances table has no remainingAmount physical column — it must be computed as (amount - appliedAmount). Fix: add (a.amount - a."appliedAmount") AS "remainingAmount" to both SELECT queries.
- Root cause 2 (transaction rollback for full-advance applications): fed_accounts_advances_status_enum in PostgreSQL may be missing FULLY_APPLIED. When the FIFO loop UPDATE sets status='FULLY_APPLIED', PostgreSQL throws "invalid input value for enum" → entire payment transaction rolls back → advance stays ACTIVE with appliedAmount=0. Fix: new idempotent SQL migration add_advance_status_fully_applied.sql adds the enum value.
- Root cause 3 (stale data): Pre-existing advance rows where the transaction rolled back have appliedAmount=0 and status=ACTIVE even though advance_applications rows exist. Fix: new idempotent SQL migration repair_advance_applied_amount.sql recomputes from advance_applications table.
- Frontend AdvanceList.tsx: Already correctly uses row.original.remainingAmount ?? 0 for the Remaining column and a.remainingAmount ?? 0 for stat card accumulation. No frontend code changes needed.
- No changes to payment services (FIFO advance UPDATE code is correct).

## History (T-2026-048)
- 2026-05-11T02:00:00Z system_architect iteration 1: 1 backend file modified (fed-accounts-advance.service.ts: listAdvancesService + getAdvanceByIdService — added remainingAmount computed alias to both SELECT queries), 2 new SQL migration files (add_advance_status_fully_applied.sql + repair_advance_applied_amount.sql); TSC 0 errors backend; TSC 0 errors frontend; Vite build 49.19s; no frontend code changes.
