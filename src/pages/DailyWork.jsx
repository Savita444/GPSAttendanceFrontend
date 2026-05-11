import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { fetchMine, submitWork } from '../store/slices/dailyWork.js';

export default function DailyWork() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.dailyWork.mine);
  const [form, setForm] = useState({
    title: '', description: '', hoursSpent: 1, technologies: '', date: dayjs().format('YYYY-MM-DD'),
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => { dispatch(fetchMine()); }, [dispatch]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await dispatch(submitWork({
      ...form,
      technologies: form.technologies.split(',').map((s) => s.trim()).filter(Boolean),
    }));
    setBusy(false);
    if (submitWork.fulfilled.match(res)) {
      toast.success('Submitted');
      setForm({ ...form, title: '', description: '', hoursSpent: 1, technologies: '' });
    } else {
      toast.error(res.payload || 'Failed');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Submit Today's Work</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[120px]" required value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Hours Spent</label>
              <input className="input" type="number" min="0" max="24" step="0.5"
                value={form.hoursSpent}
                onChange={(e) => setForm({ ...form, hoursSpent: +e.target.value })} />
            </div>
            <div>
              <label className="label">Technologies (comma sep)</label>
              <input className="input" value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Submit'}</button>
        </form>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">My Submissions</h2>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {items.map((w) => (
              <li key={w._id} className="py-2">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="text-sm font-semibold">{w.title}</div>
                    <div className="text-xs text-slate-500">{w.date} · {w.hoursSpent}h · {w.technologies?.join(', ')}</div>
                    <div className="text-sm text-slate-700 mt-1 line-clamp-3">{w.description}</div>
                    {w.teacherComment && (
                      <div className="text-xs mt-2 p-2 bg-slate-50 rounded">Teacher: {w.teacherComment}</div>
                    )}
                  </div>
                  <span className={`badge ${w.status === 'approved' ? 'badge-green' : w.status === 'needs-changes' ? 'badge-red' : 'badge-blue'}`}>
                    {w.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
