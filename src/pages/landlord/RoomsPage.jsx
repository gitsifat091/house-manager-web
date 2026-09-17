import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPropertiesByLandlord } from '../../services/propertyService';
import {
  addRoom,
  deleteRoom,
  getRoomsByProperty,
  updateRoom,
} from '../../services/roomService';

// Room fields mirror lib/models/room_model.dart from the Flutter app:
// roomNumber, type, rentAmount, status ('vacant' | 'occupied'), tenantName.
const ROOM_TYPES = ['Single', 'Double', 'Studio', 'Family'];
const emptyForm = { roomNumber: '', type: 'Single', rentAmount: '', status: 'vacant' };

export default function RoomsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load the landlord's properties once, and default to the first one.
  useEffect(() => {
    getPropertiesByLandlord(user.uid).then((data) => {
      setProperties(data);
      if (data.length > 0) setSelectedPropertyId(data[0].id);
      else setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  async function refreshRooms(propertyId) {
    setLoading(true);
    const data = await getRoomsByProperty(propertyId);
    setRooms(data);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedPropertyId) refreshRooms(selectedPropertyId);
  }, [selectedPropertyId]);

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(room) {
    setForm({
      roomNumber: room.roomNumber || '',
      type: room.type || 'Single',
      rentAmount: room.rentAmount ?? '',
      status: room.status || 'vacant',
    });
    setEditingId(room.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, rentAmount: Number(form.rentAmount) || 0 };
    if (editingId) {
      await updateRoom(editingId, payload);
    } else {
      await addRoom(selectedPropertyId, payload);
    }
    setShowForm(false);
    refreshRooms(selectedPropertyId);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this room? This cannot be undone.')) return;
    await deleteRoom(id);
    refreshRooms(selectedPropertyId);
  }

  async function toggleStatus(room) {
    const nextStatus = room.status === 'occupied' ? 'vacant' : 'occupied';
    await updateRoom(room.id, { status: nextStatus });
    refreshRooms(selectedPropertyId);
  }

  if (properties.length === 0 && !loading) {
    return (
      <p className="text-sm text-gray-500">
        Add a property first (Properties tab) before adding rooms to it.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        <button
          onClick={startAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Add room
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Room number
            </label>
            <input
              required
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Monthly rent
            </label>
            <input
              type="number"
              min="0"
              required
              value={form.rentAmount}
              onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {editingId ? 'Save changes' : 'Add room'}
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

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-gray-500">
          No rooms yet for this property. Add one above.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">
                  Room {room.roomNumber}
                </h3>
                <button
                  onClick={() => toggleStatus(room)}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    room.status === 'occupied'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                  title="Click to toggle status"
                >
                  {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
                </button>
              </div>
              <p className="text-sm text-gray-500">{room.type}</p>
              <p className="mb-3 text-sm font-medium text-gray-700">
                ৳{room.rentAmount?.toLocaleString?.() ?? room.rentAmount} / month
              </p>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => startEdit(room)}
                  className="text-emerald-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
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
