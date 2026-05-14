import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { AttendanceMVP, CollegeAPI, BatchAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import DateRangeFilter from '../../components/common/DateRangeFilter.jsx';
import { IconCalendar } from '../../components/common/Icon.jsx';
import ExportButton from '../../components/common/ExportButton.jsx';
import { ATTENDANCE_PAGE_SIZE } from '../../utils/config.js';

export default function AttendancePage() {
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({
    collegeId: '',
    batchId: '',
    year: '',
    month: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    CollegeAPI.list({ active: true, limit: 200 })
      .then((d) => setColleges(Array.isArray(d) ? d : d.items || []))
      .catch(() => {});
    BatchAPI.list({ active: true, limit: 200 })
      .then((d) => setBatches(Array.isArray(d) ? d : d.items || []))
      .catch(() => {});
  }, []);

  const fetcher = async ({ page, limit, search, filters }) => {
    const params = {
      page, limit, search,
      collegeId: filters.collegeId || undefined,
      batchId: filters.batchId || undefined,
      year: filters.year || undefined,
      month: filters.month || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    };
    const data = await AttendanceMVP.list(params);
    if (Array.isArray(data)) return { items: data, total: data.length };
    return { items: data.items || [], total: data.total ?? (data.items || []).length };
  };

  const filteredBatches = filters.collegeId
    ? batches.filter((b) => b.collegeId === filters.collegeId)
    : batches;

  const columns = [
    { key: 'date', header: 'Date', width: 110 },
    {
      key: 'student', header: 'Student',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.student?.fullName}</div>
          <div className="text-xs text-slate-500">{r.student?.rollNumber} · {r.student?.mobile}</div>
        </div>
      ),
    },
    { key: 'college', header: 'College', render: (r) => r.college?.code || '—' },
    { key: 'batch', header: 'Batch', render: (r) => r.batch?.code || '—' },
    { key: 'markedAt', header: 'Time', render: (r) => dayjs(r.markedAt).format('HH:mm') },
    { key: 'accuracy', header: 'GPS Acc', align: 'right', render: (r) => `${Math.round(r.accuracyMeters)}m` },
    {
      key: 'selfie', header: 'Selfie',
      render: (r) => r.selfieUrl
        ? <a href={r.selfieUrl} target="_blank" rel="noreferrer" className="text-brand-600 text-xs underline">View</a>
        : <span className="text-slate-400 text-xs">—</span>,
    },
    { key: 'platform', header: 'Device', render: (r) => <span className="text-xs text-slate-500">{r.platform || '—'}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Attendance Records"
        subtitle="Server-side paginated, with date / year / month filters"
        icon={IconCalendar}
        accent="amber"
        actions={
          <ExportButton
            url="/attendance/export"
            filename="attendance"
            filters={filters}
            label="Export"
          />
        }
      />

      <div className="card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">College</label>
            <select
              className="input"
              style={{ width: 200 }}
              value={filters.collegeId}
              onChange={(e) => setFilters({ ...filters, collegeId: e.target.value, batchId: '' })}
            >
              <option value="">All colleges</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Batch</label>
            <select
              className="input"
              style={{ width: 200 }}
              value={filters.batchId}
              onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
            >
              <option value="">All batches</option>
              {filteredBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <DateRangeFilter
          value={{ year: filters.year, month: filters.month, from: filters.from, to: filters.to }}
          onChange={(next) => setFilters({ ...filters, ...next })}
        />
      </div>

      <DataTable
        columns={columns}
        fetcher={fetcher}
        filters={filters}
        pageSize={ATTENDANCE_PAGE_SIZE}
      />
    </>
  );
}
