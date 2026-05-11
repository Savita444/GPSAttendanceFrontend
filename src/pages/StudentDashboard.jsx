import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { getPosition } from '../utils/geolocation';
import StatCard from '../components/common/StatCard';
import { fetchStudentDashboard } from '../store/slices/student.js';
import { checkIn, checkOut } from '../store/slices/attendance.js';
import { fetchMyTasks, updateTask } from '../store/slices/task.js';

function StatusBadge({ status }) {
  const map = {
    present: 'badge-green',
    'half-day': 'badge-yellow',
    late: 'badge-yellow',
    absent: 'badge-red',
    'on-leave': 'badge-blue',
  };
  return <span className={map[status] || 'badge'}>{status}</span>;
}

export default function StudentDashboard() {
  const dispatch = useDispatch();
  const data = useSelector((s) => s.student.dashboard);
  const tasks = useSelector((s) => s.task.mine);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentDashboard());
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const onPunch = async (type) => {
    setBusy(true);
    const t = toast.loading('Getting your location…');
    try {
      const { lat, lng, accuracy } = await getPosition();
      toast.loading('Verifying office geo-fence…', { id: t });
      const action = type === 'in' ? checkIn : checkOut;
      const res = await dispatch(action({ lat, lng, accuracy }));
      if (action.fulfilled.match(res)) {
        toast.success(`Check-${type === 'in' ? 'in' : 'out'} successful`, { id: t });
        await dispatch(fetchStudentDashboard());
      } else {
        throw new Error(res.payload || 'Failed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed', { id: t });
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="p-6 text-slate-500">Loading…</div>;

  const { todayAttendance, summary, recentWork, latestReview } = data;
  const ci = todayAttendance?.checkIn;
  const co = todayAttendance?.checkOut;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Today · {dayjs().format('ddd, DD MMM YYYY')}</h1>
        <p className="text-sm text-slate-500">Punch attendance only from inside your office radius.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="30-day Attendance" value={`${summary.attendancePct}%`} accent="brand" icon="%" />
        <StatCard label="Present" value={summary.present} accent="emerald" icon="✓" />
        <StatCard label="Late" value={summary.late} accent="amber" icon="!" />
        <StatCard label="Absent" value={summary.absent} accent="rose" icon="✗" />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm text-slate-500">Today's Attendance</div>
            <div className="text-lg font-semibold">
              {todayAttendance ? <StatusBadge status={todayAttendance.status} /> : <span className="badge-red">Not punched in</span>}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {ci ? `Checked in at ${dayjs(ci.at).format('hh:mm A')} (${ci.distanceM ?? '-'}m from office)` : '—'}<br />
              {co ? `Checked out at ${dayjs(co.at).format('hh:mm A')} · ${todayAttendance.workedMinutes} min worked` : ''}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy || !!ci} onClick={() => onPunch('in')}>
              {ci ? 'Checked in' : 'Check in'}
            </button>
            <button className="btn-danger" disabled={busy || !ci || !!co} onClick={() => onPunch('out')}>
              {co ? 'Checked out' : 'Check out'}
            </button>
          </div>
        </div>
      </div>

      <MyTasks tasks={tasks} />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Recent Daily Work</h3>
          {recentWork.length === 0 ? (
            <p className="text-sm text-slate-500">No submissions yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentWork.map((w) => (
                <li key={w._id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <div className="text-sm font-medium">{w.title}</div>
                    <div className="text-xs text-slate-500">{w.date} · {w.hoursSpent}h</div>
                  </div>
                  <span className={`badge ${w.status === 'approved' ? 'badge-green' : w.status === 'needs-changes' ? 'badge-red' : 'badge-blue'}`}>
                    {w.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-2">Latest Review</h3>
          {latestReview ? (
            <div className="space-y-1">
              <div className="text-sm">Period: <b>{latestReview.periodStart}</b> → <b>{latestReview.periodEnd}</b></div>
              <div className="text-sm">Score: <b>{latestReview.overallScore}%</b></div>
              <div className="text-sm text-slate-600">{latestReview.overallComment}</div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No review yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const PRIORITY_BADGE = { low: 'badge-blue', medium: 'badge-yellow', high: 'badge-red' };
const STATUS_BADGE  = { open: 'badge-yellow', 'in-progress': 'badge-blue', done: 'badge-green', cancelled: 'badge-red' };

function MyTasks({ tasks }) {
  const dispatch = useDispatch();
  const setStatus = async (t, status) => {
    const res = await dispatch(updateTask({ id: t._id, body: { status } }));
    if (updateTask.fulfilled.match(res)) toast.success(status === 'done' ? 'Marked done' : 'Updated');
    else toast.error(res.payload || 'Failed');
  };

  const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">My Tasks</h3>
        <span className="text-xs text-slate-500">{open.length} open · {done.length} done</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No tasks assigned yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {[...open, ...done].map((t) => (
            <li key={t._id} className="py-2.5 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium">{t.title}</div>
                {t.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</div>}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={PRIORITY_BADGE[t.priority]}>{t.priority}</span>
                  <span className={STATUS_BADGE[t.status]}>{t.status}</span>
                  {t.dueDate && <span className="text-[11px] text-slate-500">due {t.dueDate}</span>}
                  {t.createdBy && <span className="text-[11px] text-slate-400">by {t.createdBy.name}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {t.status === 'open' && (
                  <button onClick={() => setStatus(t, 'in-progress')}
                    className="btn-ghost !py-1 !px-2 text-xs">Start</button>
                )}
                {t.status !== 'done' && (
                  <button onClick={() => setStatus(t, 'done')}
                    className="btn-primary !py-1 !px-2 text-xs">Done</button>
                )}
                {t.status === 'done' && (
                  <button onClick={() => setStatus(t, 'in-progress')}
                    className="btn-ghost !py-1 !px-2 text-xs">Reopen</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
