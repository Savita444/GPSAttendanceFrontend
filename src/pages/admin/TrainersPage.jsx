import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { UserMvpAPI, BatchAPI, CollegeAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import { IconPlus, IconEdit, IconTrash, IconUsers } from '../../components/common/Icon.jsx';
import { errorMessage } from '../../utils/errors.js';

function emptyForm() {
  return { name: '', email: '', password: '', phone: '', batchIds: [], isActive: true };
}

export default function TrainersPage() {
  const [allBatches, setAllBatches] = useState([]);
  const [allColleges, setAllColleges] = useState([]);
  const [modal, setModal] = useState({ open: false, form: emptyForm(), editingId: null });
  const [batchFilter, setBatchFilter] = useState({ college: '', search: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    BatchAPI.list({ active: true, limit: 500 })
      .then((d) => setAllBatches(Array.isArray(d) ? d : d.items || []))
      .catch(() => {});
    CollegeAPI.list({ active: true, limit: 500 })
      .then((d) => setAllColleges(Array.isArray(d) ? d : d.items || []))
      .catch(() => {});
  }, []);

  const fetcher = async ({ page, limit, search }) => {
    const data = await UserMvpAPI.list({ page, limit, search, role: 'trainer' });
    if (Array.isArray(data)) return { items: data, total: data.length };
    return { items: data.items || [], total: data.total ?? (data.items || []).length };
  };

  const onSave = async () => {
    if (!modal.form.name || !modal.form.email) return toast.error('Name and email are required');
    if (!modal.editingId && !modal.form.password) return toast.error('Password is required for new trainers');
    if (modal.form.batchIds.length === 0) return toast.error('Assign at least one batch');

    setSaving(true);
    try {
      const payload = {
        name: modal.form.name,
        email: modal.form.email,
        phone: modal.form.phone || null,
        isActive: modal.form.isActive,
        role: 'trainer',
        batchIds: modal.form.batchIds,
      };
      if (modal.form.password) payload.password = modal.form.password;

      if (modal.editingId) {
        await UserMvpAPI.update(modal.editingId, payload);
        toast.success('Trainer updated');
      } else {
        await UserMvpAPI.create(payload);
        toast.success('Trainer added — they can now log in');
      }
      setModal({ open: false, form: emptyForm(), editingId: null });
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(errorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const onDisable = async (row) => {
    if (!confirm(`Disable trainer "${row.name}"? They won't be able to log in.`)) return;
    try {
      await UserMvpAPI.disable(row.id);
      toast.success('Trainer disabled');
      setReloadKey((k) => k + 1);
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const onEdit = (r) => {
    setModal({
      open: true,
      form: {
        name: r.name,
        email: r.email,
        password: '',
        phone: r.phone || '',
        batchIds: (r.batches || []).map((b) => b.id),
        isActive: r.isActive,
      },
      editingId: r.id,
    });
  };

  // Group batches by college for the multi-select picker
  const grouped = useMemo(() => {
    const byCollege = new Map();
    for (const b of allBatches) {
      const cid = b.collegeId;
      if (!byCollege.has(cid)) byCollege.set(cid, []);
      byCollege.get(cid).push(b);
    }
    return Array.from(byCollege.entries()).map(([cid, batches]) => ({
      college: allColleges.find((c) => c.id === cid) || { id: cid, name: 'Unknown college' },
      batches,
    }));
  }, [allBatches, allColleges]);

  const filteredGrouped = useMemo(() => {
    return grouped
      .filter((g) => !batchFilter.college || g.college.id === batchFilter.college)
      .map((g) => ({
        ...g,
        batches: g.batches.filter((b) =>
          !batchFilter.search ||
          b.name.toLowerCase().includes(batchFilter.search.toLowerCase()) ||
          b.code.toLowerCase().includes(batchFilter.search.toLowerCase())
        ),
      }))
      .filter((g) => g.batches.length > 0);
  }, [grouped, batchFilter]);

  const toggleBatch = (id) => {
    const current = new Set(modal.form.batchIds);
    if (current.has(id)) current.delete(id); else current.add(id);
    setModal({ ...modal, form: { ...modal.form, batchIds: Array.from(current) } });
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
    {
      key: 'batches', header: 'Assigned Batches',
      render: (r) => {
        const list = r.batches || [];
        if (list.length === 0) return <span className="text-slate-400 text-xs">— none —</span>;
        const shown = list.slice(0, 3);
        return (
          <div className="flex flex-wrap gap-1">
            {shown.map((b) => (
              <span key={b.id} className="badge-blue" title={b.name}>{b.code}</span>
            ))}
            {list.length > 3 && <span className="text-xs text-slate-500">+{list.length - 3} more</span>}
          </div>
        );
      },
    },
    {
      key: 'isActive', header: 'Status',
      render: (r) => r.isActive
        ? <span className="badge-green">Active</span>
        : <span className="badge-red">Disabled</span>,
    },
    {
      key: '_actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" onClick={() => onEdit(r)}>
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
        title="Trainers"
        subtitle="Trainers log in with email + password. Each trainer is assigned to one or more batches across colleges."
        icon={IconUsers}
        accent="violet"
        actions={
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => { setBatchFilter({ college: '', search: '' }); setModal({ open: true, form: emptyForm(), editingId: null }); }}
          >
            <IconPlus size={16} /> Add Trainer
          </button>
        }
      />

      <DataTable key={reloadKey} columns={columns} fetcher={fetcher} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.editingId ? 'Edit Trainer' : 'Add Trainer'}
        size="xl"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal({ ...modal, open: false })}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={onSave}>
              {saving ? 'Saving…' : modal.editingId ? 'Save changes' : 'Create trainer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input
                className="input"
                value={modal.form.name}
                placeholder="Prof. Anita Deshpande"
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })}
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                className="input"
                type="email"
                autoComplete="off"
                value={modal.form.email}
                placeholder="anita@demo.io"
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })}
              />
            </div>
            <div>
              <label className="label">
                {modal.editingId ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={modal.form.password}
                placeholder={modal.editingId ? '••••••••' : 'min 6 characters'}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={modal.form.phone}
                placeholder="9000010001"
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })}
              />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={modal.form.isActive}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, isActive: e.target.checked } })}
              />
              Active (uncheck to prevent login)
            </label>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
              <label className="label !mb-0">Assigned Batches * <span className="text-slate-500">({modal.form.batchIds.length} selected)</span></label>
              <div className="flex items-center gap-2">
                <select
                  className="input"
                  style={{ width: 180 }}
                  value={batchFilter.college}
                  onChange={(e) => setBatchFilter({ ...batchFilter, college: e.target.value })}
                >
                  <option value="">All colleges</option>
                  {allColleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  className="input"
                  style={{ width: 180 }}
                  placeholder="Search batches…"
                  value={batchFilter.search}
                  onChange={(e) => setBatchFilter({ ...batchFilter, search: e.target.value })}
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredGrouped.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-400">No batches match the filter</div>
              )}
              {filteredGrouped.map((g) => (
                <div key={g.college.id}>
                  <div className="px-3 py-2 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {g.college.name}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-2">
                    {g.batches.map((b) => {
                      const checked = modal.form.batchIds.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className={[
                            'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm',
                            checked ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <input type="checkbox" checked={checked} onChange={() => toggleBatch(b.id)} />
                          <span className="font-medium truncate">{b.name}</span>
                          <code className="ml-auto text-[10px] px-1 py-0.5 bg-slate-100 rounded">{b.code}</code>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!modal.editingId && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              ⓘ Share the email and password with the trainer. They can log in at <code>/login</code> and will see attendance + reports for only the batches you assigned.
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
