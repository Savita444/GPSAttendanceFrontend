import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import StatCard from '../components/common/StatCard';
import {
  fetchTeacherStats, fetchTeacherStudents, fetchStudentDetails, clearDetails,
} from '../store/slices/teacher.js';
import { fetchPending, reviewWork } from '../store/slices/dailyWork.js';
import { upsertReview } from '../store/slices/review.js';
import { createTask, updateTask, deleteTask } from '../store/slices/task.js';

const emptyDay = (i, startStr) => ({
  day: i + 1,
  date: dayjs(startStr).add(i, 'day').format('YYYY-MM-DD'),
  punctuality: 0, discipline: 0, technical: 0, communication: 0, teamwork: 0, notes: '',
});

const PRIORITY_BADGE = {
  low: 'badge-blue',
  medium: 'badge-yellow',
  high: 'badge-red',
};
const STATUS_BADGE = {
  open: 'badge-yellow',
  'in-progress': 'badge-blue',
  done: 'badge-green',
  cancelled: 'badge-red',
};
const ATT_BADGE = {
  present: 'badge-green',
  late: 'badge-yellow',
  'half-day': 'badge-yellow',
  absent: 'badge-red',
  'on-leave': 'badge-blue',
};

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const stats = useSelector((s) => s.teacher.stats);
  const students = useSelector((s) => s.teacher.students);
  const details = useSelector((s) => s.teacher.details);
  const pending = useSelector((s) => s.dailyWork.pending);

  const [openStudentId, setOpenStudentId] = useState(null);
  const [tab, setTab] = useState('students'); // students | reviews

  useEffect(() => {
    dispatch(fetchTeacherStats());
    dispatch(fetchTeacherStudents());
    dispatch(fetchPending({ status: 'submitted' }));
  }, [dispatch]);

  const openStudent = (id) => {
    setOpenStudentId(id);
    dispatch(fetchStudentDetails({ id }));
  };
  const closeStudent = () => {
    setOpenStudentId(null);
    dispatch(clearDetails());
  };

  const onReviewWork = async (id, status) => {
    const teacherComment = prompt('Comment to student:') || '';
    const res = await dispatch(reviewWork({ id, body: { status, teacherComment } }));
    if (reviewWork.fulfilled.match(res)) toast.success('Updated');
    else toast.error('Failed');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Trainer Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="My Students" value={stats.counts?.totalStudents || 0} icon="👥" />
        <StatCard label="Present Today" value={stats.counts?.presentToday || 0} accent="emerald" icon="✓" />
        <StatCard label="Pending Work" value={stats.counts?.pendingWork || 0} accent="amber" icon="!" />
        <StatCard label="Draft Reviews" value={stats.counts?.pendingReviews || 0} accent="sky" icon="📝" />
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Pending Daily Work Reviews</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">All caught up.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {pending.map((w) => (
              <li key={w._id} className="py-2 flex justify-between items-start gap-3">
                <div>
                  <div className="text-sm font-semibold">{w.student?.name} – {w.title}</div>
                  <div className="text-xs text-slate-500">{w.date} · {w.hoursSpent}h</div>
                  <div className="text-sm text-slate-700 line-clamp-2">{w.description}</div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost" onClick={() => onReviewWork(w._id, 'needs-changes')}>↩</button>
                  <button className="btn-primary" onClick={() => onReviewWork(w._id, 'approved')}>✓</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { k: 'students', label: 'My Students' },
          { k: 'reviews', label: 'New Review Sheet' },
        ].map((t) => (
          <button key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-3 py-2 text-sm ${tab === t.k ? 'border-b-2 border-brand-600 text-brand-700 font-semibold' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="card p-4">
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">No students assigned to you yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Roll</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Batch</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-t border-slate-100">
                    <td className="p-2 text-slate-500">{s.rollNo}</td>
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2 text-slate-600">{s.email}</td>
                    <td className="p-2">{s.batch}</td>
                    <td className="p-2 text-right">
                      <button className="btn-primary !py-1 !px-2 text-xs" onClick={() => openStudent(s._id)}>
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'reviews' && <ReviewForm students={students} />}

      {openStudentId && (
        <StudentDetailModal details={details} onClose={closeStudent} />
      )}
    </div>
  );
}

function StudentDetailModal({ details, onClose }) {
  const dispatch = useDispatch();
  const [showTaskForm, setShowTaskForm] = useState(false);

  if (!details) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-900/40 grid place-items-center p-4">
        <div className="card p-6">Loading…</div>
      </div>
    );
  }

  const { student, summary, attendance, tasks } = details;

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm grid place-items-center p-2 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{student.name}</h2>
            <div className="text-xs text-slate-500">
              {student.rollNo} · {student.email} · {student.technology || 'No technology'}
              {student.internshipStartDate && ` · started ${student.internshipStartDate}`}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !py-1 !px-2">✕</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <Stat label="30-day Att" value={`${summary.attendancePct}%`} />
          <Stat label="Present" value={summary.present} />
          <Stat label="Late" value={summary.late} />
          <Stat label="Half-day" value={summary.halfDay} />
          <Stat label="Absent" value={summary.absent} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5 p-5">
          {/* Attendance log */}
          <section>
            <h3 className="font-semibold mb-2">Attendance Log (last 30 days)</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Check in</th>
                    <th className="p-2 text-left">Check out</th>
                    <th className="p-2 text-center">Min</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr><td colSpan="5" className="p-4 text-center text-slate-400">No records</td></tr>
                  ) : attendance.map((a) => (
                    <tr key={a._id} className="border-t border-slate-100">
                      <td className="p-2 font-mono">{a.date}</td>
                      <td className="p-2">{a.checkIn ? dayjs(a.checkIn.at).format('hh:mm A') : '—'}</td>
                      <td className="p-2">{a.checkOut ? dayjs(a.checkOut.at).format('hh:mm A') : '—'}</td>
                      <td className="p-2 text-center">{a.workedMinutes || 0}</td>
                      <td className="p-2 text-center">
                        <span className={ATT_BADGE[a.status] || 'badge'}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tasks */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Tasks ({tasks.length})</h3>
              <button onClick={() => setShowTaskForm((v) => !v)} className="btn-primary !py-1 !px-2 text-xs">
                {showTaskForm ? 'Close' : '+ Assign task'}
              </button>
            </div>

            {showTaskForm && (
              <TaskForm
                assigneeId={student.id}
                onDone={() => {
                  setShowTaskForm(false);
                  dispatch(fetchStudentDetails({ id: student.id }));
                }}
              />
            )}

            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks yet.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t._id} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{t.title}</div>
                        {t.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</div>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={PRIORITY_BADGE[t.priority]}>{t.priority}</span>
                          <span className={STATUS_BADGE[t.status]}>{t.status}</span>
                          {t.dueDate && <span className="text-[11px] text-slate-500">due {t.dueDate}</span>}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this task?')) return;
                          const res = await dispatch(deleteTask(t._id));
                          if (deleteTask.fulfilled.match(res)) {
                            toast.success('Deleted');
                            dispatch(fetchStudentDetails({ id: student.id }));
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 text-sm">✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function TaskForm({ assigneeId, onDone }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await dispatch(createTask({ ...form, assigneeId, dueDate: form.dueDate || undefined }));
    setBusy(false);
    if (createTask.fulfilled.match(res)) {
      toast.success('Task assigned');
      onDone?.();
    } else {
      toast.error(res.payload || 'Failed');
    }
  };

  return (
    <form onSubmit={submit} className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
      <input className="input" placeholder="Task title" required value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea className="input min-h-[60px]" placeholder="Description (optional)" value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <input type="date" className="input" value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </div>
      <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Assign'}</button>
    </form>
  );
}

function ReviewForm({ students }) {
  const dispatch = useDispatch();
  const [kind, setKind] = useState('weekly');
  const [reviewForm, setReviewForm] = useState({
    studentId: '',
    periodStart: dayjs().format('YYYY-MM-DD'),
    periodEnd: dayjs().add(6, 'day').format('YYYY-MM-DD'),
    overallComment: '',
    days: Array.from({ length: 7 }, (_, i) => emptyDay(i, dayjs().format('YYYY-MM-DD'))),
  });

  const changeKind = (k) => {
    setKind(k);
    const len = k === 'weekly' ? 7 : 15;
    setReviewForm((f) => ({
      ...f,
      periodEnd: dayjs(f.periodStart).add(len - 1, 'day').format('YYYY-MM-DD'),
      days: Array.from({ length: len }, (_, i) => emptyDay(i, f.periodStart)),
    }));
  };

  const updateDay = (i, key, v) => {
    const days = [...reviewForm.days];
    days[i] = { ...days[i], [key]: v };
    setReviewForm({ ...reviewForm, days });
  };

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(upsertReview({ ...reviewForm, kind }));
    if (upsertReview.fulfilled.match(res)) toast.success(`Review saved (score ${res.payload.overallScore}%)`);
    else toast.error(res.payload || 'Failed');
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Student Review Sheet</h2>
        <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5 text-xs">
          {['weekly', 'fortnightly'].map((k) => (
            <button key={k} onClick={() => changeKind(k)}
              className={`px-2 py-1 rounded-md ${kind === k ? 'bg-brand-600 text-white' : 'text-slate-600'}`}>
              {k === 'weekly' ? '7-day' : '15-day'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="label">Student</label>
            <select className="input" required value={reviewForm.studentId}
              onChange={(e) => setReviewForm({ ...reviewForm, studentId: e.target.value })}>
              <option value="">Select…</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.rollNo || s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Period Start</label>
            <input className="input" type="date" value={reviewForm.periodStart}
              onChange={(e) => setReviewForm({ ...reviewForm, periodStart: e.target.value })} />
          </div>
          <div>
            <label className="label">Period End</label>
            <input className="input" type="date" value={reviewForm.periodEnd}
              onChange={(e) => setReviewForm({ ...reviewForm, periodEnd: e.target.value })} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="text-xs w-full min-w-[760px]">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="p-2 text-left">Day</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2">Punct.</th>
                <th className="p-2">Discipline</th>
                <th className="p-2">Technical</th>
                <th className="p-2">Comm.</th>
                <th className="p-2">Teamwork</th>
                <th className="p-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {reviewForm.days.map((d, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="p-1 font-semibold">{d.day}</td>
                  <td className="p-1">
                    <input className="input !py-1 !px-2 text-xs" type="date" value={d.date}
                      onChange={(e) => updateDay(i, 'date', e.target.value)} />
                  </td>
                  {['punctuality', 'discipline', 'technical', 'communication', 'teamwork'].map((k) => (
                    <td key={k} className="p-1">
                      <input className="input !py-1 !px-2 text-xs text-center" type="number" min="0" max="10"
                        value={d[k]} onChange={(e) => updateDay(i, k, +e.target.value)} />
                    </td>
                  ))}
                  <td className="p-1">
                    <input className="input !py-1 !px-2 text-xs" value={d.notes}
                      onChange={(e) => updateDay(i, 'notes', e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <label className="label">Overall comment</label>
          <textarea className="input min-h-[80px]" value={reviewForm.overallComment}
            onChange={(e) => setReviewForm({ ...reviewForm, overallComment: e.target.value })} />
        </div>

        <button className="btn-primary">Save Review</button>
      </form>
    </div>
  );
}
