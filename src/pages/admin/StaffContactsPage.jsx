import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { StaffContactAPI, CollegeAPI, BatchAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import { IconPlus, IconEdit, IconTrash, IconMail } from '../../components/common/Icon.jsx';

function emptyForm() { return { name: '', email: '', mobile: '', collegeId: '', batchId: '', emailEnabled: true, isActive: true }; }

export default function StaffContactsPage() {
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [modal, setModal] = useState({ open: false, form: emptyForm(), editingId: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CollegeAPI.list({ active: true }).then((d) => setColleges(Array.isArray(d) ? d : d.items || []));
    BatchAPI.list({ active: true }).then((d) => setBatches(Array.isArray(d) ? d : d.items || []));
  }, []);

  const fetcher = async ({ page, limit, search }) => {
    const data = await StaffContactAPI.list({ page, limit, search });
    if (Array.isArray(data)) return { items: data, total: data.length };
    return { items: data.items || [], total: data.total ?? (data.items || []).length };
  };

  const onSave = async () => {
    if (!modal.form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      const payload = { ...modal.form, collegeId: modal.form.collegeId || null, batchId: modal.form.batchId || null };
      if (modal.editingId) await StaffContactAPI.update(modal.editingId, payload);
      else await StaffContactAPI.create(payload);
      toast.success('Saved');
      setModal({ open: false, form: emptyForm(), editingId: null });
      setReloadKey((k) => k + 1);
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const onRemove = async (row) => {
    if (!confirm(`Delete "${row.name}"?`)) return;
    try { await StaffContactAPI.remove(row.id); toast.success('Deleted'); setReloadKey((k) => k + 1); }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    { key: 'college', header: 'College', render: (r) => r.college?.name || '—' },
    { key: 'batch', header: 'Batch', render: (r) => r.batch?.name || '—' },
    { key: 'emailEnabled', header: 'Mail', render: (r) => r.emailEnabled ? <span className="badge-green">On</span> : <span className="badge-red">Off</span> },
    {
      key: '_actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" onClick={() => setModal({ open: true, form: {
            name: r.name, email: r.email || '', mobile: r.mobile || '',
            collegeId: r.collegeId || '', batchId: r.batchId || '',
            emailEnabled: r.emailEnabled, isActive: r.isActive,
          }, editingId: r.id })}>
            <IconEdit size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600" onClick={() => onRemove(r)}>
            <IconTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  const modalBatches = modal.form.collegeId ? batches.filter((b) => b.collegeId === modal.form.collegeId) : batches;

  return (
    <>
      <PageHeader
        title="Staff Contacts"
        subtitle="Recipients for weekly attendance reports (no login required)"
        icon={IconMail}
        accent="rose"
        actions={
          <button className="btn-primary flex items-center gap-2" onClick={() => setModal({ open: true, form: emptyForm(), editingId: null })}>
            <IconPlus size={16} /> Add Contact
          </button>
        }
      />
      <DataTable key={reloadKey} columns={columns} fetcher={fetcher} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.editingId ? 'Edit Staff Contact' : 'Add Staff Contact'}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input className="input" value={modal.form.email} onChange={(e) => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} />
            </div>
            <div>
              <label className="label">Mobile</label>
              <input className="input" value={modal.form.mobile} onChange={(e) => setModal({ ...modal, form: { ...modal.form, mobile: e.target.value } })} />
            </div>
            <div>
              <label className="label">College</label>
              <select className="input" value={modal.form.collegeId} onChange={(e) => setModal({ ...modal, form: { ...modal.form, collegeId: e.target.value, batchId: '' } })}>
                <option value="">— Any —</option>
                {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Batch</label>
              <select className="input" value={modal.form.batchId} disabled={!modal.form.collegeId} onChange={(e) => setModal({ ...modal, form: { ...modal.form, batchId: e.target.value } })}>
                <option value="">— Any —</option>
                {modalBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={modal.form.emailEnabled} onChange={(e) => setModal({ ...modal, form: { ...modal.form, emailEnabled: e.target.checked } })} />
            Receive emails
          </label>
        </div>
      </Modal>
    </>
  );
}
