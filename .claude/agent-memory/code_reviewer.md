# Code Reviewer Memory

Private log for the code_reviewer agent. Read on startup, append after every
review.

## Sections
- **Accepted patterns** — patterns you've decided are OK in this project (don't re-raise).
- **Rejected patterns** — patterns you've rejected before (don't approve now).
- **Reviews** — chronological log of task_ids reviewed, with verdict and key issues.

---

## Accepted Patterns

- `className="font-outfit"` on MUI `<Typography>` for Outfit font rendering (T-2026-001, T-2026-002)
- MUI inline `<Alert severity="error|success|info">` inside Dialogs/Drawers — correct pattern for embedded inline feedback
- Project's `Alert` component (src/components/ui/alert/Alert.tsx) used as floating overlay toast — correct for post-action feedback
- Pre-existing hardcoded hex colors (e.g., `#fce4ec`, `#c62828`) in `accounts/*` files — acceptable as pre-existing code not in scope of typography pass
- `<Typography color="error">` for inline validation errors — acceptable pattern matching AdvanceDetailDialog gold standard
- Pre-existing unused imports in FYList.tsx (Loader, SweetAlert, Button, TextField, ToggleSwitch, InfoIcon) — pre-existing, out of scope
- Multi-line `<Typography` elements with `className` on a subsequent attribute line — grep false positives, actual className present

## Rejected Patterns

- Inline SVG eye icons replacing canonical EyeIcon/EyeCloseIcon (rejected in T-2026-001)
- Emoji in Typography within UI cards (📅, ✋, 🏢, ⚖️, ✏️, 💡) — rejected in T-2026-002, removed
- Hardcoded pink error Box (`bgcolor: '#fce4ec', border: '1px solid #f8bbd0'`) as error display pattern — replaced with `<Typography color="error">` in FYList.tsx
- `tabIndex={-1}` on keyboard-accessible interactive buttons (rejected in T-2026-001)

## Reviews

### T-2026-001 (iteration 1) — 2026-04-25
- verdict: ✅ Approved
- files: src/components/federation/auth/FederationSignInForm.tsx
- key checks: font-outfit on h1/p, EyeIcon/EyeCloseIcon, aria-label/aria-pressed, focus-visible ring, space-y-6, type="submit", project Alert overlay

### T-2026-007 (iteration 1) — 2026-04-25
- verdict: ✅ Approved
- files: FederationAccountExecutionsPage.tsx, ExecutionList.tsx, CreateExecutionForm.tsx, AllocationEditor.tsx
- key checks:
  - FederationAccountExecutionsPage: removed MUI Button/Paper/TextField/HelpDialog; added custom Button, Loader, InfoIcon tooltip (matching reference), full-page form when formOpen
  - ExecutionList: DataTable with customTopLeftContent; SweetAlert replaces window.confirm; custom Alert+Loader; view-detail Dialog with gradient header/borderRadius 20px/backdropFilter blur(4px); VisibilityIcon added; error via custom Alert; rowCount from pagination.totalItems
  - CreateExecutionForm: Drawer→full-page max-w-5xl form; gradient header (linear-gradient #255593, height 60, white CloseIcon); SectionHeaders (icon+title matching ExpenseForm); custom Button/InputField; Alert toast; `if (!open) return null` early exit preserves correct open-state behavior
  - AllocationEditor: DialogTitle/Actions removed; gradient header + borderRadius 20px + backdropFilter blur(4px); custom Button/Alert; Loader on submitting; font-outfit on all Typography; inline CircularProgress kept for initial load spinner (correctly replaces Loader in that inner loading state)
  - AllocationEditor error Alert onClose is no-op — acceptable because Alert auto-dismisses via internal timer; the store error persists until cleared, which is unchanged business logic
  - TypeScript: 0 errors; Vite build: success (2 independent runs)
  - No window.confirm, no CircularProgress as page loader, no DialogTitle/Actions in AllocationEditor, no raw MUI Alert as toast, no raw MUI Button in forms
  - No business logic changes confirmed

### T-2026-009 (iteration 1) — 2026-04-27
- verdict: ✅ Approved (with one self-corrected fix: varchar(36)→varchar(24) for countryId/stateId/cityId to match society entity pattern)
- files: federation.entity.ts, federation.validator.ts, federation.service.ts, federation.controller.ts, federation.routes.ts, FederationSlice.tsx, AddEditFederationForm.tsx, FederationDetailPage.tsx, FederationManagement.tsx
- key checks:
  - Entity: 9 new nullable columns; varchar(24) for MongoDB ObjectIds matches society.entity.ts pattern; varchar(6) for pincode correct; text for registrationDoc (URL) correct
  - Validator: createFederationValidator: countryId/stateId/cityId/pincode/contactPersonName required; pincode /^\d{6}$/ matches SocietyOnboarding constraint; registrationDoc optional string; updateFederationValidator: all new fields optional (partial update pattern)
  - Service: registrationDocUrl 4th param pattern; update logic: S3 URL takes priority over body string, body string over keep-existing; all 9 new fields persisted/updated
  - Controller: (req.file as Express.MulterS3.File)?.location pattern matches staff.routes.ts/society.controller.ts pattern
  - Routes: uploadToS3("federation-docs").single("registrationDoc") with error wrapper — matches staff.routes.ts pattern; multer runs before validators (correct, multer parses body for express-validator)
  - FederationSlice: buildFederationFormData handles File vs string vs undefined for registrationDoc; FormData + multipart/form-data matches SocietyManagementSlice registerSociety pattern; new FederationPayload interface; createFederation/updateFederation typed correctly
  - AddEditFederationForm: imports fetchCountriesForDropdown/fetchStatesByCountry/fetchCitiesByState/resetStatesAndCities/resetCities from SocietyManagementSlice; cascading country→state→city (3 useEffect hooks, same as AddEditSocietyDialog.Step1/Step1Edit); file input with Choose file button pattern matches societyImage input; view mode shows text for all new fields; registration doc shows "View Document" link in view mode; existing doc link in edit mode; validation on submit with inline errors; TypeScript 0 errors
  - FederationDetailPage: 12+1(doc) fields in detail card; registrationDoc shows "View Document" href link; all pre-existing tabs/functionality unchanged
  - FederationManagement: 3 new columns (contactPersonName, cityName, pincode) added before existing email column; no existing columns removed; existing filters/export/toggle/delete all unchanged
  - Security: file uploads go through multer's fileFilter (allows images+PDF+Word only, 5MB limit) before reaching controller — correct; no secret leakage; no injection vectors
  - Accepted pattern: varchar(24) for MongoDB ObjectIds in Postgres entity (established by society entity, adopted here)

### T-2026-014 (iteration 1) — 2026-04-27
- verdict: ✅ Approved (with self-corrected sidebar scope issue during review)
- files:
  - BACKEND (new): fed-accounts-invoice-society-view.service.ts, .controller.ts, .validator.ts, society_admin_modules/.../fed-invoices.routes.ts
  - BACKEND (modified): society_admin_modules/.../index.routes.ts
  - FRONTEND (new): SocietyFedInvoicesSlice.ts, FederationInvoicesList.tsx, FederationInvoiceDetailDialog.tsx, FederationInvoicesManagement.tsx
  - FRONTEND (modified): store.tsx, App.tsx, AppSidebar.tsx
- key checks:
  - AC1: societyId from JWT only (req.user.societyId); never from body/URL — confirmed via getSocietyId helper in controller
  - AC2: getById WHERE clause includes societyId match + status ANY(SOCIETY_VISIBLE_STATUSES) → 404 for wrong society and for wrong status — confirmed
  - AC3: service WHERE clause hardcodes SOCIETY_VISIBLE_STATUSES=['SENT','PARTIALLY_PAID','PAID','OVERDUE']; DRAFT/POSTED/CANCELLED excluded — confirmed
  - AC4: no Create/Post/Send/Cancel/Edit/Record Payment buttons in list or detail components — grep confirmed zero hits
  - AC5: sidebar entry in society_admin branch only (lines 1149-1158 in AppSidebar.tsx); NOT in adminNavItems shared array; society_user branch at ~line 1218 does NOT include federationInvoicesItem — confirmed
  - AC6: status filter dropdown only shows SOCIETY_VISIBLE_STATUSES; validator rejects other values; date range + search supported — confirmed
  - AC7: UI parity — same header gradient (#255593), same stat cards, same columns (Invoice No, Date, Due Date, Period, Total, Paid, Outstanding, Status), same statusChipColor mapping, same dialog layout (gradient header, info grid, line items table, totals box), same border radius 20px + backdropFilter blur(4px) — confirmed
  - AC8: backend federation-side routes unchanged; no existing components modified; new files only added — confirmed
  - AC9: TypeScript 0 errors both repos; Vite build green (26.53s) — confirmed
  - AppError.NOT_FOUND → HTTP 404 confirmed via response-config.ts
  - AppError.FORBIDDEN → HTTP 403 confirmed via response-config.ts
  - Relative import paths from fed-invoices.routes.ts → federation controllers/validators verified correct
  - "items" key in society service response matches FedAccountsInvoice TypeScript interface — correct (federation side has pre-existing mismatch using "lineItems" key; society side is more correct)
  - sidebar fix: originally added to adminNavItems (shared) which leaks to society_user; moved to society_admin-specific block

### T-2026-015 (iteration 1) — 2026-04-27
- verdict: ✅ Approved
- files: fed-invoice-sequence.entity.ts (NEW), fed-billing.service.ts (modified), FedBillingSlice.ts (modified), FederationAccountBillingPage.tsx (modified)
- key checks:
  - Entity: fed_invoice_sequences with composite unique(federationId,year) via @Index({unique:true}); UUID PK is valid (spec allows "or composite"); nextNumber int default 1; createdAt/updatedAt via TypeORM decorators; picked up by synchronize:true glob — ✓
  - generateInvoiceNo: takes qrManager:EntityManager; 3-step pattern (INSERT ON CONFLICT DO NOTHING → SELECT FOR UPDATE → UPDATE RETURNING nextNumber-1); format FED-{year}-{4-pad seq}; mirrors fed-accounts-payment.service.ts generateSeq exactly — ✓
  - generateRecurringInvoiceService: createQueryRunner+connect+startTransaction; all queries use qr.manager.query(); generateInvoiceNo(qr.manager,...) called inside transaction; setImmediate(logActivity) outside try/catch; commit/rollback/release in correct order — ✓
  - generateManualInvoiceService: same QueryRunner pattern — ✓
  - sendInvoiceService: QueryRunner wraps validate+societyAmounts+upsert+update; setImmediate(logActivity) outside try/catch; societyAmountsLength captured before commit for log — ✓
  - 3 QueryRunners total confirmed by grep (commitTransaction appears at lines 236, 437, 620) — ✓
  - No cross-contamination with GL accounts/ system — grep confirmed 0 hits — ✓
  - EntityManager imported from typeorm — correct type for qr.manager — ✓
  - Defensive Array.isArray(rows[0]) for UPDATE RETURNING — mirrors payment service pattern — ✓
  - FedBillingSlice: readyPagination field in state+initialState; fetchReadyInvoiceCount thunk (status=generated,page=1,limit=1); fulfilled sets readyPagination; rejected silently ignored — ✓
  - FederationAccountBillingPage: readyCount=readyPagination?.totalItems??0; manualQueueCount=manualQueuePagination?.totalItems??0; both dispatch on mount + after done callbacks; old invoices.filter()+manualQueue.length patterns absent — ✓
  - TypeScript 0 errors both repos; Vite build success (exit code 0) — ✓
  - No regressions to GL accounts/ system or society admin views — ✓

### T-2026-018 (iteration 1) — 2026-04-27
- verdict: ✅ Approved
- files:
  - BACKEND: fed-accounts-line-item.entity.ts, fed-accounts-line-item.service.ts, fed-accounts-line-item.validator.ts, fed-accounts-line-items-seed.service.ts
  - FRONTEND: FedAccountsLineItemsSlice.ts, FederationLineItemsMaster.tsx, CreateInvoiceForm.tsx, RecordExpenseForm.tsx
- key checks:
  - Entity: LineItemType enum exported; defaultExpenseAccountId UUID nullable; itemType varchar10 default INCOME; defaultAccountId kept as-is (no rename = zero data loss on synchronize:true ALTER) — ✓
  - Service: validateIncomeAccount + validateExpenseAccount mirrors correctly (both check type, isDeleted; omitting isActive check is consistent with pre-existing income validator from T-2026-016); validateItemTypeAccountCombo correctly enforces INCOME=no expense, EXPENSE=expense required+no income, BOTH=at least one; createLineItemService INSERT includes all 3 new fields; updateLineItemService re-validates combo only when relevant fields changed; list/get now LEFT JOIN acc_e on defaultExpenseAccountId — ✓
  - Validator: itemType isIn(['INCOME','EXPENSE','BOTH']) on create+update; defaultExpenseAccountId optional UUID on both — ✓
  - Seed: Phase 2 now only queries income accounts for INCOME/BOTH items; Phase 3 new expense account lookup with fail-fast; Phase 4 INSERT includes itemType+defaultExpenseAccountId; 18 total (12 INCOME + 6 EXPENSE) — ✓
  - Slice: LineItemType type exported; LineItem interface has itemType + defaultExpenseAccountId + defaultExpenseAccountName/Code; create+update thunk payloads updated — ✓
  - Master form: RadioGroup for itemType; fetchFedAccounts now fetches all (not just INCOME); conditional income/expense Autocomplete based on itemType; table column shows stacked chips; view dialog shows both account fields + itemType — ✓
  - CreateInvoiceForm: invoiceTemplates filter correct (INCOME|BOTH); Autocomplete uses invoiceTemplates; handleTemplateSelect reads template.defaultAccountId (income side, field name unchanged) — ✓
  - RecordExpenseForm: imports fetchFedLineItems; expenseTemplates filter correct (EXPENSE|BOTH, isActive); top-level Template Autocomplete before Expense Details; handleTemplateSelect resolves expense account (only if active EXPENSE in allAccounts), sets amount, computes gst, fills notes when empty — ✓
  - TypeScript: 0 errors backend+frontend — ✓
  - Vite build: success (1m 35s) — ✓
  - No regressions: RecordExpenseForm existing fields unchanged; CreateInvoiceForm existing handleTemplateSelect logic unchanged; master form seed button unchanged
  - For BOTH itemType in form: grid has 3 items (Rate|IncomeAcc, then ExpenseAcc wraps to col 1) — acceptable layout
  - isActive not checked in validateExpenseAccount: consistent with pre-existing validateIncomeAccount from T-2026-016 — acceptable

### T-2026-019 (iteration 1) — 2026-05-06
- verdict: ✅ Approved
- files: 14 files copied to accounts/{billing,executions,common,services,vendors,billing-reports}/; 6 page files updated; account/ deleted
- key checks:
  - All 14 files present in new locations (4+3+1+2+2+2)
  - Old account/ folder confirmed deleted (ls returns ENOENT)
  - Zero remaining components/federation/account/ import references in entire src/
  - All 6 pages (FederationAccountBillingPage, FederationAccountExecutionsPage, FederationAccountReportsPage, FederationAccountServicesPage, FederationVendorMasterPage, FederationAccountDashboardPage) correctly updated to accounts/ paths
  - Relative import depth parity confirmed: account/ and accounts/ are both 4 levels from src/, so ../../../ and ../../../../ paths resolve identically in new locations
  - API URL strings (httpinstance.get('federation/account/...')) in store slices untouched — correct, these are backend API paths not file paths
  - App.tsx URL routes unchanged — navigation preserved
  - Same-named files in different domains (billing/InvoiceList vs invoices/InvoiceList, billing/InvoiceDetailDialog vs invoices/InvoiceDetailDialog) are distinct components — no collision
  - VendorList.tsx confirmed pre-existing orphan (zero import refs) — kept safely
  - TSC 0 errors; Vite build success (3m 17s)
  - Accepted pattern: billing-reports/ as distinguishing name for vendor billing reports vs GL financial reports in reports/

### T-2026-020 (iteration 1) — 2026-05-06
- verdict: ✅ Approved
- files:
  - FRONTEND: SocietySupportTicketManagementSlice.tsx (added admin_type to interface), SocietySupportTicketManagement.tsx (added admin_type to local interface, Routed To column, export header+row)
  - BACKEND: no changes
- key checks:
  - admin_type field optional in both interfaces (backward-compat with legacy tickets) — ✓
  - Chip already imported at line 5 of management component — ✓
  - Chip label: 'federation_admin' → 'Federation Admin'; else → 'Avigo Admin' (handles undefined/null safely) — ✓
  - Export headers 11 fields; export rows 11 values — parity maintained — ✓
  - Backend getAllSupportTicketsForSociety unchanged — already returns all tickets regardless of admin_type — ✓
  - Backend getAllSupportTicketsForFederation: admin_type='federation_admin' filter intact — ✓
  - Backend getAllSupportTicketsForSuperAdmin: $or[admin_type=avigo_admin,not-exists] filter intact — ✓
  - TypeScript: 0 errors — ✓
  - Accepted pattern: inline sx with branded hex colors on Chip (#ede9fe/#6d28d9 purple, #dbeafe/#1d4ed8 blue) — consistent with project style

### T-2026-021 (iteration 1) — 2026-05-06
- verdict: ✅ Approved
- files: 25 files in accounts/billing-operational/ (8 entity, 6 service, 6 controller, 2 validator, 1 routes, 2 seeds); federation.ts (modified)
- key checks:
  - federation.ts: import updated from ../account/routes/ to ../accounts/billing-operational/routes/ — ✓
  - HTTP mounts /account and /accounts preserved unchanged — ✓
  - Import depth: all 5-level paths for core/, utils/, shared/ — ✓
  - Internal cross-references (../entity/, ../services/, ../controllers/, ../validators/) correct as sibling paths — ✓
  - fed-execution.entity imports CostSource from ./fed-service.entity (same entity folder) — ✓
  - old account/ folder confirmed deleted (ENOENT) — ✓
  - No cross-contamination between billing-operational/ and GL accounts/ — ✓
  - TSC 0 errors backend+frontend — ✓
  - Vite build success — ✓

### T-2026-024 (iteration 1) — 2026-05-06
- verdict: ✅ Approved
- files:
  - BACKEND NEW: fed-service-society.entity.ts, migrations/010_fed_service_societies.sql
  - BACKEND MODIFIED: fed-service.service.ts, fed-execution.service.ts, fed-account.validator.ts
  - FRONTEND MODIFIED: FedServiceSlice.ts, CreateServiceForm.tsx, ServiceList.tsx
- key checks:
  - Entity: Unique+Index decorators, camelCase cols, no hard FK decorator (consistent with other fed entities) — ✓
  - Migration: idempotent IF NOT EXISTS, ON DELETE CASCADE, both indexes, correctly quoted camelCase columns — ✓
  - validateSocietyIds: duplicate check O(n) then DB membership check, correct error messages matching spec — ✓
  - createFedServiceService: fail-fast validation before transaction; QueryRunner: connect+startTransaction+commit+rollback+finally+release; bulk INSERT ON CONFLICT DO NOTHING — ✓
  - listFedServicesService: LEFT JOIN fed_service_societies with federationId in join condition; array_agg FILTER for empty array; GROUP BY s.id,v.name correct — ✓
  - getFedServiceByIdService: JOIN with aggregate returns subscribedSocietyIds; federationId isolation via WHERE clause — ✓
  - updateFedServiceService: `data.societyIds !== undefined` check (not truthiness) correctly distinguishes omitted from explicit empty array; DELETE + INSERT in same transaction — ✓
  - deleteFedServiceService: subscription rows preserved on soft delete (documented); ON DELETE CASCADE handles hard delete if ever implemented — ✓
  - resolveTargetSocieties in fed-execution.service.ts: queries with BOTH serviceId AND federationId; fallback to getMemberSocieties when zero rows — ✓
  - autoGenerateAllocations: serviceId param added as last (backward-compat internal call); call site updated — ✓
  - Validator: societyIds optional array + societyIds.* optional UUID both in create+update — ✓
  - FedServiceSlice: subscribedSocietyIds non-optional on FedService (always returned); societyIds optional on payloads — ✓
  - CreateServiceForm: correct imports (Radio/RadioGroup/FormControlLabel/Chip); fetchMemberSocieties dispatched on open; edit prefill from subscribedSocietyIds; scope validation blocks submit; societyIds:[] for all, selectedSocietyIds for specific — ✓
  - ServiceList: fetchMemberSocieties on mount; ?? [] defensive; Tooltip with society names; Specific(k)/All(N) chips — ✓
  - TSC 0 errors backend+frontend; Vite build success — ✓
  - Pre-existing window.confirm in ServiceList not introduced by this change — acceptable

### T-2026-027 (iteration 1) — 2026-05-07
- verdict: ✅ Approved
- files:
  - FRONTEND: CreateServiceForm.tsx, CreateExecutionForm.tsx, ExecutionList.tsx, FedServiceSlice.ts, FedExecutionSlice.ts, federationAccountLabels.ts
  - BACKEND: fed-service.entity.ts, fed-execution.entity.ts, fed-service.service.ts, fed-execution.service.ts, fed-account.validator.ts, fed-account-seed.sql
  - NEW: drop_cost_source.sql
  - TEST FIXTURES: T-2026-006-federation-account-module.structural.test.js, fed-account-live-api-test.js, seed-and-test.js, test-back-dated-stp.js
- key checks:
  - grep src/: zero matches for costSource/CostSource/COST_SOURCE/costSourceOverride in both repos (only exception: drop_cost_source.sql migration which is correct) — ✓
  - TypeScript: 0 errors both repos — ✓
  - Vite build: 27.71s, success — ✓
  - CreateServiceForm: FormLabel correctly removed from import; Select/MenuItem/InputLabel retained (billingCycle dropdown still uses them); setShowAdvanced(false) in edit mode replaces old costSource check; deliveredBy TextField unconditionally rendered in Advanced collapse — ✓
  - CreateExecutionForm: COST_SOURCE_OPTIONS constant removed; costSourceOverride state+hydration+submit removed; FormControl/Select widget removed; InputLabel/Select/MenuItem retained (Service dropdown) — ✓
  - ExecutionList: 'Cost Source' row removed from detail table — ✓
  - FedServiceSlice: CostSource type export removed; costSource field removed from FedService + CreateFedServicePayload — ✓
  - FedExecutionSlice: CostSource import removed; costSourceOverride removed from FedExecution + CreateExecutionPayload — ✓
  - federationAccountLabels.ts: costSource/vendor_invoice/reimbursement/in_house/donated/other removed; no downstream LABELS consumers referenced these keys — ✓
  - Backend entity: CostSource enum removed; costSource column removed; CostSource import removed from fed-execution.entity.ts — ✓
  - Backend service INSERT params: positional params correctly re-indexed (services $1-$8, executions $1-$7) — ✓
  - Backend updateFedServiceService updatableFields: costSource key removed — ✓
  - Validator: CostSource import removed; all 4 body() validators for costSource/costSourceOverride removed; BillingMode/BillingCycle/AllocationMethod validators intact — ✓
  - Seed SQL: services column list updated, values tuples updated (3 rows each had 1 value removed); executions column list updated, NULL,NULL→NULL for each of 3 rows — ✓
  - Migration file: idempotent IF EXISTS guards; DROP COLUMN before DROP TYPE (safe ordering); both enum names match Postgres default naming convention — ✓
  - Test fixture: T-2026-006 line deleted (not negated); live-api-test 3 occurrences removed; seed-and-test 7 occurrences removed; test-back-dated-stp 1 occurrence removed — ✓

### T-2026-028 (iteration 1) — 2026-05-07
- verdict: ✅ Approved
- files:
  - FRONTEND: FedServiceSlice.ts, FedExecutionSlice.ts, federationAccountLabels.ts, ServiceList.tsx, CreateServiceForm.tsx, CreateExecutionForm.tsx
  - BACKEND src: fed-service.entity.ts, fed-service.service.ts, fed-execution.service.ts, fed-reports.service.ts, fed-account.validator.ts, fed-account-seed.sql, drop_cost_source.sql (extended)
  - TEST FIXTURES: T-2026-006-federation-account-module.structural.test.js, fed-account-live-api-test.js, seed-and-test.js, test-back-dated-stp.js
- key checks:
  - grep src/: zero matches for allocationMethod/AllocationMethod/ALLOCATION_CARDS/friendlyAllocationMethod in both repos (migration SQL exception correct) — ✓
  - autoGenerateAllocations: 4-param signature; pure equal-split; remainder to last society; ON CONFLICT DO NOTHING bulk insert — ✓
  - getFlatCounts helper deleted entirely (sole caller was FLAT_COUNT branch) — ✓
  - resolveTargetSocieties retained (still needed for knowing which societies to allocate to) — ✓
  - Call site gating changed from `&& service.allocationMethod` to simply `!== BillingMode.UNBILLED` — ✓
  - SELECT in createFedExecution svcRows: only "billingMode" (allocationMethod removed) — ✓
  - SELECT in getFedExecutionById: s."allocationMethod" removed from projection — ✓
  - SELECT in getExecutionReportService: s."allocationMethod" removed — ✓
  - validateServiceBusinessRules: 2-param (billingMode, billingCycle); unbilled check for allocationMethod removed; RECURRING/MANUAL rules intact — ✓
  - INSERT in createFedServiceService: re-indexed ($1-$7 → 7 params), column list correct — ✓
  - updateFedServiceService: allocationMethod removed from data type, auto-enforcement block, and updatableFields; billingCycle enforcement intact — ✓
  - Validator: AllocationMethod import removed; both body('allocationMethod') chains removed from create+update; BillingMode/BillingCycle validators intact — ✓
  - Entity: AllocationMethod enum block removed; allocationMethod @Column removed; BillingMode+BillingCycle intact — ✓
  - FedServiceSlice: AllocationMethod type export removed; field removed from FedService interface and CreateFedServicePayload — ✓
  - FedExecutionSlice: AllocationMethod removed from import; field removed from FedExecution (allocationMethod was optional so no breaking change) — ✓
  - federationAccountLabels.ts: allocationMethod/equal_split/flat_count/custom_override removed from LABELS; friendlyAllocationMethod function removed; LABELS object still valid (no trailing comma issue) — ✓
  - ServiceList.tsx: Split Method column header and cell removed; friendlyAllocationMethod import removed; member society count in chip still works — ✓
  - CreateServiceForm.tsx: AllocationCard interface + ALLOCATION_CARDS constant removed; allocationMethod in defaultForm removed; allocationMethod in edit hydration removed; billingMode change handler allocationMethod=null line removed; submit payload allocationMethod removed; JSX cards block (Divider + Typography title + Box/Card map) removed; isUnbilled variable removed; Card MUI component RETAINED (BillingMode cards still need it) — ✓
  - CreateExecutionForm.tsx: custom_override conditional ternary replaced with always-read-only Typography; handleAllocationChange function removed; unused `i` param removed from map callback; MuiTextField RETAINED (vendor autocomplete) — ✓
  - Seed SQL: column list and 3 value tuples updated correctly (no "equal_split" in Values anymore) — ✓
  - Migration: DROP COLUMN IF EXISTS + DO $$ block with IF EXISTS guard for enum type — idempotent and correct — ✓
  - Test fixtures: 7 assertions updated/removed in structural test; 2 payload entries cleaned in live-api-test; 4 entries cleaned in seed-and-test; 1 payload + 1 comment cleaned in test-back-dated-stp — ✓
  - TypeScript: 0 errors both repos; Vite build: 28.74s, success — ✓

### T-2026-002 (iteration 1) — 2026-04-25
- verdict: ✅ Approved
- files: 35 federation component files across account/*, accounts/*, auth, companyMaster, notices, societies, staff, staffattendance, supportticket, visitorlog
- key findings:
  - 153 Typography elements updated with className="font-outfit" across 31 files — all verified correct
  - 4 script-introduced corruption bugs fixed (AllocationEditor.tsx, CreateExecutionForm.tsx, ProfitLossReport.tsx x2) — all correct
  - Emojis removed from CreateServiceForm.tsx (BILLING_MODE_CARDS, ALLOCATION_CARDS) and ExecutionList.tsx AlertTitle
  - FYList.tsx hardcoded pink error Box replaced with Typography color="error"
  - TypeScript: 0 errors; Vite build: clean (no new errors)
  - Pre-existing hardcoded hex colors in accounts/* not in scope — acceptable
  - Pre-existing unused imports in FYList.tsx not in scope — acceptable
  - All multiline Typography patterns verified to have font-outfit on subsequent lines

### T-2026-035 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  - BACKEND: fed-invoice.entity.ts (+ADHOC enum), fed-invoice-item.entity.ts (nullable executionId/allocationId, +description/hsn/taxRate), fed-billing.service.ts (+generateAdhocInvoiceService, getInvoiceByIdService LEFT JOINs), fed-billing.controller.ts (+generateAdhocInvoiceController), fed-account.validator.ts (+adhocInvoiceValidator), fed-account.routes.ts (+POST /billing/adhoc/generate), 2 SQL migrations
  - FRONTEND: FedBillingSlice.ts (+InvoiceType adhoc, +AdhocLineItem interface, +generateAdhocInvoice thunk + reducers), AdhocInvoiceBuilder.tsx (NEW), FederationAccountBillingPage.tsx (3rd card), InvoiceList.tsx (warning color for adhoc), federationAccountLabels.ts (adhoc friendly label)
- key checks:
  - AC1: 3rd card "Adhoc / Misc Bill" with ReceiptLongIcon color="warning", correct description, "Create Adhoc Bill →" button in warning outlined style, dialog "Create Adhoc / Misc Bill", handleAdhocDone calls fetchAllInvoices({}) + fetchReadyInvoiceCount() and closes dialog — ✓
  - AC2: AdhocInvoiceBuilder: editable line items table with description+amount+hsn+taxRate columns, Add/Delete row buttons, Autocomplete multi-select societies (mirrors ManualInvoiceBuilder), Notes textarea, submit disabled until ≥1 valid line (amount>0 + non-empty description) + ≥1 society, onDone callback on success, error/loading via store state + clearFedBillingError — ✓
  - AC3: InvoiceType = 'recurring' | 'manual' | 'adhoc'; generateAdhocInvoice thunk POSTs to 'federation/account/billing/adhoc/generate'; submitting/error reducers follow same pattern as generateManualInvoice — ✓
  - AC4: Backend route POST /billing/adhoc/generate before /billing/invoices/:id (no UUID param swallowing); adhocInvoiceValidator validates lineItems array + each description/amount/hsn/taxRate + societyIds array + notes; generateAdhocInvoiceService: QueryRunner transaction wraps invoiceNo generation + invoice INSERT + batch items INSERT; setImmediate(logActivity) outside try/catch; type='adhoc' in INSERT; ADHOC added to InvoiceType enum — ✓
  - AC5: getInvoiceByIdService changed from JOIN to LEFT JOIN on fed_executions/fed_services — correctly preserves detail view for adhoc invoices without breaking existing recurring/manual detail (executionId non-null rows still join correctly); sendInvoice flow uses GROUP BY societyId SUM(amount) from fed_invoice_items — works correctly for adhoc items — ✓
  - AC5 (regressions): all existing card UI (Monthly Bill, As-Needed Bill) unchanged (pixel-identical); handleRecurringDone/handleManualDone unchanged; manualQueueCount disabled logic unchanged — ✓
  - InvoiceList typeColor: warning for adhoc, primary for recurring, secondary for manual — distinct visual with no TypeScript errors — ✓
  - Migration: idempotent DO $$ checks before ALTER TYPE ADD VALUE, ALTER COLUMN DROP NOT NULL, ADD COLUMN; rollback documents PG enum DROP VALUE limitation — ✓
  - Batch INSERT: 7 params per row; 10 societies × 20 line items = 1400 params — well within PG 65535 limit — ✓
  - grandTotal = lineItemTotal × societyIds.length correctly represents the invoice aggregate total (same bill sent to each society) — ✓
  - TypeScript 0 errors both repos; Vite build 24.76s — ✓
  - No existing Monthly Bill or As-Needed Bill functionality changed — ✓

### T-2026-039 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  - BACKEND MODIFIED: fed-accounts-invoice.service.ts (listInvoicesService returns stats{} in addition to data/total/page/limit)
  - BACKEND MODIFIED: fed-accounts-invoice-society-view.service.ts (listFedInvoicesForSocietyService returns stats{})
  - BACKEND NEW: seeds/add_invoice_status_paid_values.sql (idempotent enum migration for PARTIALLY_PAID/PAID/OVERDUE/CANCELLED)
  - FRONTEND MODIFIED: FedAccountsInvoiceSlice.ts (FedInvoiceStats interface exported, stats in state, fetchFedAccountsInvoices thunk parses stats, reducer stores stats)
  - FRONTEND MODIFIED: SocietyFedInvoicesSlice.ts (SocietyFedInvoiceStats interface exported, stats in state, fetchSocietyFedInvoices thunk parses stats, reducer stores stats)
  - FRONTEND MODIFIED: InvoiceList.tsx (federation-side stat cards now read from stats Redux state instead of client-side paginated slice)
  - FRONTEND MODIFIED: FederationInvoicesList.tsx (society-side stat cards now read from stats Redux state)
- key checks:
  - Aggregate SQL: single query with COUNT FILTER + COALESCE SUM (replaces separate count query + avoids client-side slice aggregation); PostgreSQL FILTER clause is standard PG 9.4+ syntax — ✓
  - Federation outstanding formula: CASE WHEN status NOT IN ('CANCELLED','PAID') THEN totalAmount - paidAmount ELSE 0 END — matches prior client-side logic exactly — ✓
  - Society outstanding formula: CASE WHEN status != 'PAID' THEN totalAmount - paidAmount ELSE 0 END — correct because CANCELLED not in SOCIETY_VISIBLE_STATUSES so WHERE clause already excludes them — ✓
  - stats field in Redux state initialised to defaultStats (zero values) — safe even when backend is older version (stat field optional in thunk return) — ✓
  - FedInvoiceStats and SocietyFedInvoiceStats both exported — available to components needing the type — ✓
  - paidCount label in both components: `Paid(+N Partial)` when partiallyPaidCount>0 — makes partial payments visible to admin — ✓
  - Migration SQL: DO $$ idempotent guards before each ADD VALUE; covers PARTIALLY_PAID, PAID, OVERDUE, CANCELLED; paidAt column belt-and-suspenders guard — ✓
  - TypeScript: 0 errors both repos — ✓
  - Vite build: 46.91s, success — ✓
  - No regression to T-2026-038 society-side payment flow — ✓

### T-2026-040 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  - FRONTEND MODIFIED: D:/Avigo-SaaS-Admin-Web-Starter/src/components/federation/accounts/executions/CreateExecutionForm.tsx (useEffect seeding actualCost from defaultSocietyBilled)
- key checks:
  - useEffect([serviceId]) correctly seeds actualCost from selectedService.defaultSocietyBilled in create mode only — ✓
  - editData guard (if editData return) prevents overwriting edit-loaded values — same as existing vendorCost guard — ✓
  - Fallback: `defaultSocietyBilled || 0` → String → '0' when null/undefined/0 — consistent with vendorCost pattern — ✓
  - actualCost state variable maps to "Society Billed (₹)" input; profit line reads actualCostVal which derives from actualCost — summary auto-updates — ✓
  - vendorCost seeding unchanged: `String(selectedService.defaultVendorCost || 0)` — no regression — ✓
  - "Use previous month" quick-link at lines 296-310 is unrelated to cost-seeding useEffect — no regression — ✓
  - FedService.defaultSocietyBilled typed as number; String(number) is valid TypeScript — 0 errors expected — ✓
  - Single-file change; no slice/backend/other-component changes — ✓

### T-2026-038 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  - BACKEND MODIFIED: fed-accounts-invoice-society-pay.service.ts (listSocietyFedPaymentsService, SocietyFedPaymentsFilter, SocietyFedPaymentRow)
  - BACKEND MODIFIED: fed-accounts-invoice-society-view.controller.ts (listSocietyFedPaymentsController)
  - BACKEND MODIFIED: fed-accounts-invoice-society-view.validator.ts (listSocietyFedPaymentsValidator)
  - BACKEND MODIFIED: fed-invoices.routes.ts (GET /my-payments before /:id)
  - FRONTEND NEW: FederationPaymentHistoryList.tsx
  - FRONTEND MODIFIED: SocietyFedInvoicesSlice.ts (SocietyFedPayment types + fetchSocietyFedPayments thunk + myPayments/myPaymentsPagination/myPaymentsLoading/myPaymentsError state)
  - FRONTEND MODIFIED: FederationInvoicesManagement.tsx (Tabs + TabPanel layout)
  - FRONTEND MODIFIED: InvoiceList.tsx (handleMarkPaid removed, CheckCircleIcon removed, useNavigate removed)
  - FRONTEND DELETED: TreasurerInvoiceRecordPayment.tsx
  - FRONTEND MODIFIED: App.tsx (lazy import commented, route commented)
- key checks:
  - Route ordering: /bank-cash-accounts at line 33, /my-payments at line 42, / at line 51, /:id at line 61 — static routes before param routes, no UUID swallowing — ✓
  - Auth: getSocietyId(req) reads req.user.societyId from JWT; controller never reads societyId from body/URL; service WHERE p."societyId" = $1 uses JWT value — ✓
  - SQL: all query params passed as parameterized $N placeholders; no string interpolation of user input — ✓
  - STRING_AGG: COALESCE(STRING_AGG(i."invoiceNo", ', ' ORDER BY i."invoiceNo"), '') + GROUP BY p.id — correct; handles no-application case with empty string coalesced to [] — ✓
  - Validator: listSocietyFedPaymentsValidator uses query() validators; status isIn(['POSTED','REVERSED']); fromDate/toDate isISO8601(); page/limit isInt; correct chains — ✓
  - Controller: extracts fromDate/toDate/status/page/limit from req.query; passes to service; wraps in try/catch with handleError — ✓
  - SocietyFedPayment interface matches SocietyFedPaymentRow backend shape (id/receiptNo/paymentDate/amount/unappliedAmount/paymentMode/referenceNo/notes/status/source/createdAt/invoiceNos) — ✓
  - fetchSocietyFedPayments thunk: hits 'account/federation-invoices/my-payments'; extracts body.data.data + pagination shape; extraReducers pending/fulfilled/rejected handle myPaymentsLoading/myPayments/myPaymentsError — ✓
  - payFederationInvoice thunk: dispatches fetchSocietyFedPayments({}) after success (alongside existing fetchSocietyFedInvoices({})) so both invoice list and payment history tab refresh — ✓
  - FederationPaymentHistoryList: uses DataTable with customTopLeftContent filters (status Select, fromDate/toDate TextField, Clear Filters button); 4 stat cards (Total Payments from pagination, Posted, Reversed, Total Paid); 8 columns with font-outfit Typography; Tooltip on long invoiceNos; Chip for status; Loader on myPaymentsLoading; Alert on myPaymentsError — ✓
  - FederationInvoicesManagement: Tabs + TabPanel (index 0 = FederationInvoicesList, index 1 = FederationPaymentHistoryList); TabPanel hides content when value !== index; tab indicator #255593; no regression to handlePay/handleViewDetail/handlePayFromDetail/toast — ✓
  - TreasurerInvoiceRecordPayment.tsx deleted: file absent (Glob returns no results) — ✓
  - App.tsx: lazy import line replaced with comment (T-2026-038); route replaced with comment — ✓
  - InvoiceList.tsx: handleMarkPaid absent (comment at line 172); CheckCircleIcon import absent; useNavigate import absent; Record Payment IconButton absent (comment at line 318) — ✓
  - store.tsx: societyFedInvoicesReducer imported and wired as societyFedInvoices key — ✓
  - TypeScript: 0 errors both repos — ✓
  - Vite build: 58s, success — ✓
  - Pre-existing unused import CustomValidator in validator file: pre-existing, not introduced by T-2026-038 — acceptable

### T-2026-044 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  - BACKEND MODIFIED: fed-accounts-payment.service.ts (invoiceId optional in createPaymentService; FOR UPDATE lock; societyId/status/outstanding validation; INSERT payment_application; UPDATE invoice paidAmount/status/paidAt; unappliedAmount=0 when invoiceId; also fixes pre-existing '$6,$6' duplicate-param bug → now '$6,$7' with explicit unappliedAmount variable)
  - BACKEND MODIFIED: fed-accounts-payment.validator.ts (invoiceId optional UUID added to createPaymentValidator; paymentMode enum extended with DD, OTHER)
  - FRONTEND MODIFIED: FedAccountsPaymentSlice.ts (invoiceId?: string | null added to CreatePaymentPayload)
  - FRONTEND MODIFIED: CreatePaymentForm.tsx (invoiceId/invoiceNo optional props; passes invoiceId in payload; submitting guard added; "Applying to invoice: <invoiceNo>" info banner)
  - FRONTEND MODIFIED: FederationAccountingInvoicesPage.tsx (paymentInvoiceId/paymentInvoiceNo state; handleRecordPayment sets both; passes as props to CreatePaymentForm; reset on close; success message updated)
- key checks:
  - FOR UPDATE locks invoice row before generating receipt sequence — fail-fast before consuming sequence slot on bad request — ✓
  - societyId mismatch between payment and invoice → 400 with clear message — ✓
  - validStatuses includes POSTED|SENT|PARTIALLY_PAID (matches existing applyPaymentService contract) — ✓
  - amount > outstanding + 0.01 → 400 with clear message (not silent cap) — ✓
  - unappliedAmount = invoiceId ? 0 : amount — conditional correctly toggles standalone vs applied payment — ✓
  - INSERT params: $1-$13 mapped correctly; no duplicate param bug (original $6,$6 fixed to $6,$7) — ✓
  - payment_application INSERT: correct fields (id, paymentId, invoiceId, appliedAmount, appliedAt, appliedBy, isReversed=false) — ✓
  - invoice UPDATE: PAID sets paidAt=now(); PARTIALLY_PAID does not — ✓
  - threshold: newPaid >= totalAmount - 0.01 (consistent with applyPaymentService) — ✓
  - audit log includes autoAppliedToInvoice and updated narration — ✓
  - rollbackTransaction + release in finally — ✓
  - paymentMode DD + OTHER added to validator (frontend was sending these values; validator was rejecting them silently) — ✓
  - invoiceId prop optional in Props interface; backward compat for PaymentsPage which doesn't pass it — ✓
  - submitting guard `if (!canSubmit || submitting) return` prevents double-click — ✓
  - invoiceId info banner only shown when both invoiceId AND invoiceNo are truthy — ✓
  - handleRecordPayment in page correctly captures invoice.id and invoice.invoiceNo — ✓
  - handlePaymentCreated resets all 4 state vars; dispatches fetchFedAccountsInvoices to refresh invoice list — ✓
  - onClose handler on CreatePaymentForm also resets paymentInvoiceId/paymentInvoiceNo — ✓
  - T-2026-038 payFederationInvoiceService unregressed (different file) — ✓
  - T-2026-043 bankCashAccounts isolation unregressed (CreatePaymentForm still uses fedAccountsPayment.bankCashAccounts) — ✓
  - TSC 0 errors both repos; Vite build 24.88s — ✓
- Accepted pattern: invoiceId optional in CreatePaymentPayload (extends existing nullable pattern)

### T-2026-045 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  - FRONTEND MODIFIED: FederationAccountingOBPage.tsx (added useMemo import, added filteredAccounts computation, changed accounts={accounts}→accounts={filteredAccounts} on ObEntryForm)
- key checks:
  - useMemo import: added alongside useEffect, useState on line 1 — ✓
  - filteredAccounts useMemo: Set built from entries excluding editEntry?.accountId; filter excludes used ids from accounts array — ✓
  - Edit-mode exception: `e.accountId !== editEntry?.accountId` correctly excludes the currently-edited entry's account from the used set — ✓
  - Add-mode: editEntry is null → optional chaining returns undefined → !== undefined is always true → nothing excluded from used set → all existing entry accounts excluded — ✓
  - Edge case empty entries: usedAccountIds=empty Set; all accounts remain available — ✓
  - Edge case all used: filteredAccounts=[] → Autocomplete shows "No options" — correct — ✓
  - Dependencies: [entries, editEntry, accounts] — all three inputs; correct reactivity — ✓
  - ObEntryForm.tsx: untouched — no look/feel changes — ✓
  - Backend: IDX_fed_ob_unique_entry partial unique index + ON CONFLICT upsert already provide server-side safety net — no migration needed — ✓
  - TypeScript: 0 errors — ✓
  - Vite build: 23.34s, success — ✓
  - No regressions to T-2026-038 through T-2026-044 — all confirmed untouched — ✓
  - Single-file change; no slice/component/backend changes — ✓

### T-2026-043 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  - FRONTEND MODIFIED: FedAccountsPaymentSlice.ts (new fetchFedBankCashAccounts thunk + bankCashAccounts/bankCashAccountsLoading state)
  - FRONTEND MODIFIED: CreatePaymentForm.tsx (switched from fedAccountsChart shared state to payment slice isolated state)
- key checks:
  - FedAccountsPaymentSlice: `import type { FedAccount }` correct (type-only import, no circular dep risk); bankCashAccounts/bankCashAccountsLoading in state+initialState; resetFedAccountsPayment uses `() => initialState` so new fields auto-reset; fetchFedBankCashAccounts hits correct URL with correct params; response parsing matches FedAccountsChartSlice pattern exactly; subType filter case-insensitive (toUpperCase); 3 extraReducers cases correct (pending→loading, fulfilled→loading=false+accounts, rejected→loading=false silently); fetchFedBankCashAccounts exported — ✓
  - CreatePaymentForm: no remaining import/usage of fetchFedAccounts or fedAccountsChart (only in comment); bankCashAccounts+bankCashAccountsLoading read from state.fedAccountsPayment (correct slice); dispatch(fetchFedBankCashAccounts()) in useEffect([open]); Autocomplete options=bankCashAccounts; loading=bankCashAccountsLoading; noOptionsText actionable; loadingText provided; CircularProgress in endAdornment (pre-existing import at line 12); getOptionLabel uses opt.code+opt.name (FedAccount fields); value lookup uses opt.id (FedAccount.id); onChange uses val?.id (FedAccount.id) — ✓
  - TypeScript: 0 errors — ✓
  - Vite build: 52.98s, success — ✓
  - No regression to FederationAccountingPaymentsPage (uses same CreatePaymentForm, fix is additive) — ✓
  - No regression to society-side PayFederationInvoiceDialog (different component, different slice) — ✓

### T-2026-047 (iteration 1) — 2026-05-11
- verdict: ✅ Approved
- files:
  - BACKEND MODIFIED: fed-accounts-invoice-society-pay.service.ts (2 changes: expanded idempotency + FOR UPDATE re-read at Step 1)
  - BACKEND NEW: seeds/repair_invoice_paid_amount.sql (data-repair migration)
- key checks:
  - Idempotency expansion: if(amount > 0) → payment_applications branch (unchanged); else → advance_applications with 60-second dedup window + source='treasurer_pay' + amount=0 filter — correctly covers advance-only path — ✓
  - Advance-only JOIN correctness: JOIN on aa."appliedBy" = p."paidByUserId" is a loose link (no FK from advance_applications to payments); combined with aa."invoiceId"=$1 + p."paidByUserId"=$2 + p.amount=0 + 60-second window, this is narrow enough for dedup purposes without requiring schema change — ✓ (acceptable, documented)
  - FOR UPDATE re-read: inside try block after transaction start, before Step 1 UPDATE; uses `qr.manager.query` (inside transaction — correct); uses fresh `lockedCurrentPaid` / `lockedTotalAmount` for ALL computations (newPaid, newStatus, outstanding check) — ✓
  - Status re-validation post-lock: `if (!['SENT', 'PARTIALLY_PAID'].includes(lockedInvRows[0].status))` — handles the case where invoice was paid by a concurrent request — ✓
  - Zero data fabrication in migration: rows with paidAmount=0 but no payment_applications + no advance_applications are SKIPPED with NOTICE log, not silently zeroed — ✓
  - Reverse repair (Step 4): paidAmount>0 but status=SENT/POSTED also fixed using GREATEST(computed_paid, existing paidAmount) — ✓
  - Migration idempotency: DO $$ block iterates ONLY rows matching filter; can be re-run safely — ✓
  - Variables `currentPaid`, `totalAmount`, `outstanding` from pre-transaction reads (lines 130-132) are now UNUSED in Step 1 (replaced by lockedCurrentPaid/lockedTotalAmount/lockedOutstanding) — this is safe; the pre-read values are still used for early validation before the transaction (overpayment guard at lines 134-146) — ✓
  - TSC 0 errors — ✓
  - Vite build 39.95s — ✓
  - No frontend changes (correctly identified as data/backend-only fix) — ✓
  - Regressions T-2026-038 through T-2026-046: no other files modified — ✓
  - ONE minor observation: the `currentPaid`/`totalAmount`/`outstanding` variables (pre-transaction reads) are still used for the early validation guards (lines 134-146) — this is intentional; pre-flight check uses pre-read values (acceptable for early fail-fast), locked values are used for actual UPDATE (correct). No issue.

### T-2026-048 (iteration 1) — 2026-05-11
- verdict: ✅ Approved
- files:
  - BACKEND MODIFIED: fed-accounts-advance.service.ts (listAdvancesService + getAdvanceByIdService — added (a.amount - a."appliedAmount") AS "remainingAmount" to both SELECT queries)
  - BACKEND NEW: seeds/add_advance_status_fully_applied.sql (idempotent enum migration for FULLY_APPLIED)
  - BACKEND NEW: seeds/repair_advance_applied_amount.sql (idempotent data repair migration)
  - FRONTEND: no changes (AdvanceList.tsx already correctly reads remainingAmount)
- key checks:
  - AC1: listAdvancesService SELECT includes (a.amount - a."appliedAmount") AS "remainingAmount" — alias matches FedAccountsAdvance.remainingAmount slice field — ✓
  - AC2: getAdvanceByIdService SELECT includes same computed alias — spread into return object — ✓
  - AC3: No type conflict — a.* provides raw amount+appliedAmount; computed alias is new, no collision — ✓
  - AC4: Both payment services (createPaymentService lines 429-439, payFederationInvoiceService lines 519-529) UNCHANGED — FIFO advance UPDATE code confirmed correct — ✓
  - AC5: add_advance_status_fully_applied.sql follows exact same DO $$ pattern as add_invoice_status_paid_values.sql; type name fed_accounts_advances_status_enum correct per TypeORM convention; idempotency guard present; ROLLBACK documented — ✓
  - AC6: repair_advance_applied_amount.sql — CANCELLED rows excluded from FOR loop (status <> 'CANCELLED'); computed_applied from advance_applications WHERE isReversed=false (no fabrication); FULLY_APPLIED when computed_applied >= amount - 0.005 AND > 0.001 (matches payment service thresholds); only updates rows where value changed; NUMERIC(14,2) matches entity; RAISE NOTICE per row; ROLLBACK documented; must run after add_advance_status_fully_applied.sql (documented in both files) — ✓
  - AC7: getAvailableAdvanceService queries status='ACTIVE' only — FULLY_APPLIED advances correctly excluded from available balance — ✓
  - AC8: frontend stat cards: activeAmount uses a.amount (gross), remainingAmount uses a.remainingAmount??0 for ACTIVE rows — both correct after backend returns remainingAmount — ✓
  - TSC 0 errors both repos; Vite build 49.19s, clean — ✓
  - No regressions to T-2026-038 through T-2026-047 — ✓

### T-2026-046 (iteration 1) — 2026-05-09
- verdict: ✅ Approved
- files:
  BACKEND (9 files modified):
  - fed-accounts-advance.service.ts (new getAvailableAdvanceService function)
  - fed-accounts-advance.controller.ts (new getAvailableAdvanceController)
  - fed-accounts.routes.ts (new /advances/available route before /:id)
  - fed-accounts-payment.service.ts (advanceApplied field + FIFO deduction in atomic txn)
  - fed-accounts-payment.validator.ts (amount min=0, advanceApplied optional float>=0, cross-field validators)
  - fed-accounts-invoice-society-pay.service.ts (advanceApplied field, step 3b advance deduction, getAvailableAdvanceForSocietyService)
  - fed-accounts-invoice-society-view.controller.ts (advanceApplied forwarded, getSocietyAvailableAdvanceController)
  - fed-accounts-invoice-society-view.validator.ts (amount min=0, advanceApplied optional, cross-field)
  - society_admin_modules/.../fed-invoices.routes.ts (new /available-advance route before /:id)
  FRONTEND (4 files modified):
  - FedAccountsPaymentSlice.ts (AvailableAdvance type, advanceApplied in payload, fetchFedAvailableAdvance thunk, state fields)
  - SocietyFedInvoicesSlice.ts (AvailableAdvance type, advanceApplied in payload, fetchSocietyAvailableAdvance thunk, state fields)
  - CreatePaymentForm.tsx (advance section UI, canSubmit updated, handleSubmit passes advanceApplied)
  - PayFederationInvoiceDialog.tsx (advance section UI, canSubmit updated, handleSubmit passes advanceApplied, validate updated)
- key checks:
  AC1: advance available endpoint (GET /advances/available?societyId) exists, auth applied via router.use — ✓
  AC2: society-side endpoint (GET /available-advance?invoiceId) derives federationId from invoice, validates invoice belongs to society — ✓
  AC3: route ordering — /advances/available before /advances/:id (line 288 < 291); /available-advance before /:id in fed-invoices.routes.ts (line 44 < 69) — ✓
  AC4: FIFO deduction — ORDER BY advanceDate ASC, createdAt ASC; FOR UPDATE lock inside transaction — ✓
  AC5: amount=0 allowed when advanceApplied>0 (advance-only payment) — confirmed in both services — ✓
  AC6: advance-only payment uses ADV- prefix instead of RCP- sequence (prevents consuming sequence slot) — ✓
  AC7: newPaid = currentPaid + amount + advanceApplied — correct in both services — ✓
  AC8: GL journal DR advance-from-society / CR receivable-from-society for each advance consumed — ✓
  AC9: advance appliedAmount updated, status transitions ACTIVE→FULLY_APPLIED when fully consumed — ✓
  AC10: fed_accounts_advance_applications row inserted for each advance consumed — ✓
  AC11: canSubmit updated in both dialogs: cashAmountNum > 0 || advanceAppliedNum > 0 — ✓
  AC12: validate() updated in PayFederationInvoiceDialog: combined amount + advance range checks — ✓
  AC13: TSC 0 errors both repos — ✓; Vite build 25.14s — ✓
  Regression T-2026-038 through T-2026-045: all prior services/controllers/validators untouched — ✓
  ONE low-severity cosmetic issue: duplicate comment block lines 333-336 in fed-accounts-invoice-society-pay.service.ts ("Step 3 — INSERT..." appears twice); second occurrence (lines 337-338) is the correct updated one; first is stale — does not affect runtime behavior; noting for cleanup
  Security: societyId always from JWT; federationId derived from invoice (not from request); no injection vectors; amount/advance bounds validated server-side — ✓
