import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPropertiesByLandlord } from '../../services/propertyService';
import {
  MaintenanceStatus,
  deleteMaintenanceRequest,
  getMaintenanceByProperty,
  updateMaintenanceStatus,
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

export default function MaintenanceRequestsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getPropertiesByLandlord(user.uid).then((data) => {
      setProperties(data);
      if (data.length > 0) setSelectedPropertyId(data[0].id);
      else setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  async function refresh(propertyId) {
    setLoading(true);
    const data = await getMaintenanceByProperty(propertyId);
    data.sort((a, b) => b.createdAt - a.createdAt);
    setRequests(data);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedPropertyId) refresh(selectedPropertyId);
  }, [selectedPropertyId]);

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  async function handleStatusChange(request, status) {
    await updateMaintenanceStatus(request.id, status);
    refresh(selectedPropertyId);
  }

  async function handleDelete(request) {
    if (!confirm(`Delete this request: "${request.title}"?`)) return;
    await deleteMaintenanceRequest(request.id);
    refresh(selectedPropertyId);
  }

  if (properties.length === 0 && !loading) {
    return <p className="text-sm text-gray-500">Add a property first.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Property:</label>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="inProgress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500">No maintenance requests here.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
              <p className="mb-1 text-sm text-gray-500">
                {r.tenantName} — Room {r.roomNumber}
              </p>
              <p className="mb-3 text-sm text-gray-700">{r.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {r.status !== MaintenanceStatus.IN_PROGRESS && (
                  <button
                    onClick={() => handleStatusChange(r, MaintenanceStatus.IN_PROGRESS)}
                    className="text-blue-600 hover:underline"
                  >
                    Mark in progress
                  </button>
                )}
                {r.status !== MaintenanceStatus.DONE && (
                  <button
                    onClick={() => handleStatusChange(r, MaintenanceStatus.DONE)}
                    className="text-emerald-600 hover:underline"
                  >
                    Mark done
                  </button>
                )}
                <button
                  onClick={() => handleDelete(r)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
