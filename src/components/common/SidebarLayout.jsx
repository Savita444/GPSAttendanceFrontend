import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../../store/slices/auth.js';
import { normalizeRole, roleLabel } from '../../utils/roles.js';
import {
  IconDashboard, IconBuilding, IconLayers, IconUsers, IconUpload,
  IconClipboard, IconMail, IconCalendar, IconLogout, IconMenu, IconX,
  IconLocation, IconHistory,
} from './Icon.jsx';

const NAV = {
  admin: [
    { section: 'Overview', items: [
      { to: '/admin', label: 'Dashboard', icon: IconDashboard, end: true },
    ]},
    { section: 'Masters', items: [
      { to: '/admin/colleges', label: 'Colleges', icon: IconBuilding },
      { to: '/admin/batches', label: 'Batches', icon: IconLayers },
      { to: '/admin/trainers', label: 'Trainers', icon: IconUsers },
      { to: '/admin/students', label: 'Students', icon: IconUsers },
      { to: '/admin/students/bulk-upload', label: 'Bulk Upload', icon: IconUpload },
    ]},
    { section: 'Attendance', items: [
      { to: '/admin/attendance', label: 'Records', icon: IconCalendar },
      { to: '/admin/reports', label: 'Reports', icon: IconClipboard },
    ]},
    { section: 'Configuration', items: [
      { to: '/admin/staff-contacts', label: 'Staff Contacts', icon: IconMail },
      { to: '/admin/settings', label: 'GPS & Rules', icon: IconLocation },
      { to: '/admin/login-history', label: 'Login History', icon: IconHistory },
    ]},
  ],
  trainer: [
    { section: 'Workspace', items: [
      { to: '/trainer', label: 'Dashboard', icon: IconDashboard, end: true },
      { to: '/trainer/students', label: 'My Students', icon: IconUsers },
      { to: '/trainer/attendance', label: 'Attendance', icon: IconCalendar },
      { to: '/trainer/reports', label: 'Reports', icon: IconClipboard },
    ]},
  ],
  user: [
    { section: 'Today', items: [
      { to: '/user', label: 'Dashboard', icon: IconDashboard, end: true },
      { to: '/user/mark', label: 'Mark Attendance', icon: IconLocation },
    ]},
    { section: 'You', items: [
      { to: '/user/history', label: 'History', icon: IconCalendar },
    ]},
  ],
};

function pathTitle(pathname) {
  const last = pathname.split('/').filter(Boolean).slice(-1)[0] || 'Home';
  return last.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function Crumbs({ pathname }) {
  const parts = pathname.split('/').filter(Boolean);
  return (
    <nav className="hidden md:flex items-center gap-1 text-sm text-slate-500">
      <Link to="/" className="hover:text-brand-700">Home</Link>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-slate-300">/</span>
          <span className={i === parts.length - 1 ? 'text-slate-900 font-semibold' : 'capitalize'}>
            {p.replace(/-/g, ' ')}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function SidebarLayout() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const role = normalizeRole(user?.role);
  const sections = NAV[role] || [];

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => { localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (!e.target.closest('[data-user-menu]')) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const onLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const initial = (user?.name || user?.fullName || '?').slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen flex">
      {/* ===== Sidebar (desktop) ===== */}
      <aside
        className={[
          'hidden md:flex flex-col sidebar-dark transition-all duration-200',
          collapsed ? 'w-[72px]' : 'w-64',
        ].join(' ')}
      >
        {/* Brand */}
        <div
          className={['h-16 flex items-center px-3 border-b border-white/5', collapsed ? 'justify-center' : 'justify-between'].join(' ')}
        >
          {!collapsed ? (
            <Link to="/" className="flex items-center gap-2.5 truncate">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-glow-brand"
                style={{ backgroundImage: 'linear-gradient(135deg, #2a6da6 0%, #1A5DA0 50%, #133f6b 100%)' }}
              >
                A
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white text-[15px]">Attendance</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(203,213,225,0.55)' }}>MVP · v1.0</div>
              </div>
            </Link>
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-glow-brand"
              style={{ backgroundImage: 'linear-gradient(135deg, #2a6da6 0%, #1A5DA0 50%, #133f6b 100%)' }}
            >A</div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              title="Collapse"
            >
              <IconMenu size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto pb-3">
          {sections.map((section, si) => (
            <div key={section.section}>
              {!collapsed && <div className="sidebar-section-label">{section.section}</div>}
              {collapsed && si > 0 && <div className="mx-3 my-2 border-t border-white/5" />}
              {section.items.map(({ to, label, icon: Ic, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      'sidebar-item',
                      collapsed && 'justify-center !px-2',
                      isActive && 'sidebar-item-active',
                    ].filter(Boolean).join(' ')
                  }
                  title={label}
                >
                  <Ic size={18} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse handle when collapsed */}
        {collapsed && (
          <div className="px-2 py-2 border-t border-white/5">
            <button
              onClick={() => setCollapsed(false)}
              className="w-full p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex justify-center"
              title="Expand"
            >
              <IconMenu size={16} />
            </button>
          </div>
        )}

        {/* User card */}
        <div className="border-t border-white/5 p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl"
                 style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(26,93,160,0.20))', border: '1px solid rgba(164,194,221,0.30)' }}>
              <div className="w-9 h-9 rounded-full text-white font-semibold flex items-center justify-center"
                   style={{ backgroundImage: 'linear-gradient(135deg, #2a6da6 0%, #1A5DA0 100%)' }}>
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user?.name || user?.fullName}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(203,213,225,0.65)' }}>{roleLabel(user?.role)}</div>
              </div>
              <button onClick={onLogout} className="p-2 rounded-lg hover:bg-rose-500/15 text-rose-300 hover:text-rose-200" title="Logout">
                <IconLogout size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onLogout} className="w-full p-2 rounded-lg hover:bg-rose-500/15 text-rose-300 hover:text-rose-200 flex justify-center" title="Logout">
              <IconLogout size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* ===== Mobile drawer ===== */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 sidebar-dark shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-3 border-b border-white/5">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                     style={{ backgroundImage: 'linear-gradient(135deg, #2a6da6 0%, #1A5DA0 50%, #133f6b 100%)' }}>A</div>
                <div className="leading-tight">
                  <div className="font-bold text-white text-[15px]">Attendance</div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(203,213,225,0.55)' }}>MVP</div>
                </div>
              </Link>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300"><IconX size={18} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto pb-3">
              {sections.map((section) => (
                <div key={section.section}>
                  <div className="sidebar-section-label">{section.section}</div>
                  {section.items.map(({ to, label, icon: Ic, end }) => (
                    <NavLink key={to} to={to} end={end} className={({ isActive }) => ['sidebar-item', isActive && 'sidebar-item-active'].filter(Boolean).join(' ')}>
                      <Ic size={18} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
            <div className="border-t border-white/5 p-3">
              <button onClick={onLogout} className="w-full p-2 rounded-lg hover:bg-rose-500/15 text-rose-300 hover:text-rose-200 flex items-center justify-center gap-2 text-sm">
                <IconLogout size={16} /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ===== Main area ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/80 glass border-b border-slate-200/70 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-slate-100"><IconMenu size={20} /></button>
            <div className="hidden md:flex flex-col">
              <div className="text-[11px] uppercase tracking-widest text-slate-400">{roleLabel(user?.role)} workspace</div>
              <Crumbs pathname={location.pathname} />
            </div>
            <div className="md:hidden font-semibold text-slate-900">{pathTitle(location.pathname)}</div>
          </div>

          <div className="relative" data-user-menu>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-3 px-1.5 py-1 rounded-xl hover:bg-slate-100 transition"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <div className="text-sm font-semibold text-slate-900">{user?.name || user?.fullName}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{user?.email || ''}</div>
              </div>
              <div className="w-9 h-9 rounded-full text-white font-semibold flex items-center justify-center"
                   style={{ backgroundImage: 'linear-gradient(135deg, #2a6da6 0%, #1A5DA0 100%)', boxShadow: '0 6px 16px -6px rgba(26,93,160,0.55)' }}>
                {initial}
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                className={['text-slate-400 transition-transform', menuOpen && 'rotate-180'].filter(Boolean).join(' ')}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-40"
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full text-white font-semibold flex items-center justify-center shrink-0"
                       style={{ backgroundImage: 'linear-gradient(135deg, #2a6da6 0%, #1A5DA0 100%)' }}>
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{user?.name || user?.fullName}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{roleLabel(user?.role)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                >
                  <IconLogout size={16} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="text-center text-[11px] text-slate-400 py-4">
          &copy; {new Date().getFullYear()} Attendance MVP · built for scale
        </footer>
      </div>
    </div>
  );
}
