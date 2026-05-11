import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { fetchUsers } from '../store/slices/admin.js';
import { fetchLoginHistory } from '../store/slices/loginHistory.js';

export default function LoginHistoryPage() {
  const dispatch = useDispatch();
  const users = useSelector((s) => s.admin.users);
  const items = useSelector((s) => s.loginHistory.items);
  const [userId, setUserId] = useState('');

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);
  useEffect(() => {
    if (userId) dispatch(fetchLoginHistory(userId));
  }, [userId, dispatch]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Login History</h1>
      <div className="card p-4">
        <label className="label">User</label>
        <select className="input max-w-md" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Select…</option>
          {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
        </select>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">At</th>
              <th className="p-2 text-left">Event</th>
              <th className="p-2 text-left">IP</th>
              <th className="p-2 text-left">Device</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l._id} className="border-t border-slate-100">
                <td className="p-2">{dayjs(l.at).format('DD MMM YYYY hh:mm A')}</td>
                <td className="p-2">
                  <span className={`badge ${l.event === 'login' ? 'badge-green' : l.event === 'failed' ? 'badge-red' : 'badge-blue'}`}>{l.event}</span>
                </td>
                <td className="p-2">{l.ip}</td>
                <td className="p-2 truncate max-w-[280px]">{l.userAgent}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-slate-500">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
