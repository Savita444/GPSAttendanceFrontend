import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { login, selectUser, selectAuthLoading } from '../store/slices/auth.js';

const Icon = {
  Mail: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>),
  Lock: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>),
  Eye: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>),
  EyeOff: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.88 5.08A10.36 10.36 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.2 4.1"/><path d="M6.6 6.6A17.66 17.66 0 0 0 2 12s3.5 7 10 7a10.5 10.5 0 0 0 5.4-1.6"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/></svg>),
  Pin: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none"/></svg>),
  Arrow: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>),
  Shield: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>),
};

const DEMO = {
  admin:   { email: 'admin@demo.io',   password: 'admin123',   label: 'Admin'   },
  student: { email: 'student01@demo.io', password: 'student123', label: 'Student' },
  trainer: { email: 'anita.deshpande@demo.io', password: 'trainer123', label: 'Trainer' },
};

export default function Login() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [shake, setShake] = useState(false);

  if (user) {
    const to = user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={to} replace />;
  }

  const fill = (key) => setForm({ email: DEMO[key].email, password: DEMO[key].password });

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login({ email: form.email.trim(), password: form.password }));
    if (login.fulfilled.match(res)) {
      const u = res.payload.user;
      toast.success(`Welcome, ${u.name.split(' ')[0]}!`);
      navigate(u.role === 'admin' ? '/admin' : u.role === 'teacher' ? '/teacher' : '/student');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(res.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside
        className="hidden lg:flex w-1/2 relative overflow-hidden text-white"
        style={{
          background:
            'radial-gradient(900px 460px at 0% 0%, rgba(99,152,200,0.35), transparent 60%),' +
            'radial-gradient(800px 500px at 100% 100%, rgba(26,93,160,0.45), transparent 60%),' +
            'radial-gradient(500px 320px at 50% 30%, rgba(96,165,250,0.14), transparent 60%),' +
            'linear-gradient(180deg, #0a1c30 0%, #1A5DA0 50%, #0a1c30 100%)',
        }}
      >
        <div className="absolute inset-0 bg-grid anim-grid-pan opacity-30" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl anim-blob"
             style={{ background: 'rgba(135,179,213,0.30)' }} />
        <div className="absolute bottom-0 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl anim-blob-slow"
             style={{ background: 'rgba(26,93,160,0.45)' }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl anim-blob"
             style={{ animationDelay: '4s', background: 'rgba(79,141,190,0.30)' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <span className="inline-grid place-items-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur">
              <Icon.Pin className="text-white" />
            </span>
            <span className="font-semibold tracking-wide">Attendance MVP</span>
          </div>

          <div className="flex items-center justify-center -mt-8 anim-fade-in delay-300">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-white/30 anim-pulse-ring" />
              <span className="absolute inset-0 rounded-full bg-white/20 anim-pulse-ring" style={{ animationDelay: '1.1s' }} />
              <div className="relative w-28 h-28 rounded-full bg-white/15 backdrop-blur-md border border-white/30 grid place-items-center anim-float">
                <Icon.Pin className="w-10 h-10 text-white drop-shadow" />
              </div>
            </div>
          </div>

          <div className="space-y-5 max-w-sm anim-slide-up delay-150">
            <h2 className="text-3xl font-bold leading-tight">Punch in from the<br/>right place, every day.</h2>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-3"><span className="mt-0.5 inline-grid place-items-center w-6 h-6 rounded-md bg-white/20"><Icon.Shield/></span><span>GPS-verified check-in within your office radius</span></li>
              <li className="flex items-start gap-3"><span className="mt-0.5 inline-grid place-items-center w-6 h-6 rounded-md bg-white/20"><Icon.Shield/></span><span>Daily work logs with trainer-driven reviews</span></li>
              <li className="flex items-start gap-3"><span className="mt-0.5 inline-grid place-items-center w-6 h-6 rounded-md bg-white/20"><Icon.Shield/></span><span>15-day performance feedback delivered to your inbox</span></li>
            </ul>
          </div>
          <p className="text-[11px] text-white/60">© {new Date().getFullYear()} Internship Cell</p>
        </div>
      </aside>

      <main className="flex-1 grid place-items-center p-6 sm:p-10 relative overflow-hidden">
        <div className="lg:hidden absolute -top-32 -right-20 w-72 h-72 rounded-full bg-brand-100 blur-3xl anim-blob" />
        <div className="lg:hidden absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand-200 blur-3xl anim-blob-slow" />

        <div className={`relative w-full max-w-md anim-slide-up ${shake ? 'anim-shake' : ''}`}>
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <span className="inline-grid place-items-center w-10 h-10 rounded-xl text-white shadow-md"
              style={{ backgroundImage: 'linear-gradient(135deg, #2a6da6 0%, #1A5DA0 50%, #133f6b 100%)' }}><Icon.Pin/></span>
            <span className="font-semibold text-slate-800">Attendance MVP</span>
          </div>

          <div className="glass rounded-3xl shadow-xl shadow-brand-900/5 border border-white/60 p-7 sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                <span className="gradient-text">Welcome back</span> 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1">Sign in to mark today's attendance.</p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="field">
                <span className="icon-left"><Icon.Mail/></span>
                <input id="email" type="email" required autoComplete="email" placeholder="Email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <label htmlFor="email" className="float">Email address</label>
              </div>

              <div className="field">
                <span className="icon-left"><Icon.Lock/></span>
                <input id="password" type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                  placeholder="Password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <label htmlFor="password" className="float">Password</label>
                <button type="button" className="icon-right" onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showPwd ? <Icon.EyeOff/> : <Icon.Eye/>}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                  <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" defaultChecked />
                  Stay signed in
                </label>
                <span className="text-slate-400">Forgot password?</span>
              </div>

              <button type="submit" disabled={loading}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-xl
                           px-4 py-3 text-sm font-semibold text-white
                           active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #2a6da6 0%, #1A5DA0 50%, #154d85 100%)',
                  border: '1px solid #1A5DA0',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.20) inset, 0 10px 24px -8px rgba(26,93,160,0.55)',
                }}>
                {loading ? (
                  <><span className="spinner"/><span>Signing in…</span></>
                ) : (
                  <><span>Sign in</span><Icon.Arrow className="transition-transform group-hover:translate-x-0.5"/></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200/70">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 text-center">Try a demo account</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button type="button" className="chip" onClick={() => fill('admin')}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"/> Admin
                </button>
                <button type="button" className="chip" onClick={() => fill('trainer')}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/> Trainer
                </button>
                <button type="button" className="chip" onClick={() => fill('student')}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Student
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Icon.Shield className="text-emerald-500"/>
            Your location is verified securely on every punch
          </p>
        </div>
      </main>
    </div>
  );
}
