import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../../store/slices/auth.js';

const navByRole = {
  student: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/daily-work', label: 'Daily Work' },
    { to: '/student/reviews', label: 'My Reviews' },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard' },
    { to: '/teacher/reviews', label: 'Reviews' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/login-history', label: 'Login History' },
  ],
};

export default function AppLayout() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = navByRole[user?.role] || [];

  const onLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-brand-700">Internship Attendance</Link>
          <nav className="hidden md:flex gap-1">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-[11px] uppercase text-slate-500">{user?.role}</div>
            </div>
            <button onClick={onLogout} className="btn-ghost">Logout</button>
          </div>
        </div>
        <nav className="md:hidden flex overflow-x-auto px-4 pb-2 gap-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end
              className={({ isActive }) =>
                `px-3 py-1 whitespace-nowrap rounded-lg text-sm ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-slate-500 py-4">
        &copy; {new Date().getFullYear()} Internship Cell
      </footer>
    </div>
  );
}
