import dayjs from 'dayjs';

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Compact filter strip: Year ▢  Month ▢  From [date]  To [date]  [This week] [This month] [Clear]
 *
 * Props:
 *   value:    { year, month, from, to }
 *   onChange: (next) => void
 *   yearRange: [startYear, endYear?] (default: 2020..currentYear)
 *   mode:     'full' | 'compact' (compact hides quick buttons)
 */
export default function DateRangeFilter({ value, onChange, yearRange, mode = 'full' }) {
  const v = value || {};
  const setField = (key, val) => onChange({ ...v, [key]: val || '' });

  const currentYear = dayjs().year();
  const startYear = yearRange?.[0] ?? 2020;
  const endYear = yearRange?.[1] ?? currentYear;
  const years = [];
  for (let y = endYear; y >= startYear; y--) years.push(y);

  const setQuick = (preset) => {
    if (preset === 'today') {
      const t = dayjs().format('YYYY-MM-DD');
      onChange({ year: '', month: '', from: t, to: t });
    } else if (preset === 'week') {
      onChange({
        year: '', month: '',
        from: dayjs().startOf('week').format('YYYY-MM-DD'),
        to: dayjs().endOf('week').format('YYYY-MM-DD'),
      });
    } else if (preset === 'month') {
      onChange({ year: currentYear, month: dayjs().month() + 1, from: '', to: '' });
    } else if (preset === 'clear') {
      onChange({ year: '', month: '', from: '', to: '' });
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Year</label>
        <select
          className="input"
          style={{ width: 110 }}
          value={v.year || ''}
          onChange={(e) => setField('year', e.target.value)}
        >
          <option value="">Any</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Month</label>
        <select
          className="input"
          style={{ width: 130 }}
          value={v.month || ''}
          onChange={(e) => setField('month', e.target.value)}
        >
          <option value="">Any</option>
          {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">From</label>
        <input
          type="date"
          className="input"
          style={{ width: 150 }}
          value={v.from || ''}
          onChange={(e) => setField('from', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">To</label>
        <input
          type="date"
          className="input"
          style={{ width: 150 }}
          value={v.to || ''}
          onChange={(e) => setField('to', e.target.value)}
        />
      </div>
      {mode === 'full' && (
        <div className="flex items-center gap-1">
          <button type="button" className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => setQuick('today')}>Today</button>
          <button type="button" className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => setQuick('week')}>This week</button>
          <button type="button" className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200" onClick={() => setQuick('month')}>This month</button>
          <button type="button" className="px-2.5 py-1.5 text-xs rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" onClick={() => setQuick('clear')}>Clear</button>
        </div>
      )}
    </div>
  );
}
