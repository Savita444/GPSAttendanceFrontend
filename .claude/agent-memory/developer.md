# Developer Memory

Private log for the developer agent. Read on startup, append after every
implementation iteration.

## Sections
- **Conventions** — coding conventions established in this project.
- **Implementations** — chronological log of task_ids you've worked on.
- **Open assumptions** — assumptions you made that should be confirmed later.

---

## Conventions

- Font: `font-outfit` Tailwind class used on headings and body text throughout
- Brand color: `#255593` — used via `variant="customBlue"` on Button, and inline `color: '#255593'` in MUI components
- Alert component (src/components/ui/alert/Alert.tsx) manages its own fixed top-center positioning with MUI Slide — never wrap it in additional positioning divs
- Password eye icons: use `EyeIcon` / `EyeCloseIcon` from `src/icons/index.ts` with `className="fill-gray-500 dark:fill-gray-400 size-5"`
- Login form password field name: `signin_password` (not `password`) to avoid strong-password validation in InputField
- Form spacing: `space-y-6` between fields (not `space-y-5`)
- InputField built-in sanitization handles `name="mobile"` (digits, starts 6-9, max 10); no need for duplicate sanitization in onChange

## Implementations

- 2026-04-25T00:00:00Z T-2026-001: Improved FederationSignInForm.tsx UI/UX
  - Removed outer absolute-positioning div wrapper around Alert (Alert handles its own positioning)
  - Replaced custom SVG eye icons with EyeIcon/EyeCloseIcon from ../../../icons
  - Added aria-label, aria-pressed, tabIndex=0 to password toggle button
  - Added focus-visible ring to password toggle for keyboard accessibility
  - Changed password input name from "password" to "signin_password"
  - Added font-outfit class to h1 heading and description paragraph
  - Changed space-y-5 to space-y-6
  - Made type="submit" explicit on Button

- 2026-04-25T12:30:00Z T-2026-007 iteration 1: Federation executions UI/UX parity with treasurer expenses
  - FederationAccountExecutionsPage.tsx: replaced MUI Button/Paper/TextField filters with custom Button, Loader, InfoIcon tooltip, filter bar via ExecutionList filterContent prop; removed HelpDialog; form now shown as full-page (like ExpenseForm) when formOpen=true
  - ExecutionList.tsx: replaced raw HTML Table with DataTable/MRT wrapper; replaced window.confirm with SweetAlert; replaced CircularProgress with Loader; added view-detail Dialog (gradient header, borderRadius 20px, backdropFilter blur(4px)); added VisibilityIcon; replaced MUI Alert with custom Alert; filter content passed via props; rowCount from pagination.totalItems
  - CreateExecutionForm.tsx: replaced Drawer with full-page form (max-w-5xl, gradient header, px-6 py-4, SectionHeaders, custom Button/InputField); Alert toast instead of store error only; returns null when !open
  - AllocationEditor.tsx: removed DialogTitle/DialogActions; added gradient header (linear-gradient #255593, height 60, white CloseIcon); added borderRadius 20px + backdropFilter blur(4px); replaced MUI Button with custom Button; replaced raw MUI Alert with custom Alert component; added Loader; font-outfit on all Typography
  - TypeScript: 0 errors; Vite build: success (5m 8s)

- 2026-04-27T00:30:00Z T-2026-009 iteration 1: Federation 6-field extension (cityId/stateId/countryId/pincode/contactPersonName/registrationDoc)
  - BACKEND:
    - federation.entity.ts: added 9 new @Column fields — countryId(varchar36), countryName(varchar100), stateId(varchar36), stateName(varchar100), cityId(varchar36), cityName(varchar100), pincode(varchar6), contactPersonName(varchar150), registrationDoc(text); all nullable; TypeORM synchronize:true auto-adds columns
    - federation.validator.ts: createFederationValidator: countryId/stateId/cityId/pincode/contactPersonName required; registrationDoc optional body string; updateFederationValidator: all new fields optional; pincode validates /^\d{6}$/
    - federation.service.ts: createFederation+updateFederation accept registrationDocUrl 4th param (from S3 via multer); all 9 new fields persisted; update preserves existing registrationDoc if no new upload
    - federation.controller.ts: createFederationController+updateFederationController extract (req.file as Express.MulterS3.File)?.location and pass to service
    - federation.routes.ts: added uploadToS3("federation-docs").single("registrationDoc") multer middleware on POST /create and PUT /:id/update; wrapped in handleRegistrationDocUpload error handler
  - FRONTEND:
    - FederationSlice.tsx: added 9 new fields to Federation interface; added FederationPayload interface; added buildFederationFormData helper; createFederation and updateFederation now use FormData + multipart/form-data
    - AddEditFederationForm.tsx: imports fetchCountriesForDropdown/fetchStatesByCountry/fetchCitiesByState/resetStatesAndCities/resetCities from SocietyManagementSlice; cascading country→state→city selects (same pattern as AddEditSocietyDialog); pincode (6-digit numeric), contactPersonName, registrationDoc (file input, Choose file button, 5MB PDF/JPG/PNG/Word, link to existing doc in edit mode); view mode renders text/link for all new fields; validation for all required new fields
    - FederationDetailPage.tsx: detail card shows contactPersonName, country/state/city names, pincode, registrationDoc (View Document link)
    - FederationManagement.tsx: list table adds contactPersonName, cityName, pincode columns
  - TypeScript: 0 errors (both repos); Vite build: success (1m 25s)
  - Assumptions: registrationDoc optional on create; on update, if no new file uploaded, existing URL is re-sent as string body field so backend keeps it; country/state/city IDs are MongoDB ObjectIds (strings) from generalmaster collections — stored as varchar(36) on federation entity (same pattern as society entity)

- 2026-04-27T02:30:00Z T-2026-010 iteration 1: Federation GL default chart-of-accounts seed (50 accounts)
  - BACKEND:
    - fed-accounts-chart-seed.service.ts (NEW): 50-account DEFAULT_ACCOUNTS array; seedDefaultChartOfAccountsService uses createQueryRunner+transaction; pass-1 inserts all root accounts (no parentName), builds name→id map merging existing and new; pass-2 inserts children with resolved parentId; skips any name (lower-case) already in fed_accounts_accounts for this federation; writes one audit row (AuditAction.CREATE, entityType=FedAccount) per created account + one summary SEED row; rollsback on any failure; returns { created, skipped, items }
    - fed-accounts-chart.controller.ts: added seedDefaultChartOfAccountsController import + function; getFederationId from JWT (same helper as all other controllers); returns 200 with created/skipped counts in message
    - fed-accounts.routes.ts: added seedDefaultChartOfAccountsController import; router.post('/seed-defaults', ...) registered BEFORE /:id catchall, alongside seed-system
  - FRONTEND:
    - FedAccountsChartSlice.ts: added SeedDefaultChartResult interface; added seedDefaultChart async thunk (POST federation/accounts/seed-defaults); added extraReducers for pending/fulfilled/rejected
    - FederationAccountingChartPage.tsx: imported seedDefaultChart + SeedDefaultChartResult; added showSeedConfirm/seedingInProgress state; added handleSeedDefaultsConfirm handler; added second SweetAlert for seed confirmation; added "Seed Default Chart" secondary Button in header Box wrapper alongside existing "Add Account" button
  - TypeScript: 0 errors (backend + frontend)
  - Vite build: success (45.70s)
  - isSystem=true exactly for 6 entries: Cash on Hand, GST CGST Payable, GST SGST Payable, GST IGST Payable, Federation Capital / Corpus Fund, Retained Earnings

- 2026-04-27T04:30:00Z T-2026-011 iteration 1: Federation GL financial years seed (4 FYs + 48 periods)
  - BACKEND:
    - fed-accounts-fy-seed.service.ts (NEW): DEFAULT_FINANCIAL_YEARS (4 entries); monthlyPeriodsForFY helper (12 months April→March, correct leap-year endDate via new Date(year, month, 0)); seedDefaultFinancialYearsService uses createQueryRunner+transaction; pre-fetches existing FYs (lower-case name set + id/status map); detects existing ACTIVE FY for demotion rule; for each FY: skip if name exists, else insert with demoted status if needed + CREATE audit per FY; for each default FY (new or existing), pre-fetches existing periods by fyId, inserts only missing 12 period rows + CREATE audit per period; final SEED summary audit row; rollback on error; returns { fyCreated, fySkipped, periodsCreated, periodsSkipped, demotedActive, items }
    - fed-accounts-financial-year.controller.ts: added import for seedDefaultFinancialYearsService; added seedDefaultFinancialYearsController at end of file
    - fed-accounts.routes.ts: added seedDefaultFinancialYearsController import; router.post('/financial-years/seed-defaults', ...) registered BEFORE createFYValidator route to prevent /:id capture
  - FRONTEND:
    - FedAccountsFYSlice.ts: added SeedDefaultFinancialYearsResult interface; added seedDefaultFinancialYears thunk (POST federation/accounts/financial-years/seed-defaults); added extraReducers for pending/fulfilled/rejected (submitting flag)
    - FederationAccountingFYPage.tsx: imported seedDefaultFinancialYears + SeedDefaultFinancialYearsResult; added showSeedConfirm/seedingInProgress state; added handleSeedDefaultsConfirm handler (toast with fyCreated/fySkipped/periodsCreated/periodsSkipped + demotedActive note; refreshes FY list); added SweetAlert for seed confirmation before Close FY alert; header button area changed to Box with gap=1, secondary "Seed Default Financial Years" button + existing "Create Financial Year" button
  - TypeScript: 0 errors (backend + frontend)
  - Vite build: success (34.21s)
  - Period status rule: CLOSED FY → CLOSED periods; ACTIVE/DRAFT FY → OPEN periods
  - ACTIVE demotion: if hasExistingActiveFY=true and fyDef.status=ACTIVE → insert as DRAFT, demotedActive=true

- 2026-04-27T05:30:00Z T-2026-012 iteration 1: Federation GL opening balance seed (5 entries)
  - BACKEND:
    - fed-accounts-ob-seed.service.ts (NEW): DEFAULT_OPENING_BALANCES (5 entries: Bank HDFC/Cash on Hand/Office Equipment/Trade Payables/Corpus Fund); seedDefaultOpeningBalancesService uses createQueryRunner+transaction; resolves fyId (input → ACTIVE FY → 400 error); checks LOCKED entries (400 if any); bulk name lookup (lower(name) = ANY(array)); fail-fast if any name missing; pre-fetches existing OB accountIds for skip detection; inserts 5 entries with status=DRAFT, linkedSocietyId=NULL; AuditAction.CREATE per created entry + AuditAction.SEED summary; rollback on error; returns { fyId, fyName, created, skipped, totalDebit, totalCredit, isBalanced, items }
    - fed-accounts-opening-balance.controller.ts: added import for seedDefaultOpeningBalancesService; added seedDefaultOpeningBalancesController at end of file (getFederationId + getPerformedBy + fyId from body optional + 201 response)
    - fed-accounts-opening-balance.validator.ts: added seedDefaultObValidator (body('fyId').optional({ checkFalsy: true }).isUUID())
    - fed-accounts.routes.ts: added seedDefaultOpeningBalancesController + seedDefaultObValidator imports; added router.post('/opening-balance/seed-defaults', ...) BEFORE router.post('/opening-balance', ...) and /:entryId catchalls
  - FRONTEND:
    - FedAccountsOBSlice.ts: added SeedDefaultOpeningBalancesResult interface; added seedDefaultOpeningBalances thunk (POST federation/accounts/opening-balance/seed-defaults with optional fyId body); added 3 extraReducer cases (pending/fulfilled/rejected)
    - FederationAccountingOBPage.tsx: added seedDefaultOpeningBalances + SeedDefaultOpeningBalancesResult imports; added showSeedConfirm/seedingInProgress state; added handleSeedDefaultsConfirm handler (toast with created/skipped/totalDebit/totalCredit/isBalanced/fyName + refreshes entries+status); added SweetAlert for seed confirm; modified header to Box with gap=1 wrapping secondary "Seed Default Opening Balance" button + "Add Entry" button (both only when !isLocked)
  - TypeScript: 0 errors (backend + frontend)
  - Vite build: success (1m 20s)
  - Route order: /seed-defaults comes before /:entryId — no catchall conflict

- 2026-04-27T06:30:00Z T-2026-014 iteration 1: Society admin read-only view of federation invoices
  - BACKEND (new files):
    - fed-accounts-invoice-society-view.service.ts (NEW): listFedInvoicesForSocietyService (filters by societyId from JWT + SOCIETY_VISIBLE_STATUSES array SENT/PARTIALLY_PAID/PAID/OVERDUE; supports status/fromDate/toDate/search filters; paginates; JOINs societies table for societyName); getFedInvoiceForSocietyService (returns 404 if not found or societyId mismatch or wrong status; includes line items with income account name)
    - fed-accounts-invoice-society-view.controller.ts (NEW): getSocietyId helper throws 403 if no societyId in JWT; listSocietyFedInvoicesController; getSocietyFedInvoiceByIdController — both read-only
    - fed-accounts-invoice-society-view.validator.ts (NEW): societyFedInvoiceIdParamValidator (UUID); listSocietyFedInvoicesValidator (status limited to SOCIETY_VISIBLE_STATUSES; fromDate/toDate ISO8601; search string; page/limit int)
    - society_admin_modules/account/routes/fed-invoices.routes.ts (NEW): uses authenticateAdmin from shared/middlewares; GET / → list; GET /:id → getById; all read-only, no mutations
  - BACKEND (modified):
    - society_admin_modules/account/routes/index.routes.ts: added import fedInvoicesRoutes; router.use('/federation-invoices', fedInvoicesRoutes) at end
  - FRONTEND (new files):
    - store/Federation/SocietyFedInvoicesSlice.ts (NEW): re-exports InvoiceStatus/FedAccountsInvoice/FedAccountsInvoiceLineItem from FedAccountsInvoiceSlice; SOCIETY_VISIBLE_STATUSES constant; fetchSocietyFedInvoices thunk (GET account/federation-invoices); fetchSocietyFedInvoiceById thunk; state { invoices, selectedInvoice, pagination, loading, error }; clearSelectedSocietyFedInvoice + clearSocietyFedInvoiceError reducers
    - components/societyadmin/federation-invoices/FederationInvoicesList.tsx (NEW): stat cards (Total/Paid/Overdue/Outstanding); same columns as federation InvoiceList (Invoice No, Date, Due Date, Period, Total, Paid, Outstanding, Status, Actions); NO admin action buttons; status filter only shows SOCIETY_VISIBLE_STATUSES; date range filter; search via DataTable clickHandler; same statusChipColor mapping; pagination
    - components/societyadmin/federation-invoices/FederationInvoiceDetailDialog.tsx (NEW): same gradient header + borderRadius20px + backdropFilter; info grid; line items table + totals summary; NO Post/Send/Cancel/Record Payment buttons; shows "Paid in full" or "Overdue" message boxes; Close button only
    - pages/societyadmin/FederationInvoicesManagement.tsx (NEW): page wrapper matching siblings; title "Bills from Federation"; renders FederationInvoicesList + FederationInvoiceDetailDialog
  - FRONTEND (modified):
    - store/store.tsx: added societyFedInvoicesReducer import + societyFedInvoices: societyFedInvoicesReducer in store
    - App.tsx: added lazy import FederationInvoicesManagement; added route path="federation-invoices" allowedRoles=["society_admin"]
    - layout/AppSidebar.tsx: added "Bills from Federation" entry (ReceiptIcon, path=/admin/federation-invoices, key=federation-invoices) in adminNavItems after "Society Ledger Management Module"
  - TypeScript: 0 errors (both repos)
  - Vite build: success (27.84s)
  - Key decisions:
    - Sidebar entry in adminNavItems (not inside a child menu) — nearest financial siblings (Society Ledger) are at top level
    - API base path: account/federation-invoices (matches society admin account module prefix /account mounted in mainRoutes)
    - societyId always from JWT, never from request body/URL
    - 404 returned for wrong societyId or filtered-out statuses — no cross-society leakage
    - "items" field in response (not "lineItems") to match FedAccountsInvoice type shape from federation side

- 2026-04-27T08:30:00Z T-2026-015 iteration 1: Legacy federation billing — 3 defect fixes
  - BACKEND:
    - fed-invoice-sequence.entity.ts (NEW): Table fed_invoice_sequences; composite unique(federationId, year); id UUID PK; nextNumber int default 1; createdAt/updatedAt timestamps; TypeORM synchronize:true auto-creates table
    - fed-billing.service.ts: replaced COUNT-based generateInvoiceNo with race-safe version taking qrManager:EntityManager param; uses INSERT ON CONFLICT DO NOTHING → SELECT FOR UPDATE → UPDATE RETURNING nextNumber-1; format FED-{year}-{NNNN 4-pad}; wrapped generateRecurringInvoiceService in QueryRunner (connect/startTransaction/commit/rollback/release); all DB queries use qr.manager.query(); setImmediate(logActivity) moved outside try/catch to run after commit; same pattern for generateManualInvoiceService; sendInvoiceService also wrapped in QueryRunner transaction; 3 QueryRunners total
  - FRONTEND:
    - FedBillingSlice.ts: added readyPagination:PaginationInfo|null to state+initialState; added fetchReadyInvoiceCount thunk (GET invoices?status=generated&page=1&limit=1 → returns pagination only); added extraReducer cases for fulfilled (sets readyPagination) and rejected (silent)
    - FederationAccountBillingPage.tsx: removed invoices from selector (no longer needed for counts); added readyPagination+manualQueuePagination from selector; dispatches fetchReadyInvoiceCount() on mount + after recurring/manual done; readyCount=readyPagination?.totalItems??0; manualQueueCount=manualQueuePagination?.totalItems??0; both counts reflect ALL pages not just page 1; split handleRecurringDone/handleManualDone callbacks to refresh both counts
  - TypeScript: 0 errors (backend + frontend)
  - Vite build: success (7m 25s, exit code 0)
  - Assumptions: EntityManager.query() for UPDATE RETURNING returns rows array directly (not [rows, rowCount]) based on TypeORM pg driver behavior; handled both forms defensively via Array.isArray(rows[0]) check (mirrors fed-accounts-payment.service.ts pattern)

- 2026-04-27T14:30:00Z T-2026-018 iteration 1: Dual-purpose Products/Services master (itemType INCOME/EXPENSE/BOTH + defaultExpenseAccountId)
  - BACKEND:
    - fed-accounts-line-item.entity.ts: added LineItemType enum (INCOME/EXPENSE/BOTH exported); added defaultExpenseAccountId column (UUID nullable); added itemType column (varchar10 default LineItemType.INCOME); kept defaultAccountId as-is (no rename = zero data loss on synchronize:true)
    - fed-accounts-line-item.service.ts: added CreateLineItemInput/UpdateLineItemInput fields for itemType+defaultExpenseAccountId; added validateExpenseAccount helper (mirrors validateIncomeAccount for EXPENSE type); added validateItemTypeAccountCombo function enforcing INCOME=no expense acc, EXPENSE=expense required+no income, BOTH=at least one; listLineItemsService/getLineItemByIdService now LEFT JOIN acc_e on defaultExpenseAccountId, return defaultExpenseAccountName+defaultExpenseAccountCode; createLineItemService INSERT includes itemType+defaultExpenseAccountId; updateLineItemService handles all 3 new fields with proper combo re-validation
    - fed-accounts-line-item.validator.ts: added itemType isIn([INCOME,EXPENSE,BOTH]) on create+update; added defaultExpenseAccountId optional UUID on create+update
    - fed-accounts-line-items-seed.service.ts: LineItemSeedDef now has itemType + optional incomeAccountName/expenseAccountName; DEFAULT_LINE_ITEMS updated to 18 entries (12 INCOME explicit + 6 new EXPENSE); Phase 2 now income-items-only lookup; Phase 3 new expense-accounts lookup with same fail-fast pattern; Phase 4 INSERT includes itemType+defaultExpenseAccountId; expenseAccountName→id map resolves via type='EXPENSE' query
  - FRONTEND:
    - FedAccountsLineItemsSlice.ts: added LineItemType = 'INCOME'|'EXPENSE'|'BOTH'; added defaultExpenseAccountId/defaultExpenseAccountName/defaultExpenseAccountCode/itemType to LineItem interface; updated createFedLineItem + updateFedLineItem payload types
    - FederationLineItemsMaster.tsx: imported RadioGroup+Radio; EMPTY_LINE_ITEM has itemType='INCOME'; validate() checks itemType-account combos; fetchFedAccounts now fetches all accounts (not just INCOME) so expenseAccounts filter works; added "Item Type" RadioGroup section above Basic Details; conditional income/expense Autocomplete based on itemType; table column "Default Account(s)" shows stacked chips for income+expense; view dialog shows itemType + both account fields
    - CreateInvoiceForm.tsx: added invoiceTemplates = fedLineItemTemplates.filter(t=>t.itemType==='INCOME'||t.itemType==='BOTH'); template Autocomplete uses invoiceTemplates; handleTemplateSelect still reads template.defaultAccountId (income side, unchanged field name)
    - RecordExpenseForm.tsx: imports fetchFedLineItems+allLineItems; expenseTemplates = allLineItems.filter(t=>itemType==='EXPENSE'||'BOTH'&&isActive); top-level Template Autocomplete before Expense Details section; handleTemplateSelect autofills expenseAccountId (only if active EXPENSE account found), amount, gstAmount (rate*pct/100 if gstApplicable), notes (only when empty)
  - TypeScript: 0 errors backend + frontend
  - Vite build: success (1m 35s)
  - Key decisions:
    - defaultAccountId TS field kept as-is (no rename) — minimises call-site changes; UI labels it "Default Income Account"
    - itemType default 'INCOME' on DB column → synchronize:true ALTER gives existing rows INCOME without a migration
    - fetchFedAccounts in master now fetches isActive=true (all types) instead of type=INCOME-only, so expenseAccounts filter works
    - RecordExpenseForm notes: only autofilled when empty, so user can type notes first then pick template without losing them

- 2026-05-06T10:30:00Z T-2026-020 iteration 1: Society admin support ticket list — add admin_type field + "Routed To" column
  - ROOT CAUSE: Backend getAllSupportTicketsForSociety (service line 1147-1157) has NO admin_type filter, so federation tickets already return. The user couldn't see federation tickets because there was no UI column to distinguish them — they looked identical to avigo_admin tickets.
  - FRONTEND:
    - SocietySupportTicketManagementSlice.tsx: added admin_type?: 'avigo_admin'|'federation_admin' to supportticket interface (line 57 area)
    - SocietySupportTicketManagement.tsx: added admin_type?: field to local SupportTicket interface; added "Routed To" Chip column (purple for federation_admin, blue for avigo_admin) after "Status" column; updated export headers (+Routed To) and buildSocTicketExportRows (added admin_type→label field)
  - BACKEND: No changes required — getAllSupportTicketsForSociety already returns all tickets regardless of admin_type; federation panel uses admin_type='federation_admin' filter exclusively; super admin panel uses $or[admin_type=avigo_admin, admin_type not exists] filter
  - TypeScript: 0 errors (frontend only changed)
  - Files: 2 frontend files modified
  - Key decisions:
    - No backend change needed — query already includes federation tickets
    - Chip colors: blue (#dbeafe/#1d4ed8) for Avigo Admin, purple (#ede9fe/#6d28d9) for Federation Admin
    - Default rendering: tickets with admin_type=undefined/avigo_admin → "Avigo Admin"; admin_type=federation_admin → "Federation Admin"

- 2026-05-07T08:00:00Z T-2026-028 iteration 1: Remove allocationMethod; hard-code equal-split
  - FRONTEND (6 files):
    - FedServiceSlice.ts: removed AllocationMethod type export; removed allocationMethod from FedService interface and CreateFedServicePayload
    - FedExecutionSlice.ts: removed AllocationMethod from import; removed allocationMethod from FedExecution interface
    - federationAccountLabels.ts: removed allocationMethod from LABELS, removed equal_split/flat_count/custom_override labels, removed friendlyAllocationMethod function
    - ServiceList.tsx: removed friendlyAllocationMethod import; removed "Split Method" column header and cell
    - CreateServiceForm.tsx: removed AllocationMethod import; removed AllocationCard interface and ALLOCATION_CARDS constant; removed allocationMethod from defaultForm(), edit hydration, billingMode change handler, submit payload, and JSX cards block; removed isUnbilled variable (no longer needed)
    - CreateExecutionForm.tsx: replaced custom_override conditional ternary with always-read-only Typography; removed unused handleAllocationChange function; removed unused i param from allocations.map
  - BACKEND (6 src files + 4 fixtures + 1 migration):
    - fed-service.entity.ts: removed AllocationMethod enum; removed allocationMethod @Column and field declaration
    - fed-service.service.ts: removed AllocationMethod import; removed allocationMethod param from validateServiceBusinessRules; removed allocationMethod from create DTO, defaults, INSERT, updateFedServiceService data type, auto-enforcement block, and updatableFields
    - fed-execution.service.ts: removed AllocationMethod import; removed getFlatCounts helper; replaced autoGenerateAllocations with equal-split-only implementation (no allocationMethod param); removed allocationMethod from SELECT (svcRows query); changed gating from `&& service.allocationMethod` to simply `!== BillingMode.UNBILLED`; removed allocationMethod from getById SELECT
    - fed-reports.service.ts: removed s."allocationMethod" from SELECT projection
    - fed-account.validator.ts: removed AllocationMethod import; removed both body('allocationMethod') chains in createServiceValidator and updateServiceValidator
    - fed-account-seed.sql: removed "allocationMethod" column from INSERT + updated all 3 value tuples
    - drop_cost_source.sql: appended DROP COLUMN IF EXISTS "allocationMethod" + DO $$ block to drop enum type
    - T-2026-006-federation-account-module.structural.test.js: removed AllocationMethod enum assertion, allocationMethod business rule assertions, allocationMethod CreateServiceForm assertion, Section 17 allocationMethod update enforcement assertions
    - fed-account-live-api-test.js: removed allocationMethod from 2 CREATE SERVICE payloads
    - tools/federation-accounting/seed-and-test.js: removed allocationMethod from all 4 service seed entries
    - tools/federation-accounting/test-back-dated-stp.js: removed allocationMethod from service create payload; updated report comment
  - TypeScript: 0 errors (frontend + backend)
  - Vite build: success (28.74s)
  - Key decisions:
    - Card MUI component kept (still used for BillingMode cards)
    - MuiTextField kept (still used for vendor override Autocomplete)
    - getFlatCounts helper deleted (FLAT_COUNT was the only caller)
    - resolveTargetSocieties kept (still needed for equal-split to know which societies to allocate to)

- 2026-05-08T00:00:00Z T-2026-029 iteration 1: Society treasurer access to "Bills from Federation"
  - App.tsx line 233: added "society_treasurer" to allowedRoles on the federation-invoices route; requiredPermission and component unchanged
  - AppSidebar.tsx: re-declared federationInvoicesItem (ReceiptIcon, /admin/federation-invoices, key=federation-invoices) inside society_treasurer branch; navItemsToRender = [...treasurerSection?.children, federationInvoicesItem]; ReceiptIcon already imported at line 70 — no new import needed
  - 2 files changed; TypeScript 0 errors; Vite build success (1m 30s)

- 2026-05-08T06:00:00Z T-2026-030 iteration 1: Service-backed invoice line items
  - BACKEND (5 files):
    - fed-accounts-invoice-line-item.entity.ts: added `serviceId uuid nullable` column after executionId
    - add_invoice_line_serviceid.sql (NEW): idempotent migration; ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS
    - fed-accounts-invoice.service.ts: imported ensureFederationBillingAccounts; CreateInvoiceLineItem type now has serviceId required + description/incomeAccountId optional; createInvoiceService validates serviceId (404/400 guards: exists+belongs to federation+not deleted), auto-fills description from service.name if not provided, resolves incomeAccountId to Federation Commission Income (4100-billing) if not passed or invalid, inserts serviceId in line item row; getInvoiceByIdService LEFT JOINs fed_services for serviceName in line items query
    - fed-accounts-invoice.validator.ts: serviceId required isUUID per line item; description optional; incomeAccountId optional; gstPercent optional (checkFalsy); unitAmount min:0 (was min:0.01)
    - fed-accounts-invoice-society-view.service.ts: line items query now LEFT JOINs fed_services for serviceName
  - FRONTEND (5 files):
    - FedAccountsInvoiceSlice.ts: FedAccountsInvoiceLineItem interface adds serviceId: string|null and serviceName?: string|null; CreateInvoiceLineItemPayload replaced description/incomeAccountId with serviceId required + rest optional
    - CreateInvoiceForm.tsx: full overhaul of line items section — removed Template/Description/GST%/IncomeAccount pickers; Service Autocomplete over state.fedService.services (active+non-deleted); Qty/Unit Amount inputs; Line Total computed; caption preview row shows commissionPercent%; removed Subtotal/GST summary (single Grand Total); on mount dispatches fetchFedServices({}) if allServices.length===0; submit payload sends only serviceId+quantity+unitAmount per line
    - InvoiceDetailDialog.tsx: line items table header "Description" → "Service"; renders item.serviceName ?? item.description ?? '—'; GST% column conditional on any line having gstPercent > 0; used IIFE pattern to extract items + hasGst vars cleanly
    - FederationInvoiceDetailDialog.tsx: same Service column + conditional GST col + IIFE pattern
    - (FedAccountsInvoiceSlice re-exported by SocietyFedInvoicesSlice → no changes needed there)
  - TypeScript: 0 errors both repos; Vite build: 27.43s success
  - Key decisions:
    - incomeAccountId falls back silently to commission income (not 400 error) when passed value is invalid — lets legacy code paths continue
    - unitAmount min:0 (not min:0.01) in validator — UI must enforce > 0, backend accepts 0 for potential free-service lines
    - IIFE pattern in detail dialogs to avoid TS18048 "possibly undefined" on inv.items.some() inside conditional render block
    - Migration file must be run manually: psql -d <db> -f add_invoice_line_serviceid.sql

- 2026-05-08T11:00:00Z T-2026-031 hardening iteration: Pay Federation Invoice self-diagnosis + hardening
  - Files: fed-accounts-invoice-society-pay.service.ts, fed-journal-posting.service.ts, fed-accounts-invoice-society-view.controller.ts
  - Key decisions:
    - Step 1 SQL: replaced single dynamic string interpolation with two static SQL branches (isFullyPaid flag); eliminates risk of trailing-comma SQL syntax error
    - fyId guard: if fyRows empty AND inv.fyId empty/null → throw AppError(BAD_REQUEST) with human-readable message pointing to FY setup; placed before INSERT so user sees actionable error not PG NOT NULL violation
    - Bank account fallback in postTreasurerPayFederationJournal: primary=code '1110', fallback=first ASSET/subType IN ('BANK','CASH'), final=throw with seed-default-chart link
    - Per-step console.log tags: [pay-fed-invoice] entry, transaction start, step 1-5 start/done, transaction committed, rollback
    - Controller catch: console.error('[pay-controller] uncaught', err.stack) before handleError so original PG error survives even if handleError re-throws
  - Entity audit: source+paidByUserId already in FedAccountsPayment entity (verified); paidAt already in FedAccountsInvoice entity (verified); all 5 steps columns match entities
  - TypeScript: 0 errors

- 2026-05-08T12:00:00Z T-2026-032 iteration 1: Federation recurring auto-execution (Level-1 draft-only cron)
  - BACKEND (5 files):
    - fed-auto-execution.service.ts (NEW): runFederationAutoExecution(opts?) function; AutoExecutionRunResult interface (scanned/created/skipped/errors); computePeriod helper covers monthly/quarterly/yearly; period start/end as ISO date strings; checks existing fed_executions in period window; inserts draft row with vendorCost=0, commissionPercent copied from service, commissionAmount=0, actualCost=0; per-service try/catch so one failure doesn't abort run; supports opts.federationId scope + opts.targetDate override for back-fill testing
    - fed-auto-execution.cron.ts (NEW): startFederationAutoExecutionCron/stopFederationAutoExecutionCron exports; msUntilNext0005() helper (advances to tomorrow if already past 00:05); calls runFederationAutoExecution(); writeAuditLogDirect with JOB_RUN + scanned/created/skipped/errorCount in newData; auditStatus = 'FAILED' only when ALL services errored, else 'SUCCESS'
    - fed-auto-execution.controller.ts (NEW): runAutoExecutionController; role guard (federation_admin or avigo_admin only); federationId defaults to JWT claim for federation_admin; body federationId allowed only for avigo_admin; targetDate validation; returns 200 { success: true, data: { scanned, created, skipped, errors } }
    - fed-account.routes.ts (MODIFIED): added import runAutoExecutionController; added POST /auto-execution/run route at end (no validator needed beyond controller-level role check)
    - app.ts (MODIFIED): import startFederationAutoExecutionCron; call after startFedAccountsCron() in startApp()
  - TypeScript: 0 errors
  - Route URL: POST /api/federation/account/auto-execution/run
  - Auth: authenticateAdminOrFederation middleware (already applied to entire router)
  - Key decisions:
    - No new npm dependencies — uses existing uuid package
    - AuditEntry status = SUCCESS/FAILED only (no PARTIAL_SUCCESS) — error detail stored in newData.errors
    - targetDate override param for back-fill testing (pass '2026-04-01' to generate Apr executions)
    - No allocationMethod/allocation rows inserted at draft stage — allocations auto-generated at lock time via existing equal-split logic
    - Period check: executionDate BETWEEN startDate AND endDate (covers both pre-existing manually-created executions and auto-created ones)

- 2026-05-08T15:00:00Z T-2026-033 iteration 1: Refactor federation accounting commission→Income/Expenses model
  - BACKEND (9 files + 1 new):
    - fed-service.entity.ts: removed commissionPercent @Column + field
    - fed-execution.entity.ts: removed commissionPercent + commissionAmount @Columns + fields; updated vendorCost/actualCost comments
    - fed-service.service.ts: removed commissionPercent from create/update DTO, INSERT, updatableFields
    - fed-execution.service.ts: removed commissionPercent/commissionAmount from INSERT; added actualCost required param; removed commission computation logic; added actualCost >= 0 guard
    - fed-journal-posting.service.ts: removed ACCT_VENDOR_COST_RECOVERY/ACCT_COMMISSION_INCOME constants; added ACCT_SERVICE_INCOME='4100-billing'; ensureFederationBillingAccounts: removed 4200 account, renamed 4100-billing to 'Federation Service Income', added name-update logic for federations with old name; postBillingJournal: removed vendorCostShare+commissionShare params, changed Stage 2 to 2-line (Dr AR + Cr Service Income)
    - fed-billing.service.ts: removed totalVendorCostShare/totalCommissionShare loop; simplified postBillingJournal call (7 args not 9); income account resolution changed from 5100-billing to 4100-billing
    - fed-auto-execution.service.ts: removed commissionPercent/commissionAmount from INSERT; INSERT now uses actualCost=0
    - fed-account.validator.ts: removed commissionPercent from all 3 validators; added actualCost required to createExecutionValidator
    - fed-account-seed.sql: removed commissionPercent from INSERT column list and all value tuples
    - drop_commission_columns.sql (NEW): idempotent; DROP COLUMN IF EXISTS on 3 columns; UPDATE fed_accounts_accounts to rename Commission→Service Income; UPDATE to retire 4200 account
  - FRONTEND (8 files):
    - FedServiceSlice.ts: removed commissionPercent from FedService interface + CreateFedServicePayload
    - FedExecutionSlice.ts: removed commissionPercent/commissionAmount from FedExecution; added required actualCost to CreateExecutionPayload
    - federationAccountLabels.ts: removed commissionPercent/commissionAmount labels + friendlyAllocationMethod fn
    - CreateServiceForm.tsx: removed Commission % field, default, edit hydration, submit payload
    - ServiceList.tsx: removed Commission % column header + body cell
    - CreateExecutionForm.tsx: replaced commissionPercentOverride with actualCost state; replaced live commission preview with profit caption (green/red/grey); submit payload sends actualCost
    - ExecutionList.tsx: removed commissionAmount column from table and detail dialog
    - CreateInvoiceForm.tsx: fixed TS error — removed commissionPercent reference from service caption string
  - TypeScript: 0 errors both repos; Vite build: success
  - grep verification: 0 matches for commissionPercent|commissionAmount|CommissionIncome in src/ trees (backend SQL migration files only)
  - Key decisions:
    - actualCost required in CreateExecutionPayload (not optional) — forces operator to explicitly enter society billing amount
    - postBillingJournal signature change: 7 params (removed vendorCostShare + commissionShare)
    - ensureFederationBillingAccounts: adds name-update logic so existing federations with old "Commission Income" account get renamed on next lock/send without requiring manual SQL migration
    - Income account in fed-billing.service.ts line items loop changed from 5100-billing (expense) to 4100-billing (income) — was a bug in the original code

- 2026-05-09T15:30:00Z T-2026-040 iteration 1: Seed societyBilled from service.defaultSocietyBilled in CreateExecutionForm.tsx
  - Added a new useEffect([serviceId]) block that, when serviceId changes in create mode (!editData), seeds both vendorCost from selectedService.defaultVendorCost and actualCost from selectedService.defaultSocietyBilled (using || 0 fallback matching existing init pattern)
  - editData guard prevents overwriting values loaded in edit mode
  - selectedService is derived synchronously from services.find(s => s.id === serviceId) before the effect runs — serviceId as dependency is correct and avoids circular deps
  - eslint-disable-line react-hooks/exhaustive-deps comment added (same pattern as existing first useEffect)
  - File: D:/Avigo-SaaS-Admin-Web-Starter/src/components/federation/accounts/executions/CreateExecutionForm.tsx
  - TypeScript: 0 errors; Vite build: 23.66s success

- 2026-05-09T17:00:00Z T-2026-042 iteration 1: Remove Select Societies dropdown from ManualInvoiceBuilder
  - BACKEND (1 file):
    - fed-billing.service.ts (getManualInvoiceQueueService): added LEFT JOIN societies soc ON soc.id = a."societyId"; added 'societyName', soc.societyname to json_build_object in allocations json_agg; ORDER BY soc.societyname in json_agg; no endpoint shape or arg changes
  - FRONTEND (2 files):
    - FedExecutionSlice.ts: added societyName?: string and allocationId?: string to FedAllocation interface (both optional for backward compat; allocationId was already in json_build_object from backend as a key named 'allocationId', not 'id')
    - ManualInvoiceBuilder.tsx: full rewrite — removed Autocomplete multi-select, fetchMemberSocieties dispatch, memberSocieties/memberSocietiesLoading store fields; added "Society" column in the expense table showing getSocietyLabel(exec) (comma-joined society names from allocations); added Select All checkbox header (indeterminate for partial); added derivedSocietyIds useMemo (unique set from checked rows' allocations); added derivedSocietyNames chip summary bar; submit derives societyIds from checked rows (option c); warning shown if checked row has no societies assigned; removed Autocomplete import
  - TypeScript: 0 errors; Vite build: 46.09s success
  - Key decisions:
    - Chose option (c): derive societyIds from allocations of checked executions; submit calls generateManualInvoice once with all executionIds + all derived societyIds; backend does the join to find allocations at intersection — correct behaviour because each execution's allocations already point to the right societies
    - fetchMemberSocieties not removed from slice (other consumers may use it); just not called from ManualInvoiceBuilder
    - allocationId field was already stored as 'allocationId' key in json_build_object (not 'id'); added allocationId?: string to FedAllocation to properly type it

- 2026-05-09T18:00:00Z T-2026-043 iteration 1: Fix Bank/Cash Account dropdown "No options" in federation Record Payment dialog
  - FRONTEND (2 files):
    - FedAccountsPaymentSlice.ts: added `import type { FedAccount } from './FedAccountsChartSlice'`; added `bankCashAccounts: FedAccount[]` and `bankCashAccountsLoading: boolean` to state+initialState; added `fetchFedBankCashAccounts` thunk (calls GET /api/federation/accounts?type=ASSET&isActive=true&limit=200, filters to subType null|Bank|Cash in thunk); added 3 extraReducers cases for the new thunk; `resetFedAccountsPayment: () => initialState` auto-resets new fields
    - CreatePaymentForm.tsx: removed import of `fetchFedAccounts` from `FedAccountsChartSlice`; removed `state.fedAccountsChart` selector; added `fetchFedBankCashAccounts` import from `FedAccountsPaymentSlice`; updated useSelector to also read `bankCashAccounts` and `bankCashAccountsLoading` from `state.fedAccountsPayment`; replaced `dispatch(fetchFedAccounts({...}))` with `dispatch(fetchFedBankCashAccounts())`; removed `bankAccounts` computed variable; updated Autocomplete to use `bankCashAccounts`, `loading={bankCashAccountsLoading}`, `noOptionsText` with actionable message, `loadingText`, and loading spinner in InputProps.endAdornment
  - TypeScript: 0 errors; Vite build: 52.98s success
  - Key decisions:
    - Used isolated state key in FedAccountsPaymentSlice (not FedAccountsChartSlice) to avoid shared-state contention with CoA page
    - Filtering moved into thunk (not component) for cleanliness
    - Pattern mirrors T-2026-038 fetchSocietyBankCashAccounts exactly
    - resetFedAccountsPayment already uses `() => initialState` so new fields auto-reset on logout

- 2026-05-09T20:30:00Z T-2026-045 iteration 1: Filter Opening Balance Account autocomplete to prevent duplicate entries
  - FRONTEND (1 file):
    - FederationAccountingOBPage.tsx: added `useMemo` to React import; added `filteredAccounts` useMemo that computes `usedAccountIds` Set from current `entries` (excluding the currently-edited entry's accountId for edit-mode exception) and filters `accounts` to exclude used IDs; changed `accounts={accounts}` to `accounts={filteredAccounts}` on the ObEntryForm JSX call
  - ObEntryForm.tsx: untouched
  - Backend: untouched (backend already has IDX_fed_ob_unique_entry partial unique index + ON CONFLICT upsert as safety net)
  - TypeScript: 0 errors; Vite build: 23.34s success
  - Key decisions:
    - Filter applied at page level (not in ObEntryForm) because both `entries` and `editEntry` are available in the page component
    - Edit-mode exception: `entries.filter(e => e.accountId !== editEntry?.accountId)` correctly excludes the current entry's account from the "used" set when in edit mode
    - useMemo dependencies: [entries, editEntry, accounts] — recomputes whenever any changes

## Open Assumptions

- EyeIcon shows the eye (password visible) and EyeCloseIcon shows the crossed-out eye (password hidden) — based on naming convention. If the icons are reversed, swap them.
