import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { StudentMasterAPI, CollegeAPI, BatchAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import { IconPlus, IconEdit, IconTrash, IconUsers } from '../../components/common/Icon.jsx';
import ExportButton from '../../components/common/ExportButton.jsx';

function emptyForm() {
  return { fullName: '', mobile: '', rollNumber: '', collegeId: '', batchId: '', email: '', gender: '', isActive: true };
}

export default function StudentsPage() {
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ collegeId: '', batchId: '' });
  const [modal, setModal] = useState({ open: false, form: emptyForm(), editingId: null });
  const [modalBatches, setModalBatches] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CollegeAPI.list({ active: true }).then((d) => setColleges(Array.isArray(d) ? d : d.items || []));
    BatchAPI.list({ active: true }).then((d) => setBatches(Array.isArray(d) ? d : d.items || []));
  }, []);

  useEffect(() => {
    if (!modal.form.collegeId) { setModalBatches([]); return; }
    BatchAPI.list({ collegeId: modal.form.collegeId, active: true })
      .then((d) => setModalBatches(Array.isArray(d) ? d : d.items || []))
      .catch(() => setModalBatches([]));
  }, [modal.form.collegeId]);

  const fetcher = async ({ page, limit, search, filters }) => {
    const data = await StudentMasterAPI.list({
      page, limit, search,
      collegeId: filters.collegeId || undefined,
      batchId: filters.batchId || undefined,
    });
    return { items: data.items || [], total: data.total || 0 };
  };

  const onSave = async () => {
    if (!modal.form.fullName || !modal.form.mobile || !modal.form.rollNumber || !modal.form.collegeId || !modal.form.batchId) {
      return toast.error('All required fields must be filled');
    }
    setSaving(true);
    try {
      if (modal.editingId) await StudentMasterAPI.update(modal.editingId, modal.form);
      else await StudentMasterAPI.create(modal.form);
      toast.success(modal.editingId ? 'Student updated' : 'Student added');
      setModal({ open: false, form: emptyForm(), editingId: null });
      setReloadKey((k) => k + 1);
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const onDisable = async (row) => {
    if (!confirm(`Disable "${row.fullName}"?`)) return;
    try { await StudentMasterAPI.disable(row.id); toast.success('Disabled'); setReloadKey((k) => k + 1); }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const filteredBatches = filters.collegeId ? batches.filter((b) => b.collegeId === filters.collegeId) : batches;

  const columns = [
    { key: 'rollNumber', header: 'Roll No', width: 100, render: (r) => <code className="text-xs px-1.5 py-0.5 bg-slate-100 rounded">{r.rollNumber}</code> },
    { key: 'fullName', header: 'Name', render: (r) => <span className="font-semibold text-slate-900">{r.fullName}</span> },
    { key: 'mobile', header: 'Mobile' },
    { key: 'college', header: 'College', render: (r) => r.college?.name || '—' },
    { key: 'batch', header: 'Batch', render: (r) => r.batch?.name || '—' },
    {
      key: 'isActive', header: 'Status',
      render: (r) => r.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>,
    },
    {
      key: '_actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={() => setModal({ open: true, form: {
              fullName: r.fullName, mobile: r.mobile, rollNumber: r.rollNumber,
              collegeId: r.collegeId, batchId: r.batchId, email: r.email || '',
              gender: r.gender || '', isActive: r.isActive,
            }, editingId: r.id })}>
            <IconEdit size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600" onClick={() => onDisable(r)}>
            <IconTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Add, search and manage students across colleges and batches"
        icon={IconUsers}
        accent="emerald"
        actions={
          <>
            <select className="input" style={{ width: 200 }} value={filters.collegeId}
              onChange={(e) => setFilters({ collegeId: e.target.value, batchId: '' })}>
              <option value="">All colleges</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" style={{ width: 200 }} value={filters.batchId}
              onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}>
              <option value="">All batches</option>
              {filteredBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ExportButton
              url="/students/export"
              filename="students"
              filters={filters}
              label="Export"
            />
            <button className="btn-primary flex items-center gap-2"
              onClick={() => setModal({ open: true, form: emptyForm(), editingId: null })}>
              <IconPlus size={16} /> Add Student
            </button>
          </>
        }
      />

      <DataTable key={reloadKey} columns={columns} fetcher={fetcher} filters={filters} pageSize={25} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.editingId ? 'Edit Student' : 'Add Student'}
        size="lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal({ ...modal, open: false })}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Full Name *</label>
            <input className="input" value={modal.form.fullName}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, fullName: e.target.value } })} />
          </div>
          <div>
            <label className="label">Mobile *</label>
            <input className="input" value={modal.form.mobile}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, mobile: e.target.value } })} />
          </div>
          <div>
            <label className="label">Roll Number *</label>
            <input className="input" value={modal.form.rollNumber}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, rollNumber: e.target.value } })} />
          </div>
          <div>
            <label className="label">College *</label>
            <select className="input" value={modal.form.collegeId}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, collegeId: e.target.value, batchId: '' } })}>
              <option value="">Select college…</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch *</label>
            <select className="input" value={modal.form.batchId} disabled={!modal.form.collegeId}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, batchId: e.target.value } })}>
              <option value="">Select batch…</option>
              {modalBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={modal.form.email}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={modal.form.gender}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, gender: e.target.value } })}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}
