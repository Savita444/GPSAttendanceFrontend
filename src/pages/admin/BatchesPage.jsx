import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BatchAPI, CollegeAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import { IconPlus, IconEdit, IconTrash, IconLayers } from '../../components/common/Icon.jsx';

function emptyForm() { return { name: '', code: '', startYear: '', endYear: '', collegeId: '', isActive: true }; }

export default function BatchesPage() {
  const [colleges, setColleges] = useState([]);
  const [filterCollege, setFilterCollege] = useState('');
  const [modal, setModal] = useState({ open: false, form: emptyForm(), editingId: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CollegeAPI.list({ active: true }).then((d) => setColleges(Array.isArray(d) ? d : d.items || [])).catch(() => {});
  }, []);

  const fetcher = async ({ page, limit, search, filters }) => {
    const data = await BatchAPI.list({
      page, limit, search,
      collegeId: filters.collegeId || undefined,
      year: filters.year || undefined,
    });
    if (Array.isArray(data)) return { items: data, total: data.length };
    return { items: data.items || [], total: data.total ?? (data.items || []).length };
  };

  const onSave = async () => {
    if (!modal.form.collegeId) return toast.error('College is required');
    setSaving(true);
    try {
      const payload = {
        ...modal.form,
        startYear: modal.form.startYear ? Number(modal.form.startYear) : null,
        endYear: modal.form.endYear ? Number(modal.form.endYear) : null,
      };
      if (modal.editingId) await BatchAPI.update(modal.editingId, payload);
      else await BatchAPI.create(payload);
      toast.success(modal.editingId ? 'Batch updated' : 'Batch created');
      setModal({ open: false, form: emptyForm(), editingId: null });
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const onDisable = async (row) => {
    if (!confirm(`Disable "${row.name}"?`)) return;
    try {
      await BatchAPI.disable(row.id);
      toast.success('Disabled');
      setReloadKey((k) => k + 1);
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const columns = [
    { key: 'name', header: 'Batch', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
    { key: 'code', header: 'Code', render: (r) => <code className="text-xs px-1.5 py-0.5 bg-slate-100 rounded">{r.code}</code> },
    { key: 'college', header: 'College', render: (r) => r.college?.name || '—' },
    { key: 'years', header: 'Years', render: (r) => `${r.startYear || '—'} – ${r.endYear || '—'}` },
    { key: 'isActive', header: 'Status', render: (r) => r.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span> },
    {
      key: '_actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={(e) => { e.stopPropagation(); setModal({ open: true, form: { name: r.name, code: r.code, startYear: r.startYear || '', endYear: r.endYear || '', collegeId: r.collegeId, isActive: r.isActive }, editingId: r.id }); }}>
            <IconEdit size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
            onClick={(e) => { e.stopPropagation(); onDisable(r); }}>
            <IconTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Batches"
        subtitle="Manage batches under each college"
        icon={IconLayers}
        accent="violet"
        actions={
          <>
            <select className="input" style={{ width: 220 }} value={filterCollege} onChange={(e) => setFilterCollege(e.target.value)}>
              <option value="">All colleges</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true, form: emptyForm(), editingId: null })}>
              <IconPlus size={16} /> Add Batch
            </button>
          </>
        }
      />
      <DataTable
        key={reloadKey}
        columns={columns}
        fetcher={fetcher}
        filters={{ collegeId: filterCollege }}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.editingId ? 'Edit Batch' : 'Add Batch'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal({ ...modal, open: false })}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">College *</label>
            <select className="input" value={modal.form.collegeId} onChange={(e) => setModal({ ...modal, form: { ...modal.form, collegeId: e.target.value } })}>
              <option value="">Select college…</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={modal.form.name} onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} />
            </div>
            <div>
              <label className="label">Code *</label>
              <input className="input" value={modal.form.code} onChange={(e) => setModal({ ...modal, form: { ...modal.form, code: e.target.value.toUpperCase() } })} />
            </div>
            <div>
              <label className="label">Start Year</label>
              <input type="number" className="input" value={modal.form.startYear} onChange={(e) => setModal({ ...modal, form: { ...modal.form, startYear: e.target.value } })} />
            </div>
            <div>
              <label className="label">End Year</label>
              <input type="number" className="input" value={modal.form.endYear} onChange={(e) => setModal({ ...modal, form: { ...modal.form, endYear: e.target.value } })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={modal.form.isActive} onChange={(e) => setModal({ ...modal, form: { ...modal.form, isActive: e.target.checked } })} />
            Active
          </label>
        </div>
      </Modal>
    </>
  );
}
