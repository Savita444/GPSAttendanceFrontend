import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchReviews, fetchReview, sendReviewEmail } from '../store/slices/review.js';
import { selectUser } from '../store/slices/auth.js';

export default function ReviewSheet() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const items = useSelector((s) => s.review.list);
  const open = useSelector((s) => s.review.current);

  useEffect(() => { dispatch(fetchReviews()); }, [dispatch]);

  const view = (id) => dispatch(fetchReview(id));

  const sendMail = async (id) => {
    const res = await dispatch(sendReviewEmail(id));
    if (sendReviewEmail.fulfilled.match(res)) toast.success('Feedback emailed to student');
    else toast.error(res.payload || 'Failed');
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Reviews</h2>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((r) => (
              <li key={r._id} className="py-2 flex justify-between items-center">
                <div onClick={() => view(r._id)} className="cursor-pointer">
                  <div className="text-sm font-semibold">
                    {r.student?.name}
                    {r.kind && <span className="badge-blue ml-2">{r.kind === 'fortnightly' ? '15-day' : '7-day'}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{r.periodStart} → {r.periodEnd} · Score {r.overallScore}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${r.status === 'shared' ? 'badge-green' : 'badge-blue'}`}>{r.status}</span>
                  {user.role !== 'student' && (
                    <button className="btn-primary !py-1 !px-2 text-xs" onClick={() => sendMail(r._id)}>
                      {r.feedbackEmailSent ? 'Resend' : 'Email'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Details</h2>
        {!open ? (
          <p className="text-sm text-slate-500">Select a review to view.</p>
        ) : (
          <div className="space-y-2 text-sm">
            <div>
              <b>Student:</b> {open.student?.name} ({open.student?.rollNo})<br />
              <b>Trainer:</b> {open.teacher?.name}<br />
              <b>Period:</b> {open.periodStart} → {open.periodEnd}<br />
              <b>Overall:</b> {open.overallScore}%
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead className="bg-slate-100">
                  <tr><th className="p-1">Day</th><th className="p-1">Date</th><th className="p-1">P</th><th className="p-1">D</th><th className="p-1">T</th><th className="p-1">C</th><th className="p-1">Tw</th></tr>
                </thead>
                <tbody>
                  {open.days.map((d) => (
                    <tr key={d.day} className="text-center border-t border-slate-100">
                      <td className="p-1 font-semibold">{d.day}</td>
                      <td className="p-1">{d.date}</td>
                      <td className="p-1">{d.punctuality}</td>
                      <td className="p-1">{d.discipline}</td>
                      <td className="p-1">{d.technical}</td>
                      <td className="p-1">{d.communication}</td>
                      <td className="p-1">{d.teamwork}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 p-2 rounded text-slate-700">{open.overallComment || '-'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
