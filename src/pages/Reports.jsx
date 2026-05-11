import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { ReportAPI } from '../api/endpoints';
import { fetchReport } from '../store/slices/reports.js';
import { fetchUsers } from '../store/slices/admin.js';

export default function Reports() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.reports.items);
  const students = useSelector((s) => s.admin.users.filter((u) => u.role === 'student'));

  const [filters, setFilters] = useState({
    from: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    studentId: '',
    batch: '',
  });

  useEffect(() => { dispatch(fetchUsers({ role: 'student' })); }, [dispatch]);

  const run = async () => {
    const res = await dispatch(fetchReport(filters));
    if (fetchReport.rejected.match(res)) toast.error(res.payload || 'Failed');
  };

  const dl = (url) => window.open(url, '_blank');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Attendance Reports</h1>

      <div className="card p-4 grid md:grid-cols-5 gap-3">
        <div>
          <label className="label">From</label>
          <input className="input" type="date" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          <label className="label">To</label>
          <input className="input" type="date" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div>
          <label className="label">Student</label>
          <select className="input" value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}>
            <option value="">All</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Batch</label>
          <input className="input" value={filters.batch}
            onChange={(e) => setFilters({ ...filters, batch: e.target.value })} />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-primary" onClick={run}>Run</button>
          <button className="btn-ghost" onClick={() => dl(ReportAPI.excelUrl(filters))}>Excel</button>
          <button className="btn-ghost" onClick={() => dl(ReportAPI.pdfUrl(filters))}>PDF</button>
        </div>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Roll</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Batch</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Worked min</th>
              <th className="p-2 text-left">Late</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-2">{r.date}</td>
                <td className="p-2">{r.rollNo}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.batch}</td>
                <td className="p-2 capitalize">{r.status}</td>
                <td className="p-2">{r.workedMinutes}</td>
                <td className="p-2">{r.isLate ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan="7" className="p-4 text-center text-slate-500">Run a report to see data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
