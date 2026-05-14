import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { ReportMVPAPI, BatchAPI, CollegeAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import {
  IconClipboard, IconDownload, IconPlus, IconMail,
} from '../../components/common/Icon.jsx';
import ExportButton from '../../components/common/ExportButton.jsx';
import { errorMessage } from '../../utils/errors.js';

function StatusBadge({ status }) {
  if (status === 'emailed')   return <span className="badge-green">✓ Emailed</span>;
  if (status === 'generated') return <span className="badge-blue">Generated</span>;
  if (status === 'failed')    return <span className="badge-red">Failed</span>;
  return <span className="badge-slate">{status}</span>;
}

function PctPill({ value }) {
  const v = Number(value || 0);
  const tone =
    v >= 80 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60' :
    v >= 60 ? 'bg-amber-50 text-amber-700 ring-amber-200/60' :
              'bg-rose-50 text-rose-700 ring-rose-200/60';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${tone}`}>
      {v.toFixed(1)}%
    </span>
  );
}

export default function ReportsPage() {
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({
    collegeId: '',
    batchId: '',
    status: '',
    from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    to:   dayjs().format('YYYY-MM-DD'),
  });
  const [genModal, setGenModal] = useState({ open: false, busy: false });
  const [genForm, setGenForm] = useState({
    collegeId: '', batchId: '',
    from: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    to:   dayjs().format('YYYY-MM-DD'),
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    CollegeAPI.list({ active: true, limit: 200 })
      .then((d) => setColleges(Array.isArray(d) ? d : d.items || [])).catch(() => {});
    BatchAPI.list({ active: true, limit: 200 })
      .then((d) => setBatches(Array.isArray(d) ? d : d.items || [])).catch(() => {});
  }, []);

  const fetcher = async ({ page, limit, search, filters }) => {
    const data = await ReportMVPAPI.list({
      page, limit, search,
      collegeId: filters.collegeId || undefined,
      batchId:   filters.batchId   || undefined,
      status:    filters.status    || undefined,
      from:      filters.from      || undefined,
      to:        filters.to        || undefined,
    });
    if (Array.isArray(data)) return { items: data, total: data.length };
    return { items: data.items || [], total: data.total ?? (data.items || []).length };
  };

  const filteredBatches = filters.collegeId
    ? batches.filter((b) => b.collegeId === filters.collegeId)
    : batches;
  const filteredGenBatches = genForm.collegeId
    ? batches.filter((b) => b.collegeId === genForm.collegeId)
    : batches;

  const onGenerate = async () => {
    if (!genForm.batchId) return toast.error('Pick a batch');
    setGenModal({ ...genModal, busy: true });
    try {
      const r = await ReportMVPAPI.generateForBatch(genForm.batchId, { from: genForm.from, to: genForm.to });
      toast.success(`Report ${r.status === 'emailed' ? 'generated + emailed' : 'generated'}`);
      setGenModal({ open: false, busy: false });
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(errorMessage(e, 'Generation failed'));
      setGenModal({ ...genModal, busy: false });
    }
  };

  const onRunWeeklyAll = async () => {
    if (!confirm('Generate weekly PDFs for ALL active batches and email staff contacts?')) return;
    try {
      const r = await ReportMVPAPI.generateWeeklyAll();
      const okCount = (r.results || []).filter((x) => x.ok).length;
      toast.success(`Done. ${okCount}/${(r.results || []).length} batches reported.`);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(errorMessage(e, 'Failed'));
    }
  };

  const columns = [
    {
      key: 'period', header: 'Period', width: 200,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{dayjs(r.periodStart).format('D MMM')} – {dayjs(r.periodEnd).format('D MMM YYYY')}</div>
          <div className="text-[11px] text-slate-500 capitalize">{r.kind}</div>
        </div>
      ),
    },
    {
      key: 'college', header: 'College',
      render: (r) => r.college
        ? <div>
            <div className="font-medium text-slate-900">{r.college.code}</div>
            <div className="text-[11px] text-slate-500 truncate" title={r.college.name}>{r.college.name}</div>
          </div>
        : '—',
    },
    {
      key: 'batch', header: 'Batch',
      render: (r) => r.batch
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200/60">{r.batch.code}</span>
        : '—',
    },
    { key: 'totalStudents', header: 'Students', align: 'right', render: (r) => <span className="tabular-nums font-semibold">{r.totalStudents ?? 0}</span> },
    { key: 'avgAttendancePct', header: 'Avg %', align: 'right', render: (r) => <PctPill value={r.avgAttendancePct} /> },
    {
      key: 'recipients', header: 'Recipients',
      render: (r) => {
        const list = r.recipients || [];
        if (list.length === 0) return <span className="text-slate-400 text-xs">—</span>;
        return (
          <span className="inline-flex items-center gap-1 text-xs text-slate-600" title={list.join(', ')}>
            <IconMail size={12} className="text-slate-400" />
            {list.length} {list.length === 1 ? 'contact' : 'contacts'}
          </span>
        );
      },
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Generated', render: (r) => <span className="text-xs text-slate-500">{dayjs(r.createdAt).format('D MMM, HH:mm')}</span> },
    {
      key: '_actions', header: '', align: 'right',
      render: (r) => (
        <a
          href={r.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 ring-1 ring-brand-200/60 transition"
        >
          <IconDownload size={12} /> PDF
        </a>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Generate weekly PDFs and email staff contacts. Browse all past reports below."
        icon={IconClipboard}
        accent="brand"
        actions={
          <>
            <ExportButton
              url="/reports/export"
              filename="attendance-reports"
              filters={filters}
              label="Export"
            />
            <button className="btn-ghost flex items-center gap-2" onClick={onRunWeeklyAll}>
              <IconClipboard size={16} /> Run Weekly (all batches)
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => { setGenForm((f) => ({ ...f, collegeId: '', batchId: '' })); setGenModal({ open: true, busy: false }); }}
            >
              <IconPlus size={16} /> Generate Report
            </button>
          </>
        }
      />

      {/* Filter bar */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="label">College</label>
            <select className="input" value={filters.collegeId}
              onChange={(e) => setFilters({ ...filters, collegeId: e.target.value, batchId: '' })}>
              <option value="">All colleges</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch</label>
            <select className="input" value={filters.batchId}
              onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}>
              <option value="">All batches</option>
              {filteredBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From date</label>
            <input type="date" className="input" value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="label">To date</label>
            <input type="date" className="input" value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="emailed">Emailed</option>
              <option value="generated">Generated (not emailed)</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            className="text-xs text-slate-500 hover:text-rose-600 transition"
            onClick={() => setFilters({ collegeId: '', batchId: '', status: '', from: '', to: '' })}
          >Clear all filters</button>
        </div>
      </div>

      <DataTable
        key={reloadKey}
        columns={columns}
        fetcher={fetcher}
        filters={filters}
        pageSize={25}
        searchPlaceholder="Search college / batch…"
        emptyMessage="No reports for the selected filters"
        emptyHint="Try widening the date range or clearing the filters above."
      />

      {/* Generate Report modal */}
      <Modal
        open={genModal.open}
        onClose={() => setGenModal({ open: false, busy: false })}
        title="Generate Report"
        size="md"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setGenModal({ open: false, busy: false })}>Cancel</button>
            <button className="btn-primary" disabled={genModal.busy || !genForm.batchId} onClick={onGenerate}>
              {genModal.busy ? 'Generating…' : 'Generate & Email'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">College</label>
            <select className="input" value={genForm.collegeId}
              onChange={(e) => setGenForm({ ...genForm, collegeId: e.target.value, batchId: '' })}>
              <option value="">All colleges</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch *</label>
            <select className="input" value={genForm.batchId}
              onChange={(e) => setGenForm({ ...genForm, batchId: e.target.value })}>
              <option value="">Select batch…</option>
              {filteredGenBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={genForm.from}
                onChange={(e) => setGenForm({ ...genForm, from: e.target.value })} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={genForm.to}
                onChange={(e) => setGenForm({ ...genForm, to: e.target.value })} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            ⓘ The PDF will be uploaded and emailed to all matching staff contacts. The record will appear in the table.
          </div>
        </div>
      </Modal>
    </>
  );
}
