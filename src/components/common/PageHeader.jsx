export default function PageHeader({ title, subtitle, actions, icon: Icon, accent = 'brand' }) {
  const accentBg = {
    brand:   'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    violet:  'bg-violet-50 text-violet-700',
    rose:    'bg-rose-50 text-rose-700',
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${accentBg[accent] || accentBg.brand}`}>
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
