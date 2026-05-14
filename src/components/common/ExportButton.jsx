import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { IconDownload } from './Icon.jsx';

/**
 * Reusable Export dropdown. Hits an endpoint that returns a CSV or PDF buffer
 * and triggers a browser download.
 *
 * Props:
 *   url:       string  — e.g. '/reports/export'   (passed to axios baseURL '/api')
 *   filename:  string  — base name (no extension)
 *   filters:   object  — extra query params appended to the request
 *   formats:   ['csv','pdf']  default both
 *   label:     button label   default 'Export'
 */
export default function ExportButton({
  url,
  filename = 'export',
  filters = {},
  formats = ['csv', 'pdf'],
  label = 'Export',
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // 'csv' | 'pdf' | null
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const doExport = async (format) => {
    setBusy(format);
    setOpen(false);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      );
      const res = await api.get(url, {
        params: { ...cleanFilters, format },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8',
      });
      const link = document.createElement('a');
      const obj = URL.createObjectURL(blob);
      link.href = obj;
      link.download = `${filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(obj);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (e) {
      toast.error(e?.response?.data?.message || `Export ${format.toUpperCase()} failed`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="btn-ghost flex items-center gap-2"
        disabled={busy !== null}
        onClick={() => setOpen((v) => !v)}
      >
        <IconDownload size={16} /> {busy ? `Exporting ${busy.toUpperCase()}…` : label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
             className={['transition-transform', open && 'rotate-180'].filter(Boolean).join(' ')}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden z-30">
          {formats.includes('csv') && (
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
              onClick={() => doExport('csv')}
            >
              <span className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold ring-1 ring-emerald-200">CSV</span>
              <div className="text-left">
                <div className="font-medium">CSV (Excel)</div>
                <div className="text-[10px] text-slate-400">.csv · open in Excel</div>
              </div>
            </button>
          )}
          {formats.includes('pdf') && (
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition border-t border-slate-100"
              onClick={() => doExport('pdf')}
            >
              <span className="w-7 h-7 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center text-[10px] font-bold ring-1 ring-rose-200">PDF</span>
              <div className="text-left">
                <div className="font-medium">PDF document</div>
                <div className="text-[10px] text-slate-400">.pdf · landscape · printable</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
