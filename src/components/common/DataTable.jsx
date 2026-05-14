import { useEffect, useState } from 'react';
import { IconSearch, IconChevronLeft, IconChevronRight } from './Icon.jsx';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS } from '../../utils/config.js';

const PAGE_SIZES = PAGE_SIZE_OPTIONS;

export default function DataTable({
  columns,
  fetcher,
  filters,
  pageSize = DEFAULT_PAGE_SIZE,
  rowKey = (r) => r.id,
  onRowClick,
  actions,
  searchable = true,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No records yet',
  emptyHint,
  stickyHeader = true,
  rowClassName,
}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced, JSON.stringify(filters || {}), limit]);

  useEffect(() => {
    let abort = false;
    setLoading(true);
    setError(null);
    fetcher({ page, limit, search: debounced, filters: filters || {} })
      .then((res) => {
        if (abort) return;
        setData({ items: res.items || [], total: res.total ?? (res.items || []).length });
      })
      .catch((err) => {
        if (!abort) setError(err?.response?.data?.message || err.message || 'Failed to load');
      })
      .finally(() => { if (!abort) setLoading(false); });
    return () => { abort = true; };
  }, [page, limit, debounced, JSON.stringify(filters || {})]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / limit));
  const from = data.total === 0 ? 0 : (page - 1) * limit + 1;
  const to   = Math.min(page * limit, data.total || 0);

  // Build a compact pagination list with ellipses, e.g. [1, '…', 4, 5, 6, '…', 20]
  function pageList() {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push('…');
      const start = Math.max(2, page - 1);
      const end   = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 3) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/70"
           style={{ background: 'linear-gradient(180deg, #fafbfc 0%, #f4f6f9 100%)' }}>
        {searchable ? (
          <div className="relative flex-1 max-w-md">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 pr-9 bg-white"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-1.5 py-0.5 rounded hover:bg-slate-100"
                title="Clear"
              >✕</button>
            )}
          </div>
        ) : <div />}
        <div className="flex items-center gap-2 flex-wrap">
          {data.total > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold ring-1 ring-brand-200/60">
              {data.total.toLocaleString()} total
            </span>
          )}
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className={[
              'text-slate-500 border-b border-slate-200/70',
              stickyHeader ? 'sticky top-0 z-10' : '',
            ].join(' ')}
            style={{ background: 'linear-gradient(180deg, #fbfcfe 0%, #f5f7fa 100%)' }}
          >
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={[
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  ].join(' ')}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && Array.from({ length: Math.min(8, limit) }).map((_, i) => (
              <tr key={`sk-${i}`}>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3.5">
                    <div className="h-3 rounded bg-slate-200/70 animate-pulse" style={{ width: `${30 + (i * 13) % 60}%` }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && error && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="inline-flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 text-xl">!</div>
                    <div className="text-rose-700 text-sm font-medium">{error}</div>
                    <div className="text-xs text-slate-400 mt-1">Check that the API is running and refresh.</div>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && data.items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="inline-flex flex-col items-center gap-2.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                      <IconSearch size={22} />
                    </div>
                    <div className="text-slate-700 font-semibold">{emptyMessage}</div>
                    {emptyHint && <div className="text-xs text-slate-400 max-w-sm">{emptyHint}</div>}
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && data.items.map((row, idx) => (
              <tr
                key={rowKey(row)}
                className={[
                  'group transition-colors',
                  onRowClick ? 'cursor-pointer' : '',
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                  'hover:!bg-brand-50/50',
                  typeof rowClassName === 'function' ? rowClassName(row) : '',
                ].join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={[
                      'px-4 py-3 align-middle text-sm text-slate-700',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    ].join(' ')}
                  >
                    {c.render ? c.render(row) : (row[c.key] ?? <span className="text-slate-300">—</span>)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/70 bg-slate-50/40 text-xs">
        <div className="flex items-center gap-3 text-slate-600">
          {data.total ? (
            <span>Showing <span className="font-semibold text-slate-900">{from.toLocaleString()}–{to.toLocaleString()}</span> of <span className="font-semibold text-slate-900">{data.total.toLocaleString()}</span></span>
          ) : <span className="text-slate-400">—</span>}
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">·</span>
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 rounded-md border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Previous"
          >
            <IconChevronLeft size={16} />
          </button>
          <div className="hidden md:flex items-center gap-1">
            {pageList().map((p, i) => (
              p === '…' ? (
                <span key={`e-${i}`} className="px-2 text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    'min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition',
                    p === page
                      ? 'text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                  style={p === page ? { backgroundImage: 'linear-gradient(180deg, #2a6da6 0%, #1A5DA0 100%)' } : undefined}
                >
                  {p}
                </button>
              )
            ))}
          </div>
          <div className="md:hidden px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">
            {page} <span className="text-slate-400 font-normal">/ {totalPages}</span>
          </div>
          <button
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            title="Next"
          >
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
