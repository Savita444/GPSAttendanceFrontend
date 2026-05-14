import { useState } from 'react';
import toast from 'react-hot-toast';
import { StudentMasterAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import { IconUpload, IconDownload } from '../../components/common/Icon.jsx';

const TEMPLATE = `full_name,mobile,roll_number,college_code,batch_code
Rahul Sharma,9876543210,CS001,KBT,BCA-2026
Priya Verma,9876543211,CS002,KBT,BCA-2026
`;

export default function BulkUploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const onPreview = async () => {
    if (!file) return toast.error('Choose a CSV first');
    setBusy(true);
    try {
      const data = await StudentMasterAPI.bulkPreview(file);
      setPreview(data);
      toast.success(`Preview: ${data.valid} valid / ${data.invalid} invalid`);
    } catch (e) { toast.error(e?.response?.data?.message || 'Preview failed'); }
    finally { setBusy(false); }
  };

  const onImport = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const data = await StudentMasterAPI.bulkImport(file);
      toast.success(`Imported ${data.inserted} / ${data.total}, skipped ${data.skipped}`);
      setPreview(null); setFile(null);
    } catch (e) { toast.error(e?.response?.data?.message || 'Import failed'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Bulk Student Upload"
        subtitle="Import students from CSV. Required columns: full_name, mobile, roll_number, college_code, batch_code"
        icon={IconUpload}
        accent="emerald"
        actions={
          <button className="btn-ghost flex items-center gap-2" onClick={downloadTemplate}>
            <IconDownload size={16} /> Download template
          </button>
        }
      />

      <div className="card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }}
            className="block text-sm"
          />
          <button className="btn-ghost flex items-center gap-2" disabled={!file || busy} onClick={onPreview}>
            <IconUpload size={16} /> {busy ? 'Working…' : 'Validate & Preview'}
          </button>
          <button className="btn-primary" disabled={!preview || preview.valid === 0 || busy} onClick={onImport}>
            Import {preview ? `${preview.valid} valid rows` : ''}
          </button>
        </div>
      </div>

      {preview && (
        <div className="card mt-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold text-slate-900">Preview</span>{' '}
              <span className="text-slate-500">
                · Total {preview.total} · <span className="text-emerald-600 font-semibold">{preview.valid} valid</span>
                {' · '}<span className="text-rose-600 font-semibold">{preview.invalid} invalid</span>
              </span>
            </div>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Row</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Mobile</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Roll</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">College</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Batch</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.rows.map((r) => (
                  <tr key={r.rowIndex} className={r.errors.length ? 'bg-rose-50/40' : ''}>
                    <td className="px-3 py-2 text-slate-500 text-xs">{r.rowIndex}</td>
                    <td className="px-3 py-2">{r.raw.full_name}</td>
                    <td className="px-3 py-2">{r.raw.mobile}</td>
                    <td className="px-3 py-2">{r.raw.roll_number}</td>
                    <td className="px-3 py-2">{r.raw.college_code}</td>
                    <td className="px-3 py-2">{r.raw.batch_code}</td>
                    <td className="px-3 py-2">
                      {r.errors.length ? (
                        <span className="text-rose-700 text-xs">{r.errors.join('; ')}</span>
                      ) : <span className="text-emerald-600 text-xs">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
