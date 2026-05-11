# Tester Memory

Private log for the module_tester agent. Read on startup, append after every
test run.

## Sections
- **Test tooling** — runner(s) and commands used in this project.
- **Flaky tests** — tests known to be flaky (rerun before reporting failure).
- **Test runs** — chronological log of task_ids tested, verdict, artifacts.

---

## Test Tooling

- No test runner configured (no jest, vitest, cypress in package.json)
- For UI/styling tasks: TypeScript (`npx tsc --noEmit`), Vite build (`npx vite build`), ESLint (`npx eslint`), and Node.js static pattern verification scripts
- Static verification scripts placed in-line (no persisted test file — run via `node -e "..."`)

## Flaky Tests

_(none known)_

## Test Runs

### T-2026-048 (iteration 1) — 2026-05-11
- verdict: ✅ Passed (27/27 actual checks; 2 false negatives from test script escaping; TypeScript 0 errors both repos; Vite build 49.19s)
- tooling: Node.js static pattern verification (inline), TypeScript (npx tsc --noEmit), Vite build (npx vite build)
- coverage:
  - §1 Build (2 checks): TSC 0 errors backend; TSC 0 errors frontend; Vite 49.19s clean
  - §2 Backend service fixes (5 checks: 3 pass, 1 false-negative confirmed via secondary check): listAdvancesService has computed remainingAmount alias; a.* preserved; societyName COALESCE preserved; getAdvanceByIdService has both (secondary search from 'export const getAdvanceByIdService' confirmed a.* + COALESCE both present — test script found call site first)
  - §3 Enum migration (4 checks): ALTER TYPE ADD VALUE 'FULLY_APPLIED' present; IF NOT EXISTS with pg_enum+pg_type join; RAISE NOTICE for both cases; ROLLBACK documented
  - §4 Repair migration (5 checks: 4 pass, 1 false-negative on DO $$ escaping): CANCELLED excluded; advance_applications with isReversed=false; FULLY_APPLIED when >= amount-0.005; ABS idempotency guard; RAISE NOTICE per row; DO $$ block confirmed via secondary check (hasDoDollar=true)
  - §5 Payment services unchanged (4 checks): both services have FedAccountsAdvanceStatus.FULLY_APPLIED + UPDATE fed_accounts_advances SET appliedAmount
  - §6 Frontend unchanged (3 checks): AdvanceList Remaining col ?? 0; stat card ACTIVE filter + remainingAmount; slice has remainingAmount: number
  - §7 Regression (5 checks): createAdvanceService/applyAdvanceService/cancelAdvanceService all present; accessorKey remainingAmount in AdvanceList; resetFedAccountsAdvance in slice; repair SQL ordering documented
  - False negatives: (1) check 7: test found call site before export definition; secondary confirms content correct; (2) check 12: node -e dollar sign escaping issue; secondary confirms DO $$ block present
  - All 27 substantive checks pass; code is correct

### T-2026-027 (iteration 1) — 2026-05-07
- verdict: ✅ Passed (81/81 static pattern checks; TypeScript 0 errors both repos; Vite build 27.71s)
- tooling: Node.js static pattern verification (T-2026-027-test.js at D:/Avigo-SaaS-Backend-API-Starter/T-2026-027-test.js), TypeScript, Vite build
- coverage:
  - Section 1: grep zero-match verification in frontend src/ and backend src/ (excl migration)
  - Section 2: 18 frontend file checks (CreateServiceForm, CreateExecutionForm, ExecutionList, FedServiceSlice, FedExecutionSlice, federationAccountLabels)
  - Section 3: 8 backend entity checks (fed-service.entity, fed-execution.entity)
  - Section 4: 10 backend service checks (INSERT params re-indexed, updatableFields, type signatures)
  - Section 5: 5 validator checks
  - Section 6: 4 seed SQL checks
  - Section 7: 7 migration file checks
  - Section 8: 6 test/fixture file checks (structural.test, live-api-test, seed-and-test, test-back-dated-stp)
  - Section 9: 9 regression checks (exported functions/reducers still present)
  - Section 10: 2 TypeScript compilation checks

### T-2026-001 (iteration 1) — 2026-04-25
- verdict: ✅ Passed
- tooling: TypeScript, Vite build, static pattern grep
- coverage: FederationSignInForm.tsx — font-outfit, EyeIcon/EyeCloseIcon, aria-label/aria-pressed, focus-visible, space-y-6, type=submit, Alert overlay

### T-2026-007 (iteration 1) — 2026-04-25
- verdict: ✅ Passed (63/63 static pattern tests + 12/12 import existence checks)
- tooling: Node.js static pattern verification, file existence checks, TypeScript (0 errors pre-verified), Vite build (clean, 2 runs pre-verified)
- coverage:
  - FederationAccountExecutionsPage: Loader, InfoIcon, custom Button, no HelpDialog, no window.confirm, Clear Filters, full-page form, no Paper filter wrapper
  - ExecutionList: DataTable, SweetAlert, Alert, Loader, VisibilityIcon, no window.confirm, gradient header, borderRadius 20px, backdropFilter, view dialog, customTopLeftContent, pagination.totalItems, font-outfit, no raw table tag
  - CreateExecutionForm: InputField, custom Button, Alert, no Drawer, gradient header, height 60, max-w-5xl, SectionHeader, if-not-open-return-null, secondary cancel, isUnbilled box, font-outfit
  - AllocationEditor: no DialogTitle/Actions, custom Button, Alert, Loader, gradient header, borderRadius 20px, backdropFilter, Loader on submitting, Save Allocations, footer borderTop, isLocked warning, empty state, Balanced text, Intl.NumberFormat, % of Total column
  - All 12 imported files verified to exist on disk

### T-2026-009 (iteration 1) — 2026-04-27
- verdict: ✅ Passed (78/78 static pattern checks)
- tooling: TypeScript (0 errors both repos, pre-verified), Vite build (success 1m 25s, pre-verified), Node.js static pattern verification (78 assertions in test-t2026-009.cjs)
- coverage:
  - ENTITY: all 9 new columns verified (countryId/stateId/cityId varchar(24), pincode varchar(6), contactPersonName varchar(150), registrationDoc text, countryName/stateName/cityName varchar(100)); no varchar(36); all nullable
  - VALIDATOR: all required fields on create (countryId/stateId/cityId/pincode/contactPersonName); 6-digit pincode regex; registrationDoc optional; update validator all optional
  - SERVICE: registrationDocUrl 4th param; all 9 fields persisted; S3 URL priority in update; body string fallback; null safety
  - CONTROLLER: MulterS3.File type cast; .location extraction; registrationDocUrl passed to service for create and update
  - ROUTES: federation-docs S3 folder; .single("registrationDoc"); multer error wrapper; multer on POST /create and PUT /:id/update
  - SLICE: all 6 new fields in Federation interface; FederationPayload interface; buildFederationFormData; FormData with multipart header; instanceof File check for upload vs string URL
  - FORM: all 5 import thunks from SocietyManagementSlice; state.society selector; 3 cascading selects (country→state→city); pincode/contactPersonName/registrationDoc inputs; all 5 validation messages; View Document link in view mode; Current document link in edit mode; Choose file button; 5MB limit; no window.confirm
  - DETAIL: all 5 new fields displayed; registrationDoc View Document link
  - MGMT: 3 new columns (contactPersonName/cityName/pincode); no window.confirm
  - Regression check: 15 existing federation thunks/reducers present in slice; 20 existing action/handler patterns in FederationManagement

### T-2026-014 (iteration 1) — 2026-04-27
- verdict: ✅ Passed (76/77 static pattern checks; 1 false-negative: "Record Payment" in a comment line only)
- tooling: TypeScript (0 errors both repos), Vite build (success 26.53s), Node.js static pattern verification
- coverage:
  - BACKEND SERVICE: listFedInvoicesForSocietyService/getFedInvoiceForSocietyService exist; SENT/PARTIALLY_PAID/PAID/OVERDUE visible; DRAFT/POSTED/CANCELLED absent; status=ANY() constraint; societyId in WHERE; NOT_FOUND on 404; items key (not lineItems); societies JOIN; getById fn
  - BACKEND CONTROLLER: societyId from req.user.societyId; 403 when missing; list/getById controllers; no body.societyId injection
  - BACKEND VALIDATOR: isIn for status; idParamValidator/listValidator; DRAFT/POSTED/CANCELLED excluded from isIn
  - BACKEND ROUTE: authenticateAdmin; GET list; GET /:id; no POST/PUT/DELETE mutations
  - BACKEND INDEX.ROUTES: fedInvoicesRoutes imported and mounted at /federation-invoices
  - SLICE: fetchSocietyFedInvoices/fetchSocietyFedInvoiceById thunks; correct URL (account/federation-invoices); SOCIETY_VISIBLE_STATUSES; state shape; FedAccountsInvoice re-export
  - LIST COMPONENT: DataTable; Invoice No/Date/Due Date columns; statusChipColor; VisibilityIcon only action; SOCIETY_VISIBLE_STATUSES filter; font-outfit; statCards; no Create/Post/Send/Cancel/DRAFT/POSTED/CANCELLED
  - DETAIL DIALOG: gradient header (linear-gradient #255593); borderRadius 20px; backdropFilter; Line Items; Subtotal totals; font-outfit; CloseIcon; no Post Invoice/Record Payment/Ledger Entries/postFed/sendFed/cancelFed
  - PAGE: FederationInvoicesList/FederationInvoiceDetailDialog rendered; Bills from Federation title; Loader; no Create Invoice
  - STORE: societyFedInvoicesReducer imported and registered
  - APP.TSX: lazy import; route exists; society_admin only
  - SIDEBAR: federationInvoicesItem; Bills from Federation; /admin/federation-invoices; positioned in society_admin branch (after society_admin if-block, before society_user if-block)
  - TypeScript: 0 errors both repos
  - Vite build: success 26.53s

### T-2026-015 (iteration 1) — 2026-04-27
- verdict: ✅ Passed (69/69 static pattern checks)
- tooling: TypeScript (0 errors both repos, pre-verified), Vite build (success exit 0, pre-verified), Node.js static pattern verification (69 assertions in tests/test-t2026-015.cjs)
- coverage:
  - ENTITY (9 checks): table name, composite unique index, UUID PK, uuid/int column types, nextNumber default 1, CreateDateColumn, UpdateDateColumn, no GL accounts/ import
  - SERVICE Fix 1 (8 checks): EntityManager import, qrManager:EntityManager param, INSERT ON CONFLICT DO NOTHING, FOR UPDATE, RETURNING nextNumber-1, FED-{year}-{4-pad} format, Array.isArray defensive, no old COUNT(*)+1
  - SERVICE Fix 2 (17 checks): 3x createQueryRunner, 3x connect, 3x startTransaction, 3x commitTransaction, 3x rollbackTransaction, 3x release, qr.manager.query used, setImmediate post-commit (recurring), setImmediate post-commit (send), no AppDataSource.query in generateRecurring/generateManual/send, generateInvoiceNo inside qr transaction for both recurring+manual
  - SLICE Fix 3 (9 checks): readyPagination in state+initialState, fetchReadyInvoiceCount thunk, action key, status=generated param, page:1 limit:1, fulfilled handler, rejected handler, manualQueuePagination in state
  - PAGE Fix 3 (12 checks): import fetchReadyInvoiceCount, selector reads readyPagination+manualQueuePagination, dispatch on mount, readyCount from readyPagination.totalItems, manualQueueCount from manualQueuePagination.totalItems, no old filter/length patterns, {readyCount} in Alert, {manualQueueCount} in badge, handleRecurringDone/handleManualDone both dispatch fetchReadyInvoiceCount
  - REGRESSION (8 checks): preview/list/getById/getSociety/getMember services unchanged, no fed_accounts_ cross-contamination, all 8 original slice thunks present
  - ACCEPTANCE CRITERIA (6 checks): FOR UPDATE for AC1, 3x rollback for AC2, year in ON CONFLICT for AC3, FED-{year}-{4-pad} for AC3, pagination.totalItems for AC4+AC5, no GL contamination for AC6

### T-2026-018 (iteration 1) — 2026-04-27
- verdict: ✅ Passed (51/51 static pattern checks)
- tooling: TypeScript (0 errors both repos), Vite build (success 1m 35s), Node.js static pattern verification (51 assertions)
- coverage:
  - ENTITY (5 checks): LineItemType enum exported; defaultExpenseAccountId column; itemType varchar(10); itemType default INCOME; defaultAccountId kept (no rename)
  - SERVICE (10 checks): validateExpenseAccount function; validateItemTypeAccountCombo; EXPENSE required message; BOTH requires at least one; INCOME no expense; acc_e LEFT JOIN; defaultExpenseAccountName in select; INSERT includes itemType; update sets defaultExpenseAccountId; combo re-validation on update
  - VALIDATOR (3 checks): itemType isIn(['INCOME','EXPENSE','BOTH']) on create; defaultExpenseAccountId field on create/update; itemType on update
  - SEED (7 checks): 6 EXPENSE items; 12 INCOME items; Vendor items names; Office Rent name; expenseAccountName field; Phase 3 EXPENSE type query; rollback
  - SLICE (4 checks): LineItemType type exported; itemType in LineItem; defaultExpenseAccountId; fetchFedLineItems exported
  - MASTER FORM (11 checks): RadioGroup import; Item Type section; INCOME/EXPENSE/BOTH radio values; income cond; expense cond; Default Income/Expense Account labels; expenseAccounts filter; all accounts fetch (no type filter)
  - INVOICE FORM (3 checks): invoiceTemplates variable; INCOME|BOTH filter; options uses invoiceTemplates
  - EXPENSE FORM (10 checks): fetchFedLineItems import; expenseTemplates; EXPENSE|BOTH filter; Template label; template section header; setAmount; computedGst; notes when empty; defaultExpenseAccountId resolve; dispatch fetchFedLineItems

### T-2026-019 (iteration 1) — 2026-05-06
- verdict: ✅ Passed (102/102 static pattern checks)
- tooling: Node.js static verification (tests/test-t2026-019.cjs), TypeScript (0 errors pre-verified twice), Vite build (success 3m 17s pre-verified)
- coverage:
  - Section 1 (7 checks): old account/ folder and all 6 subfolders confirmed absent (ENOENT)
  - Section 2 (14 checks): all 14 files at new locations (billing/4 + executions/3 + common/1 + services/2 + vendors/2 + billing-reports/2)
  - Section 3 (35 checks): all 35 pre-existing accounts/ files untouched
  - Section 4 (13 checks): all 6 page files import from new accounts/ paths; billing page (5 imports updated), executions page (2), reports page (2), services page (2), vendor master page (1), dashboard page (1)
  - Section 5 (7 checks): zero old federation/account/ import refs in all 6 updated pages
  - Section 6 (6 checks): billing/InvoiceList and billing/InvoiceDetailDialog confirmed using FedBillingSlice; billing/InvoiceDetailDialog vs invoices/InvoiceDetailDialog confirmed different files; billing-reports files confirmed using FedReportsSlice not GL accounts slice
  - Section 7 (6 checks): all API URL strings in FedBillingSlice/FedExecutionSlice/FedServiceSlice/FedVendorSlice/FedAllocationSlice/FedReportsSlice confirmed intact (note: AllocationSlice uses template literals so test pattern was \`federation/account/executions\` not \`'federation/account/executions\`)
  - Section 8 (8 checks): internal relative imports correct (ExecutionList→AllocationEditor, ExecutionList→DataTable, AllocationEditor→store, billing/InvoiceList→store+utils, common/HelpDialog exported, services/CreateServiceForm→store, vendors/CreateVendorForm→store)
  - Section 9 (5 checks): App.tsx URL routes for account/ and accounts/ confirmed intact
  - Section 10 (1 check): total 49 files in accounts/ (35 pre-existing + 14 new)

### T-2026-020 (iteration 1) — 2026-05-06
- verdict: ✅ Passed (36/36 static pattern checks)
- tooling: Node.js static verification (tests/test-t2026-020.cjs), TypeScript (0 errors included in tests)
- coverage:
  - Section 1 (6 checks): Slice file exists; admin_type optional in supportticket interface; userType/status preserved; addSupportTicket thunk appends admin_type; default avigo_admin preserved
  - Section 2 (17 checks): Management component exists; local SupportTicket interface has admin_type; Chip imported; accessorKey/header correct; Chip label logic; purple/blue colors; export headers include 'Routed To'; Sr. No present; export row maps admin_type; Routed To after Submitted By before Status; Routed To column after Status before Actions; Status column preserved; ticketId/Submitted By/Ticket Date columns preserved
  - Section 3 (4 checks): getAllSupportTicketsForSociety exists; society_admin in $in; NO admin_type filter (federation inclusive)
  - Section 4 (3 checks): getAllSupportTicketsForFederation exists; admin_type=federation_admin filter intact; userType=society_admin intact
  - Section 5 (3 checks): getAllSupportTicketsForSuperAdmin exists; $or[avigo_admin/not-exists] intact
  - Section 6 (1 check): TypeScript 0 errors
- note: Test 2i initially found commented-out code at line 469 causing false indexOf; fixed with lastIndexOf pattern

### T-2026-021 (iteration 1) — 2026-05-06
- verdict: ✅ Passed (101/102 checks; 1 false negative)
- tooling: Node.js static verification (inline scripts), TypeScript (0 errors pre-verified), Vite build (success 26.08s pre-verified)
- coverage:
  - Section 1 (6 checks): old account/ folder and all subfolders confirmed absent (ENOENT)
  - Section 2 (25 checks): all 25 billing-operational files in correct locations (6 controllers, 8 entities, 6 services, 2 validators, 1 routes, 2 seeds)
  - Section 3 (17 checks): import depth correct — 5-level paths for core/, utils/, shared/ in services/controllers/routes; no 4-level-only old paths
  - Section 4 (17 checks): internal cross-references correct — entities import sibling entities; services import sibling entities; controllers import sibling services; routes import sibling controllers+validators
  - Section 5 (5 checks): federation.ts routing integrity — imports billing-operational, NOT old account/; /account and /accounts HTTP mounts preserved
  - Section 6 (2 checks): zero cross-contamination between billing-operational and GL accounts
  - Section 7 (8 checks): all frontend API URL strings preserved intact (FedBillingSlice, FedVendorSlice, FedExecutionSlice, FedServiceSlice, FedAllocationSlice, FedReportsSlice, FedAccountsChartSlice, FedAccountsFYSlice)
  - Section 8 (19 checks): business logic preserved — race-safe invoice numbering, QueryRunner transactions, PAN/IFSC normalization, duplicate name check, getFederationId auth pattern, validators with enum usage
  - Section 9 (3 checks): TSC 0 errors backend; TSC 0 errors frontend; Vite build success
  - Note: test 8.14 false negative — checked for uppercase 'LOCKED' but ExecutionStatus enum correctly uses lowercase string; service uses enum constant (ExecutionStatus.LOCKED) not bare string — business logic confirmed preserved

### T-2026-024 (iteration 1) — 2026-05-06
- verdict: ✅ Passed (95/95 static pattern checks)
- tooling: Node.js static verification (tests/test-t2026-024.cjs), TypeScript (0 errors both repos), Vite build (success 1m 5s)
- coverage:
  - Section 1 (10 checks): entity file, table name, Unique, 2 Indexes, serviceId/societyId/federationId columns, createdAt, no updatedAt
  - Section 2 (9 checks): migration file exists, CREATE TABLE IF NOT EXISTS, serviceId NOT NULL, ON DELETE CASCADE, UQ constraint, 2 CREATE INDEX IF NOT EXISTS, synchronize note
  - Section 3 (22 checks): getSubscribedSocietyIds exported, validateSocietyIds, duplicate error, not-member error, federation_society_mappings, societyIds param, QueryRunner create/startTransaction/commit/rollback/release, INSERT fed_service_societies, ON CONFLICT DO NOTHING, LEFT JOIN in list, array_agg, fss.federationId filter, getFedServiceById aggregate, undefined check in update, DELETE in update, replaceSocieties logic, update returns getSubscribedSocietyIds, soft delete
  - Section 4 (8 checks): resolveTargetSocieties exists, fed_service_societies query, serviceId+federationId both in query, fallback to getMemberSocieties, serviceId param in autoGenerateAllocations, calls resolveTargetSocieties, serviceId passed from createFedExecutionService, backward-compat comment
  - Section 5 (4 checks): societyIds in create+update validators (x2), societyIds.* uuid in both (x2), isArray, isUUID
  - Section 6 (6 checks): subscribedSocietyIds in FedService, societyIds in payload, billingMode preserved, allocationMethod preserved, fetchFedServices preserved, createFedService preserved
  - Section 7 (20 checks): Radio/RadioGroup/FormControlLabel/Chip imports, fetchMemberSocieties from FedBillingSlice, MemberSociety type, societyScope state, selectedSocietyIds, dispatch on open, fedBilling state, RadioGroup, All/Specific labels, Autocomplete multiple, societyName, subscribedSocietyIds prefill, scopeError, societyIds in payload, renderTags, empty array for all
  - Section 8 (10 checks): fetchMemberSocieties import, fedBilling state, useEffect dispatch, Societies header, subscribedSocietyIds access, Specific(k), All(N), societyTooltip, memberSocieties.find, TableHead column
  - Section 9 (6 checks): federationId in INSERT, federationId in DELETE, both params in resolveTargetSocieties, fallback confirmed, resolveTargetSocieties called, no hard FK on entity
- note: fed-billing.service.ts correctly unchanged — generators read fed_allocations which are now correctly filtered at allocation creation time via resolveTargetSocieties

### T-2026-002 (iteration 1) — 2026-04-25
- verdict: ✅ Passed (49/49 tests)
- tooling: TypeScript (0 errors), Vite build (clean), Node.js static verification (49 assertions), ESLint (pre-existing errors confirmed not introduced by our changes)
- coverage:
  - Emoji removal verified (CreateServiceForm, ExecutionList)
  - FYList error box fix verified (no hardcoded colors, Typography color=error)
  - 4 corruption bug fixes verified (AllocationEditor, CreateExecutionForm, ProfitLossReport x2)
  - font-outfit present in 25 checked files explicitly
  - Auth form improvements verified (EyeIcon, aria-label, type=submit)
  - TypeScript: 0 errors pre-verified
  - Vite: clean build pre-verified

### T-2026-035 (iteration 1) — 2026-05-09
- verdict: ✅ Passed (99/99 static pattern checks; TypeScript 0 errors both repos; Vite build 24.76s)
- tooling: Node.js static pattern verification (T-2026-035-test.cjs at D:/Avigo-SaaS-Admin-Web-Starter/T-2026-035-test.cjs), TypeScript, Vite build
- coverage:
  - §1 Backend entity (8 checks): InvoiceType ADHOC, FedInvoiceItem nullable executionId/allocationId + description/hsn/taxRate columns
  - §2 Backend service (14 checks): generateAdhocInvoiceService, AdhocLineItem, QueryRunner lifecycle, setImmediate(logActivity), LEFT JOINs in getInvoiceByIdService, input guards
  - §3 Backend controller (6 checks): generateAdhocInvoiceController, imports, 201 status, error handler
  - §4 Backend validator (8 checks): adhocInvoiceValidator, lineItems/description/amount/societyIds/taxRate validation
  - §5 Backend routes (5 checks): imports, route defined, ordering before /:id, validateRequest
  - §6 SQL migration (8 checks): enum extension, nullable columns, new columns, idempotent guards, rollback file exists
  - §7 Frontend slice (9 checks): InvoiceType adhoc, AdhocLineItem, generateAdhocInvoice thunk, action name, URL, pending/fulfilled/rejected reducers
  - §8 AdhocInvoiceBuilder (16 checks): props, fetchMemberSocieties, multi-select, add/delete rows, field rendering, disabled logic, dispatch, onDone, error, loading
  - §9 Page changes (18 checks): icon, import, state, handlers, card content, dialog, help text, regression checks
  - §10 InvoiceList+labels (4 checks): typeColor warning for adhoc, friendly label
  - §11 No regressions (4 checks): ManualInvoiceBuilder/RecurringInvoiceGenerator unchanged, existing INSERT literals intact

### T-2026-040 (iteration 1) — 2026-05-09
- verdict: ✅ Passed (16/16 static pattern checks; TypeScript 0 errors; Vite build 40.08s)
- tooling: Node.js inline static pattern verification, TypeScript (npx tsc --noEmit), Vite build (npx vite build)
- coverage:
  - Check 1: useEffect([serviceId]) exists in file
  - Check 2: setActualCost from selectedService.defaultSocietyBilled
  - Check 3: setVendorCost from selectedService.defaultVendorCost (unchanged)
  - Check 4: defaultSocietyBilled fallback || 0
  - Check 5: defaultVendorCost fallback || 0 (unchanged)
  - Check 6: else block resets vendorCost to '0'
  - Check 7: else block resets actualCost to '0'
  - Check 8: if (editData) return; guard in service-seed useEffect
  - Check 9: Society Billed field uses actualCost value
  - Check 10: actualCostVal for Society income in profit summary
  - Check 11: profitVal computed from actualCostVal - vendorCostVal
  - Check 12: "Use previous month" link present (no regression)
  - Check 13: vendorCost initialized as string '0'
  - Check 14: actualCost useState string variable
  - Check 15: editData block seeds actualCost from editData.actualCost (edit mode hydration)
  - Check 16: no societyBilled state variable introduced (uses existing actualCost)
- critique gate audit: all 8 ACs met; "user types then changes service" edge case consistent with vendorCost (re-seeds on change); no gaps

### T-2026-043 (iteration 1) — 2026-05-09
- verdict: ✅ Passed (33/33 functional checks + 9/10 regression checks; 1 false negative; TypeScript 0 errors; Vite 52.98s)
- tooling: Node.js static pattern verification (inline), TypeScript (npx tsc --noEmit), Vite build (npx vite build)
- coverage:
  - §1 FedAccountsPaymentSlice (19 checks): FedAccount type import; bankCashAccounts+bankCashAccountsLoading in state+initialState; fetchFedBankCashAccounts exported; URL+params (type=ASSET,isActive=true,limit=200); subType filter (null|BANK|CASH via toUpperCase); 3 extraReducers cases (pending/fulfilled/rejected); resetFedAccountsPayment uses () => initialState (auto-resets new fields)
  - §2 CreatePaymentForm (14 checks): no fetchFedAccounts import/usage; no FedAccountsChartSlice import; no state.fedAccountsChart read; fetchFedBankCashAccounts imported+dispatched on open; bankCashAccounts+bankCashAccountsLoading from state.fedAccountsPayment; Autocomplete options=bankCashAccounts; loading=bankCashAccountsLoading; noOptionsText actionable; loadingText; CircularProgress in endAdornment; no bankAccounts variable; getOptionLabel uses opt.code+opt.name
  - §3 Regression checks (9/10 — 1 false negative): InvoiceList/InvoiceDetailDialog/InvoicesPage/PayFedDialog/ChartSlice/PaymentsPage all correctly unchanged; FederationAccountingPaymentsPage uses fetchFedAccountsPayments (pre-existing, correct) which contains 'fetchFedAccounts' as substring — pattern check mismatch, not a defect
  - TypeScript: 0 errors frontend
  - Vite build: ✓ built in 52.98s

### T-2026-045 (iteration 1) — 2026-05-09
- verdict: ✅ Passed (41/41 static pattern checks; TypeScript 0 errors; Vite build 23.34s)
- tooling: Node.js inline static pattern verification, TypeScript (npx tsc --noEmit), Vite build (npx vite build)
- coverage:
  - §1 Page imports (2 checks): useMemo imported alongside useEffect+useState
  - §2 filteredAccounts useMemo (6 checks): const filteredAccounts=useMemo; new Set(); e.accountId !== editEntry?.accountId; .map(e=>e.accountId); !usedAccountIds.has(a.id); dependencies [entries,editEntry,accounts]
  - §3 ObEntryForm prop (2 checks): accounts={filteredAccounts} passed; accounts={accounts} NOT passed
  - §4 Edit-mode exception (1 check): editEntry?.accountId optional chaining
  - §5 ObEntryForm untouched (3 checks): no usedAccountIds; no filteredAccounts; accounts: FedAccount[] prop type unchanged
  - §6 Raw accounts still fetched (2 checks): state.fedAccountsChart read; fetchFedAccounts dispatched
  - §7 No look/feel change in ObEntryForm (2 checks): Chip label={option.subType}; getOptionLabel unchanged
  - §8 Regression — page handlers (7 checks): handleFormSubmit; handleDeleteConfirm; handleLock; handleSeedDefaultsConfirm; ObEntryList; ObStatusBanner; Seed Default Opening Balance button
  - §9 Regression T-2026-043/044 (4 checks): bankCashAccounts; fetchFedBankCashAccounts; paymentInvoiceId; invoiceId prop
  - §10 Regression T-2026-038 (2 checks): fetchSocietyFedInvoices; myPayments
  - §11 Regression T-2026-035 (1 check): AdhocInvoiceBuilder exists
  - §12 Regression T-2026-041 (2 checks): defaultVendorCost; defaultSocietyBilled
  - §13 Ob components (2 checks): ObEntryList exists; ObStatusBanner exists
  - §14 FedAccountsOBSlice (5 checks): upsertObEntry; updateObEntry; deleteObEntry; lockOb; seedDefaultOpeningBalances
  - TypeScript: 0 errors (npx tsc --noEmit returned no output)
  - Vite build: ✓ built in 23.34s

### T-2026-046 (iteration 1) — 2026-05-09
- verdict: ✅ Passed (50/50 static pattern checks; TypeScript 0 errors both repos; Vite build 23.81s)
- tooling: Bash grep/wc inline static pattern verification, TypeScript (npx tsc --noEmit), Vite build (npx vite build)
- coverage:
  - §1 Backend advance service (5 checks): getAvailableAdvanceService exported; COALESCE(SUM presence; status=ACTIVE filter; Math.round normalization; function signature
  - §2 Backend payment service (10 checks): advanceApplied param; amount===0 && advanceApplied<=0 guard; ADV- prefix for advance-only; FIFO ORDER BY advanceDate ASC; FOR UPDATE lock; ADVANCE_APPLICATION GL ref type; advance_applications INSERT; currentPaid+amount+advanceApplied; amount>0 bank validation gate; FULLY_APPLIED status transition
  - §3 Backend society-pay service (10 checks): advanceApplied field; FIFO ORDER BY advanceDate ASC; FOR UPDATE lock; amount+advanceApplied in newPaid; advance_applications INSERT (×2 — one per advRow); ADVANCE_APPLICATION GL ref type; getAvailableAdvanceForSocietyService; COALESCE(SUM; societyId security check; 5-step structure intact (13 step comments)
  - §4 Backend validators (5 checks): amount min=0 in both validators; advanceApplied optional float>=0; cross-field "At least one of amount or advanceApplied" in both; advanceApplied requires invoiceId in fed-accounts validator
  - §5 Backend controllers and routes (10 checks): getSocietyId from JWT; getAvailableAdvanceForSocietyService imported+used; getSocietyAvailableAdvanceController exported; /advances/available before /advances/:id (line 288 < 291); /available-advance before /:id (line 44 < 71); auth via router.use at line 226
  - §6 Frontend slices (5 checks): fetchSocietyAvailableAdvance×5; fetchFedAvailableAdvance×4; AvailableAdvance type in both slices; advanceApplied in PayFederationInvoicePayload; advanceApplied in CreatePaymentPayload
  - §7 Frontend components (10 checks): Advance Balance Available in both dialogs; Apply Advance input in both dialogs; cashAmountNum>0||advanceAppliedNum>0 in canSubmit both dialogs; advanceApplied:advanceAppliedNum in handleSubmit both dialogs; outstanding-advanceAppliedNum auto-adjust in PayFederationInvoiceDialog; state.fedAccountsPayment still used in CreatePaymentForm
  - §8 Regression checks (5 checks): T-2026-038 5-step intact (13 step comments); T-2026-043 fetchFedBankCashAccounts×4 intact; T-2026-044 invoiceId plumbing×10 intact; T-2026-045 filteredAccounts×2 intact; T-2026-043 state.fedAccountsPayment selector in CreatePaymentForm×1 intact
  - TypeScript: 0 errors both repos (npx tsc --noEmit returned 0 lines)
  - Vite build: ✓ built in 23.81s

### T-2026-038 (iteration 1) — 2026-05-09
- verdict: ✅ Passed (90/90 functional checks; TypeScript 0 errors both repos; Vite build 23.30s)
- tooling: Node.js static pattern verification (inline), TypeScript (npx tsc --noEmit), Vite build (npx vite build)
- coverage:
  - §1 Backend route ordering (7 checks): /bank-cash-accounts at line 34; /my-payments at line 43; both before /:id at line 61; listSocietyFedPaymentsController+Validator imported; validateRequest wired
  - §2 Backend validator (6 checks): listSocietyFedPaymentsValidator exported; fromDate/toDate isISO8601; status isIn POSTED|REVERSED; page/limit isInt bounds
  - §3 Backend controller (6 checks): listSocietyFedPaymentsController exported; getSocietyId(req) JWT-only; listSocietyFedPaymentsService imported; fromDate/toDate/status/page/limit from query; ApiResponseBuilder.success; handleError catch
  - §4 Backend service (13 checks): listSocietyFedPaymentsService+SocietyFedPaymentsFilter+SocietyFedPaymentRow exported; societyId=\$1+isDeleted=false WHERE; STRING_AGG invoiceNo; GROUP BY p.id; ORDER BY paymentDate DESC; COUNT(*) for pagination; parameterized LIMIT/OFFSET; split from STRING_AGG agg; LEFT JOIN payment_applications and invoices
  - §5 Frontend slice (15 checks): SocietyFedPayment/SocietyPaymentStatus/SocietyFedPaymentsParams exported; all 4 state fields (myPayments/myPaymentsPagination/myPaymentsLoading/myPaymentsError) in interface+initialState; fetchSocietyFedPayments thunk with correct URL; pending/fulfilled/rejected extraReducers; payFederationInvoice dispatches fetchSocietyFedPayments; invoiceNos field present
  - §6 FederationPaymentHistoryList (23 checks, 2 false negatives confirmed): component exists; fetchSocietyFedPayments imported; SocietyFedPayment type imported; useSelector reads societyFedInvoices; myPayments destructured; DataTable rendered; 4 stat card entries in statCards array (verified via grep: label/gradient/icon/value fields); 8 columns all present; POSTED/REVERSED MenuItems present (verified via grep with double quotes); Clear Filters; Loader; Alert; font-outfit; useEffect dispatches; pagination; formatCurrency for Total Paid
  - §7 FederationInvoicesManagement (11 checks): Tabs+Tab imported; TabPanel defined; activeTab useState(0); FederationPaymentHistoryList imported; Invoices+Payment History tab labels; TabPanel index 0+1 present; #255593 indicator; handlePay+handleViewDetail regressions clean
  - §8 Removal checks (9 checks): TreasurerInvoiceRecordPayment.tsx file absent (null read); App.tsx lazy import absent; T-2026-038 comment in App.tsx; route element absent; handleMarkPaid absent from InvoiceList; useNavigate import absent; CheckCircleIcon import absent; navigate path absent; tombstone comment present
  - §9 Store (2 checks): societyFedInvoicesReducer imported; societyFedInvoices key registered
  - TypeScript: 0 errors frontend; 0 errors backend
  - Vite build: ✓ built in 23.30s
