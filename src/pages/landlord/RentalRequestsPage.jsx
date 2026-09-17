import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  RentalRequestStatus,
  getRequestsByLandlord,
  rejectOtherPendingForRoom,
  updateRentalRequestStatus,
} from '../../services/rentalRequestService';
import { addTenant } from '../../services/tenantService';
import { getRoomById, occupyRoom } from '../../services/roomService';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-gray-100 text-gray-500',
};

export default function RentalRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);

  async function refresh() {
    setLoading(true);
    const data = await getRequestsByLandlord(user.uid);
    data.sort((a, b) => b.createdAt - a.createdAt);
    setRequests(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  async function handleAccept(request) {
    if (
      !confirm(
        `Accept ${request.tenantName}'s request for Room ${request.roomNumber}? This will create a tenant record and mark the room occupied.`
      )
    )
      return;
    setProcessingId(request.id);

    // Re-check the room is still actually vacant right before committing —
    // guards against a race if it somehow got occupied since this request
    // was submitted (e.g. added as a walk-in tenant manually in the meantime).
    const room = await getRoomById(request.roomId);
    if (!room || room.status !== 'vacant') {
      alert(
        `Room ${request.roomNumber} is no longer vacant. Rejecting this request instead.`
      );
      await updateRentalRequestStatus(request.id, RentalRequestStatus.REJECTED);
      setProcessingId(null);
      refresh();
      return;
    }

    // Create the tenant record, same shape TenantsPage uses.
    const tenantId = await addTenant(user.uid, {
      name: request.tenantName,
      phone: request.tenantPhone,
      email: request.tenantEmail,
      nidNumber: request.tenantNid,
      propertyId: request.propertyId,
      propertyName: request.propertyName,
      roomId: request.roomId,
      roomNumber: request.roomNumber,
      rentAmount: request.rentAmount,
      moveInDate: Date.now(),
      isActive: true,
    });
    await occupyRoom(request.roomId, tenantId, request.tenantName);
    await updateRentalRequestStatus(request.id, RentalRequestStatus.ACCEPTED);
    // Any other pending requests for this same room no longer apply.
    await rejectOtherPendingForRoom(request.roomId, request.id);
    setProcessingId(null);
    refresh();
  }

  async function handleReject(request) {
    if (!confirm(`Reject ${request.tenantName}'s request?`)) return;
    setProcessingId(request.id);
    await updateRentalRequestStatus(request.id, RentalRequestStatus.REJECTED);
    setProcessingId(null);
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500">No rental requests here.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{r.tenantName}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {r.propertyName} — Room {r.roomNumber}
              </p>
              <p className="text-sm text-gray-500">{r.tenantPhone}</p>
              <p className="mb-2 text-sm font-medium text-gray-700">
                ৳{r.rentAmount?.toLocaleString?.() ?? r.rentAmount} / month
              </p>
              {r.message && (
                <p className="mb-3 rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
                  "{r.message}"
                </p>
              )}
              {r.status === RentalRequestStatus.PENDING && (
                <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => handleAccept(r)}
                    disabled={processingId === r.id}
                    className="text-emerald-600 hover:underline disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(r)}
                    disabled={processingId === r.id}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
