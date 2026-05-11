import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import StatCard from '../components/common/StatCard';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  fetchDashboard, fetchPerformance, fetchUsers, setUserActive,
  fetchOffices, createOffice, createUser,
} from '../store/slices/admin.js';
import {
  fetchTrainerPreview, sendTrainerMail, sendAllTrainersMail,
} from '../store/slices/reminders.js';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const stats = useSelector((s) => s.admin.dashboard);
  const perf = useSelector((s) => s.admin.performance);
  const users = useSelector((s) => s.admin.users);
  const offices = useSelector((s) => s.admin.offices);
  const [tab, setTab] = useState('overview');

  const refresh = () => {
    dispatch(fetchDashboard());
    dispatch(fetchPerformance({
      from: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
      to: dayjs().format('YYYY-MM-DD'),
    }));
    dispatch(fetchUsers());
    dispatch(fetchOffices());
  };

  useEffect(refresh, []);

  if (!stats) return <div className="p-6 text-slate-500">Loading…</div>;
  const c = stats.counts;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Students" value={c.students} icon="🎓" />
        <StatCard label="Trainers" value={c.teachers} accent="sky" icon="👨‍🏫" />
        <StatCard label="Present today" value={c.presentToday} accent="emerald" icon="✓" />
        <StatCard label="Late today" value={c.lateToday} accent="amber" icon="!" />
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {['overview', 'users', 'offices', '15-day mail'].map((t) => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm capitalize whitespace-nowrap ${
              tab === t ? 'border-b-2 border-brand-600 text-brand-700 font-semibold' : 'text-slate-500'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="card p-4">
            <h3 className="font-semibold mb-3">Top Students – Attendance %</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={perf.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="attendancePct" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Recent Logins</h3>
            <ul className="divide-y divide-slate-100 text-sm">
              {stats.recentLogins.map((l, i) => (
                <li key={i} className="py-2 flex justify-between">
                  <span>{l.user?.name} <span className="text-xs text-slate-400">({l.user?.role})</span></span>
                  <span className="text-xs text-slate-500">{dayjs(l.at).format('DD MMM, hh:mm A')}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Roll/Batch</th>
                <th className="p-2 text-left">Technology</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2 capitalize">{u.role}</td>
                  <td className="p-2">{u.rollNo || ''} {u.batch || ''}</td>
                  <td className="p-2">{u.technology || '—'}</td>
                  <td className="p-2">
                    <button
                      onClick={async () => {
                        await dispatch(setUserActive({ id: u._id, isActive: !u.isActive }));
                        toast.success('Updated');
                      }}
                      className={u.isActive ? 'badge-green' : 'badge-red'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'offices' && (
        <OfficeManager offices={offices} />
      )}

      {tab === '15-day mail' && (
        <FortnightlyMailer trainers={users.filter((u) => u.role === 'teacher')} />
      )}
    </div>
  );
}

function FortnightlyMailer({ trainers }) {
  const dispatch = useDispatch();
  const preview = useSelector((s) => s.reminders.trainerPreview);
  const [from, setFrom] = useState(dayjs().subtract(14, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [busyAll, setBusyAll] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const loadPreview = async (trainerId) => {
    setSelectedTrainerId(trainerId);
    const res = await dispatch(fetchTrainerPreview({ trainerId, params: { from, to } }));
    if (fetchTrainerPreview.rejected.match(res)) toast.error('Preview failed');
  };

  const sendOne = async (trainerId) => {
    setBusyId(trainerId);
    const res = await dispatch(sendTrainerMail({ trainerId, body: { from, to } }));
    setBusyId(null);
    if (sendTrainerMail.fulfilled.match(res)) {
      const r = res.payload;
      toast.success(`Sent to ${r.mailedTo} (${r.studentCount} students)`);
    } else {
      toast.error(res.payload || 'Send failed');
    }
  };

  const sendAll = async () => {
    if (!confirm(`Send 15-day report to all ${trainers.length} trainers?`)) return;
    setBusyAll(true);
    const res = await dispatch(sendAllTrainersMail({ from, to }));
    setBusyAll(false);
    if (sendAllTrainersMail.fulfilled.match(res)) {
      toast.success(`Sent: ${res.payload.sent} · Failed: ${res.payload.failed}`);
    } else {
      toast.error(res.payload || 'Bulk send failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-semibold">15-Day Trainer Reports</h3>
          <button onClick={() => setShowAdd((v) => !v)} className="btn-primary !py-1 !px-3 text-xs">
            {showAdd ? 'Close' : '+ Add Trainer'}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Pick a trainer to email them an attendance summary of their assigned students for the period below.
        </p>

        {showAdd && <AddTrainerForm onDone={() => setShowAdd(false)} />}

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={sendAll} disabled={busyAll || trainers.length === 0} className="btn-primary w-full">
              {busyAll ? 'Sending…' : `Send to all ${trainers.length} trainers`}
            </button>
          </div>
        </div>

        {trainers.length === 0 ? (
          <p className="text-sm text-slate-500">No trainers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Trainer</th>
                  <th className="p-2 text-left">Technology</th>
                  <th className="p-2 text-left">Department</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((t) => (
                  <tr key={t._id} className="border-t border-slate-100">
                    <td className="p-2">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.designation}</div>
                    </td>
                    <td className="p-2"><span className="badge-blue">{t.technology || '—'}</span></td>
                    <td className="p-2 text-slate-600">{t.department || '—'}</td>
                    <td className="p-2 text-slate-600">{t.email}</td>
                    <td className="p-2 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => loadPreview(t._id)} className="btn-ghost !py-1 !px-2 text-xs">
                        Preview
                      </button>
                      <button onClick={() => sendOne(t._id)} disabled={busyId === t._id} className="btn-primary !py-1 !px-2 text-xs">
                        {busyId === t._id ? 'Sending…' : 'Send mail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTrainerId && preview && (
        <div className="card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">
                Preview · {preview.trainer.name}
                {preview.trainer.technology && <span className="badge-blue ml-2">{preview.trainer.technology}</span>}
              </h3>
              <p className="text-xs text-slate-500">
                {preview.periodStart} → {preview.periodEnd} · {preview.students.length} student(s)
              </p>
            </div>
          </div>

          {preview.students.length === 0 ? (
            <p className="text-sm text-slate-500">No students assigned to this trainer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">Roll</th>
                    <th className="p-2 text-left">Student</th>
                    <th className="p-2 text-center">Present</th>
                    <th className="p-2 text-center">Late</th>
                    <th className="p-2 text-center">Half</th>
                    <th className="p-2 text-center">Absent</th>
                    <th className="p-2 text-center">Att %</th>
                    <th className="p-2 text-center">15-day review</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.students.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="p-2 text-slate-500">{s.rollNo}</td>
                      <td className="p-2">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="p-2 text-center text-emerald-700">{s.present}</td>
                      <td className="p-2 text-center text-amber-700">{s.late}</td>
                      <td className="p-2 text-center text-sky-700">{s.halfDay}</td>
                      <td className="p-2 text-center text-rose-700">{s.absent}</td>
                      <td className="p-2 text-center font-semibold">{s.attendancePct}%</td>
                      <td className="p-2 text-center">
                        {s.reviewSubmitted ? (
                          <span className="badge-green">submitted</span>
                        ) : (
                          <span className="badge-red">pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddTrainerForm({ onDone }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    technology: '',
    designation: '',
    department: '',
    employeeId: '',
    phone: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await dispatch(createUser({ ...form, role: 'teacher' }));
    setBusy(false);
    if (createUser.fulfilled.match(res)) {
      toast.success(`Trainer ${res.payload.name} added`);
      onDone?.();
    } else {
      toast.error(res.payload || 'Failed');
    }
  };

  const f = (k, label, type = 'text', required = false) => (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <input className="input" type={type} required={required}
        value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </div>
  );

  return (
    <form onSubmit={submit} className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      <h4 className="font-semibold text-sm">New Trainer</h4>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {f('name', 'Full name', 'text', true)}
        {f('email', 'Email', 'email', true)}
        {f('password', 'Temporary password', 'text', true)}
        <div>
          <label className="label">Technology *</label>
          <input list="tech-list" className="input" required
            value={form.technology}
            onChange={(e) => setForm({ ...form, technology: e.target.value })} />
          <datalist id="tech-list">
            <option value="React" /><option value="Node.js" /><option value="Python" />
            <option value="Java" /><option value="Angular" /><option value="DevOps" />
          </datalist>
        </div>
        {f('designation', 'Designation')}
        {f('department', 'Department')}
        {f('employeeId', 'Employee ID')}
        {f('phone', 'Phone')}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Create trainer'}
        </button>
      </div>
    </form>
  );
}

function OfficeManager({ offices }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: '', address: '', lat: 19.989, lng: 73.77, radiusMeters: 1500, openTime: '09:00', closeTime: '19:00',
  });
  const create = async (e) => {
    e.preventDefault();
    const res = await dispatch(createOffice(form));
    if (createOffice.fulfilled.match(res)) toast.success('Office created');
    else toast.error(res.payload || 'Failed');
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form onSubmit={create} className="card p-4 space-y-3">
        <h3 className="font-semibold">Add Office</h3>
        <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="number" step="0.000001" placeholder="Latitude" value={form.lat}
            onChange={(e) => setForm({ ...form, lat: +e.target.value })} />
          <input className="input" type="number" step="0.000001" placeholder="Longitude" value={form.lng}
            onChange={(e) => setForm({ ...form, lng: +e.target.value })} />
        </div>
        <input className="input" type="number" placeholder="Radius (m)" value={form.radiusMeters}
          onChange={(e) => setForm({ ...form, radiusMeters: +e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Open (HH:mm)" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
          <input className="input" placeholder="Close (HH:mm)" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
        </div>
        <button className="btn-primary w-full">Create</button>
      </form>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Offices</h3>
        <ul className="space-y-2 text-sm">
          {offices.map((o) => (
            <li key={o._id} className="border border-slate-100 rounded-xl p-2">
              <div className="font-semibold">{o.name}</div>
              <div className="text-xs text-slate-500">{o.address}</div>
              <div className="text-xs text-slate-500">
                ({o.lat}, {o.lng}) · {o.radiusMeters}m · {o.openTime}-{o.closeTime}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
