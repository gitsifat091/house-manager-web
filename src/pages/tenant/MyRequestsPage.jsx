import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRequestsByTenantEmail } from '../../services/rentalRequestService';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-gray-100 text-gray-500',
};

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRequestsByTenantEmail(user.email).then((data) => {
      data.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(data);
      setLoading(false);
    });
  }, [user.email]);

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (requests.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        You haven't requested to rent anywhere yet. Try Find Home.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900">{r.propertyName}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}
            >
              {r.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">Room {r.roomNumber}</p>
          <p className="text-sm font-medium text-gray-700">
            ৳{r.rentAmount?.toLocaleString?.() ?? r.rentAmount} / month
          </p>
          {r.status === 'accepted' && (
            <p className="mt-2 text-xs text-emerald-600">
              Accepted — this now shows under your tenancy.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
