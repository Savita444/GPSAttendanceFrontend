import dayjs from 'dayjs';
import { useMemo } from 'react';

/**
 * GitHub-style monthly attendance heatmap.
 * Props:
 *   data: [{ date: 'YYYY-MM-DD', count: number }]
 *   maxColor: hex / rgb of darkest cell (default brand)
 */
export default function HeatmapCalendar({ data, maxColor = '#1A5DA0', emptyColor = '#eef2f7' }) {
  const { rows, max, byDate } = useMemo(() => {
    const byDate = new Map((data || []).map((d) => [d.date, d.count]));
    const max = Math.max(1, ...((data || []).map((d) => d.count)));
    const today = dayjs();
    const start = today.subtract(29, 'day');

    // Build a 5-row x 7-col grid (Sun..Sat) over 30+leading-zero-pad days
    const cols = [];
    let cursor = start.startOf('week');
    while (cursor.isBefore(today) || cursor.isSame(today, 'day')) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const day = cursor.add(d, 'day');
        const dateStr = day.format('YYYY-MM-DD');
        const inWindow = !day.isBefore(start, 'day') && !day.isAfter(today, 'day');
        week.push({
          date: dateStr,
          inWindow,
          count: inWindow ? (byDate.get(dateStr) || 0) : null,
          isToday: day.isSame(today, 'day'),
          weekday: d,
          dayNum: day.date(),
        });
      }
      cols.push(week);
      cursor = cursor.add(7, 'day');
    }
    return { rows: cols, max, byDate };
  }, [data]);

  const cellColor = (count) => {
    if (count === null) return 'transparent';
    if (count === 0) return emptyColor;
    const t = Math.min(1, count / max);
    const opacity = 0.25 + t * 0.75;
    // mix maxColor with white via alpha — overlay on white background
    return `${maxColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1.5">
        {/* weekday legend */}
        <div className="flex flex-col gap-1.5 pt-5 pr-1.5 text-[10px] text-slate-400">
          <div></div>
          <div>Mon</div>
          <div></div>
          <div>Wed</div>
          <div></div>
          <div>Fri</div>
          <div></div>
        </div>

        {rows.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            <div className="h-4 text-[10px] text-slate-400 text-center">
              {week.find((d) => d.dayNum === 1)?.dayNum
                ? dayjs(week.find((d) => d.dayNum === 1).date).format('MMM')
                : ''}
            </div>
            {week.map((cell) => (
              <div
                key={cell.date}
                title={cell.inWindow ? `${cell.date}: ${cell.count} marks` : ''}
                className={[
                  'w-4 h-4 rounded-[3px] transition',
                  cell.isToday && cell.inWindow ? 'ring-2 ring-brand-600 ring-offset-1' : '',
                ].join(' ')}
                style={{
                  background: cellColor(cell.count),
                  opacity: cell.inWindow ? 1 : 0.15,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[3px]" style={{ background: emptyColor }} />
        <div className="w-3 h-3 rounded-[3px]" style={{ background: cellColor(max * 0.25) }} />
        <div className="w-3 h-3 rounded-[3px]" style={{ background: cellColor(max * 0.5) }} />
        <div className="w-3 h-3 rounded-[3px]" style={{ background: cellColor(max * 0.75) }} />
        <div className="w-3 h-3 rounded-[3px]" style={{ background: cellColor(max) }} />
        <span>More</span>
      </div>
    </div>
  );
}
