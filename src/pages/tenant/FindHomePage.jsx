import { useEffect, useState } from 'react';
import { getListedProperties } from '../../services/propertyService';
import { getRoomsByProperty } from '../../services/roomService';
import { getActiveTenantByEmail } from '../../services/tenantService';
import {
  addRentalRequest,
  getPendingRequestsForProperty,
} from '../../services/rentalRequestService';
import { useAuth } from '../../context/AuthContext';

export default function FindHomePage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state.
  const [activeProperty, setActiveProperty] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]); // vacant AND not already pending-requested
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // step 2: which room they're requesting
  const [form, setForm] = useState({ phone: '', nid: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    const [listed, currentTenancy] = await Promise.all([
      getListedProperties(),
      getActiveTenantByEmail(user.email),
    ]);
    const filtered = currentTenancy
      ? listed.filter((p) => p.id !== currentTenancy.propertyId)
      : listed;
    setProperties(filtered);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  async function openProperty(property) {
    setActiveProperty(property);
    setSelectedRoom(null);
    setForm({ phone: '', nid: '', message: '' });
    setRoomsLoading(true);
    const [rooms, pendingRequests] = await Promise.all([
      getRoomsByProperty(property.id),
      getPendingRequestsForProperty(property.id),
    ]);
    const pendingRoomIds = new Set(pendingRequests.map((r) => r.roomId));
    // A room is requestable only if it's vacant AND nobody else already
    // has a pending request on it (prevents duplicate/competing requests).
    setAvailableRooms(
      rooms.filter((r) => r.status === 'vacant' && !pendingRoomIds.has(r.id))
    );
    setRoomsLoading(false);
  }

  function closeModal() {
    setActiveProperty(null);
    setAvailableRooms([]);
    setSelectedRoom(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await addRentalRequest({
      landlordId: activeProperty.landlordId,
      propertyId: activeProperty.id,
      propertyName: activeProperty.name,
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.roomNumber,
      rentAmount: selectedRoom.rentAmount,
      tenantUserId: user.uid,
      tenantName: user.name,
      tenantPhone: form.phone,
      tenantEmail: user.email,
      tenantNid: form.nid,
      message: form.message,
    });
    setSubmitting(false);
    closeModal();
    refresh();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (properties.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No listings available right now. Check back later.
      </p>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">{p.name}</h3>
            <p className="mb-3 text-sm text-gray-500">{p.address}</p>
            <button
              onClick={() => openProperty(p)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View rooms
            </button>
          </div>
        ))}
      </div>

      {activeProperty && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{activeProperty.name}</h3>
                <p className="text-sm text-gray-500">{activeProperty.address}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {roomsLoading ? (
              <p className="text-sm text-gray-500">Loading rooms...</p>
            ) : !selectedRoom ? (
              // Step 1: browse available rooms with full details first.
              availableRooms.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No rooms available to request right now (either occupied or already
                  requested by someone else).
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableRooms.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-gray-200 p-3"
                    >
                      <h4 className="font-semibold text-gray-900">Room {r.roomNumber}</h4>
                      <p className="text-sm text-gray-500">{r.type}</p>
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        ৳{r.rentAmount?.toLocaleString?.() ?? r.rentAmount} / month
                      </p>
                      <button
                        onClick={() => setSelectedRoom(r)}
                        className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Request this room
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Step 2: contact info form for the chosen room.
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">
                    Room {selectedRoom.roomNumber} — {selectedRoom.type}
                  </p>
                  <p className="text-gray-600">
                    ৳{selectedRoom.rentAmount?.toLocaleString?.() ?? selectedRoom.rentAmount}{' '}
                    / month
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="mt-1 text-emerald-600 hover:underline"
                  >
                    Choose a different room
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Your phone
                  </label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    NID number
                  </label>
                  <input
                    value={form.nid}
                    onChange={(e) => setForm({ ...form, nid: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Message to landlord (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
