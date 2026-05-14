import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SettingsAPI } from '../../api/endpoints.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import { IconLocation } from '../../components/common/Icon.jsx';
import { errorMessage } from '../../utils/errors.js';

const DAYS = [
  { v: 1, label: 'Mon' }, { v: 2, label: 'Tue' }, { v: 3, label: 'Wed' },
  { v: 4, label: 'Thu' }, { v: 5, label: 'Fri' }, { v: 6, label: 'Sat' },
  { v: 0, label: 'Sun' },
];

function emptyForm() {
  return {
    officeName: '', officeAddress: '',
    officeLat: '', officeLng: '',
    radiusMeters: 100, maxAccuracyMeters: 100,
    openTime: '', closeTime: '',
    workingDays: [1, 2, 3, 4, 5, 6],
  };
}

export default function SettingsPage() {
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  useEffect(() => {
    SettingsAPI.get()
      .then((d) => {
        setForm({
          officeName: d.officeName || '',
          officeAddress: d.officeAddress || '',
          officeLat: d.officeLat ?? '',
          officeLng: d.officeLng ?? '',
          radiusMeters: d.radiusMeters ?? 100,
          maxAccuracyMeters: d.maxAccuracyMeters ?? 100,
          openTime: d.openTime || '',
          closeTime: d.closeTime || '',
          workingDays: Array.isArray(d.workingDays) ? d.workingDays : [1, 2, 3, 4, 5, 6],
        });
      })
      .catch((e) => toast.error(errorMessage(e, 'Failed to load settings')))
      .finally(() => setLoading(false));
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported by this browser');
    setGpsBusy(true);
    setGpsAccuracy(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          officeLat: pos.coords.latitude.toFixed(6),
          officeLng: pos.coords.longitude.toFixed(6),
        }));
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        toast.success(`Captured (accuracy ${Math.round(pos.coords.accuracy)}m)`);
        setGpsBusy(false);
      },
      (err) => {
        toast.error(err.message || 'Could not read GPS');
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const toggleDay = (d) => {
    const set = new Set(form.workingDays);
    if (set.has(d)) set.delete(d); else set.add(d);
    setForm({ ...form, workingDays: Array.from(set).sort() });
  };

  const onSave = async () => {
    const lat = Number(form.officeLat);
    const lng = Number(form.officeLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return toast.error('Office latitude/longitude are required');
    if (form.radiusMeters < 10 || form.radiusMeters > 10000) return toast.error('Radius must be 10–10000 metres');
    if (form.maxAccuracyMeters < 5 || form.maxAccuracyMeters > 1000) return toast.error('Max accuracy must be 5–1000 metres');

    setSaving(true);
    try {
      await SettingsAPI.update({
        ...form,
        officeLat: lat,
        officeLng: lng,
        radiusMeters: Number(form.radiusMeters),
        maxAccuracyMeters: Number(form.maxAccuracyMeters),
        openTime: form.openTime || null,
        closeTime: form.closeTime || null,
      });
      toast.success('Settings saved');
    } catch (e) {
      toast.error(errorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm">Loading…</div>;

  const mapsHref = form.officeLat && form.officeLng
    ? `https://www.google.com/maps?q=${form.officeLat},${form.officeLng}`
    : null;

  return (
    <>
      <PageHeader
        title="GPS & Attendance Rules"
        subtitle="Applied when students mark attendance. Changes take effect immediately."
        icon={IconLocation}
        accent="violet"
      />

      <div className="card p-5 space-y-5 max-w-3xl">
        {/* Office identity */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Office</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Office name</label>
              <input
                className="input"
                value={form.officeName}
                placeholder="Sumago Infotech HQ"
                onChange={(e) => setForm({ ...form, officeName: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input
                className="input"
                value={form.officeAddress}
                placeholder="The Avenue, Govind Nagar, Nashik"
                onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* GPS location */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Office Location</h3>
            <button
              className="btn-ghost flex items-center gap-2 text-xs"
              onClick={useCurrentLocation}
              disabled={gpsBusy}
            >
              <IconLocation size={14} /> {gpsBusy ? 'Reading GPS…' : 'Use my current location'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitude *</label>
              <input
                className="input"
                value={form.officeLat}
                placeholder="19.989208"
                onChange={(e) => setForm({ ...form, officeLat: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Longitude *</label>
              <input
                className="input"
                value={form.officeLng}
                placeholder="73.767722"
                onChange={(e) => setForm({ ...form, officeLng: e.target.value })}
              />
            </div>
          </div>
          {gpsAccuracy !== null && (
            <div className="mt-2 text-xs text-emerald-700">
              📍 Captured with {gpsAccuracy}m accuracy.
            </div>
          )}
          {mapsHref && (
            <a className="mt-2 inline-block text-xs text-brand-700 underline" href={mapsHref} target="_blank" rel="noreferrer">
              Open in Google Maps →
            </a>
          )}
        </section>

        {/* Rules */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Rules</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Allowed distance from office (metres)</label>
              <input
                type="number"
                min="10"
                max="10000"
                className="input"
                value={form.radiusMeters}
                onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
              />
              <div className="text-[11px] text-slate-500 mt-1">Students outside this radius cannot mark attendance.</div>
            </div>
            <div>
              <label className="label">Max GPS accuracy (metres)</label>
              <input
                type="number"
                min="5"
                max="1000"
                className="input"
                value={form.maxAccuracyMeters}
                onChange={(e) => setForm({ ...form, maxAccuracyMeters: e.target.value })}
              />
              <div className="text-[11px] text-slate-500 mt-1">Reject the punch if the phone's GPS accuracy is worse than this.</div>
            </div>
            <div>
              <label className="label">Open time (HH:MM, optional)</label>
              <input
                type="time"
                className="input"
                value={form.openTime}
                onChange={(e) => setForm({ ...form, openTime: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Close time (HH:MM, optional)</label>
              <input
                type="time"
                className="input"
                value={form.closeTime}
                onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Working days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const active = form.workingDays.includes(d.v);
                return (
                  <button
                    key={d.v}
                    type="button"
                    onClick={() => toggleDay(d.v)}
                    className={[
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                      active
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button className="btn-primary" disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </>
  );
}
