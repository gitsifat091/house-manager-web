import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getActiveTenantByEmail } from '../../services/tenantService';
import {
  addMaintenanceRequest,
  getMaintenanceByTenant,
} from '../../services/maintenanceService';

const STATUS_LABELS = {
  pending: 'Pending',
  inProgress: 'In Progress',
  done: 'Done',
};

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  inProgress: 'bg-blue-50 text-blue-700',
  done: 'bg-emerald-50 text-emerald-700',
};

const emptyForm = { title: '', description: '' };

export default function TenantMaintenancePage() {
  const { user } = useAuth();
  const [tenantRecord, setTenantRecord] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function refresh() {
    setLoading(true);
    const tenant = await getActiveTenantByEmail(user.email);
    setTenantRecord(tenant);
    if (tenant) {
      const data = await getMaintenanceByTenant(tenant.id);
      data.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  async function handleSubmit(e) {
    e.preventDefault();
    await addMaintenanceRequest(tenantRecord.landlordId, {
      tenantId: tenantRecord.id,
      tenantName: tenantRecord.name,
      roomNumber: tenantRecord.roomNumber,
      propertyId: tenantRecord.propertyId,
      propertyName: tenantRecord.propertyName,
      title: form.title,
      description: form.description,
    });
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (!tenantRecord) {
    return (
      <p className="text-sm text-gray-500">
        No active tenancy found for your account yet. Your landlord needs to add you
        as a tenant using the same email you registered with ({user.email}).
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {tenantRecord.propertyName} — Room {tenantRecord.roomNumber}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + New request
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Leaking kitchen faucet"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Submit request
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">No maintenance requests yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
              <p className="text-sm text-gray-700">{r.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
