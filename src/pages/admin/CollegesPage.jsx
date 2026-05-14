import { useState } from 'react';
import toast from 'react-hot-toast';
import { CollegeAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import { IconPlus, IconEdit, IconTrash, IconBuilding } from '../../components/common/Icon.jsx';
import { errorMessage } from '../../utils/errors.js';

const fetcher = async ({ page, limit, search }) => {
  const data = await CollegeAPI.list({ page, limit, search });
  if (Array.isArray(data)) return { items: data, total: data.length };
  return { items: data.items || [], total: data.total ?? (data.items || []).length };
};

function emptyForm() { return { name: '', code: '', address: '', isActive: true }; }

export default function CollegesPage() {
  const [modal, setModal] = useState({ open: false, form: emptyForm(), editingId: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      if (modal.editingId) await CollegeAPI.update(modal.editingId, modal.form);
      else await CollegeAPI.create(modal.form);
      toast.success(modal.editingId ? 'College updated' : 'College created');
      setModal({ open: false, form: emptyForm(), editingId: null });
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(errorMessage(e, 'Save failed'));
    } finally { setSaving(false); }
  };

  const onDisable = async (row) => {
    if (!confirm(`Disable "${row.name}"?`)) return;
    try {
      await CollegeAPI.disable(row.id);
      toast.success('Disabled');
      setReloadKey((k) => k + 1);
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
    { key: 'code', header: 'Code', render: (r) => <code className="text-xs px-1.5 py-0.5 bg-slate-100 rounded">{r.code}</code> },
    { key: 'address', header: 'Address', render: (r) => <span className="text-slate-600">{r.address || '—'}</span> },
    {
      key: 'isActive', header: 'Status',
      render: (r) => r.isActive
        ? <span className="badge-green">Active</span>
        : <span className="badge-red">Inactive</span>,
    },
    {
      key: '_actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={(e) => { e.stopPropagation(); setModal({ open: true, form: { name: r.name, code: r.code, address: r.address || '', isActive: r.isActive }, editingId: r.id }); }}>
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
        title="Colleges"
        subtitle="Manage colleges across the system"
        icon={IconBuilding}
        accent="brand"
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true, form: emptyForm(), editingId: null })}>
            <IconPlus size={16} /> Add College
          </button>
        }
      />
      <DataTable
        key={reloadKey}
        columns={columns}
        fetcher={fetcher}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.editingId ? 'Edit College' : 'Add College'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal({ ...modal, open: false })}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={modal.form.name} onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} />
          </div>
          <div>
            <label className="label">Code *</label>
            <input className="input" value={modal.form.code} onChange={(e) => setModal({ ...modal, form: { ...modal.form, code: e.target.value.toUpperCase() } })} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={modal.form.address} onChange={(e) => setModal({ ...modal, form: { ...modal.form, address: e.target.value } })} />
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
