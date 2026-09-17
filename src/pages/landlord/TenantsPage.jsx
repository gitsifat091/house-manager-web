import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPropertiesByLandlord } from '../../services/propertyService';
import { getRoomsByProperty, occupyRoom, vacateRoom } from '../../services/roomService';
import {
  addTenant,
  deleteTenant,
  getTenantsByLandlord,
  updateTenant,
} from '../../services/tenantService';

// Fields mirror lib/models/tenant_model.dart from the Flutter app:
// name, phone, email, nidNumber, propertyId/propertyName, roomId/roomNumber,
// rentAmount, moveInDate, moveOutDate, isActive, landlordId.
const emptyForm = {
  name: '',
  phone: '',
  email: '',
  nidNumber: '',
  roomId: '',
  rentAmount: '',
  moveInDate: new Date().toISOString().slice(0, 10),
};

export default function TenantsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null); // room the tenant was in before this edit
  const [showForm, setShowForm] = useState(false);

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
    const [roomData, tenantData] = await Promise.all([
      getRoomsByProperty(propertyId),
      getTenantsByLandlord(user.uid),
    ]);
    setRooms(roomData);
    setTenants(tenantData.filter((t) => t.propertyId === propertyId));
    setLoading(false);
  }

  useEffect(() => {
    if (selectedPropertyId) refresh(selectedPropertyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPropertyId]);

  // Rooms selectable in the form: vacant ones, plus whichever room this
  // tenant currently occupies (so editing doesn't hide their own room).
  const selectableRooms = rooms.filter(
    (r) => r.status === 'vacant' || r.id === editingRoomId
  );

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setEditingRoomId(null);
    setShowForm(true);
  }

  function startEdit(tenant) {
    setForm({
      name: tenant.name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      nidNumber: tenant.nidNumber || '',
      roomId: tenant.roomId || '',
      rentAmount: tenant.rentAmount ?? '',
      moveInDate: tenant.moveInDate
        ? new Date(tenant.moveInDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
    setEditingId(tenant.id);
    setEditingRoomId(tenant.roomId || null);
    setShowForm(true);
  }

  function handleRoomChange(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    setForm({
      ...form,
      roomId,
      rentAmount: room ? room.rentAmount : form.rentAmount,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const room = rooms.find((r) => r.id === form.roomId);
    if (!room) return;

    const property = properties.find((p) => p.id === selectedPropertyId);
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      nidNumber: form.nidNumber,
      propertyId: selectedPropertyId,
      propertyName: property?.name || '',
      roomId: form.roomId,
      roomNumber: room.roomNumber,
      rentAmount: Number(form.rentAmount) || 0,
      moveInDate: new Date(form.moveInDate).getTime(),
      isActive: true,
    };

    let tenantId = editingId;
    if (editingId) {
      await updateTenant(editingId, payload);
      // If the room assignment changed, vacate the old room.
      if (editingRoomId && editingRoomId !== form.roomId) {
        await vacateRoom(editingRoomId);
      }
    } else {
      tenantId = await addTenant(user.uid, payload);
    }
    await occupyRoom(form.roomId, tenantId, form.name);

    setShowForm(false);
    refresh(selectedPropertyId);
  }

  async function handleDelete(tenant) {
    if (!confirm(`Remove ${tenant.name} and free up their room?`)) return;
    await deleteTenant(tenant.id);
    if (tenant.roomId) await vacateRoom(tenant.roomId);
    refresh(selectedPropertyId);
  }

  async function handleMoveOut(tenant) {
    if (!confirm(`Mark ${tenant.name} as moved out?`)) return;
    await updateTenant(tenant.id, {
      isActive: false,
      moveOutDate: Date.now(),
    });
    if (tenant.roomId) await vacateRoom(tenant.roomId);
    refresh(selectedPropertyId);
  }

  if (properties.length === 0 && !loading) {
    return (
      <p className="text-sm text-gray-500">
        Add a property and at least one room first, then come back to add tenants.
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
          disabled={selectableRooms.length === 0}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          title={selectableRooms.length === 0 ? 'No vacant rooms in this property' : ''}
        >
          + Add tenant
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              NID number
            </label>
            <input
              value={form.nidNumber}
              onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Room</label>
            <select
              required
              value={form.roomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select a room
              </option>
              {selectableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.type})
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
              Move-in date
            </label>
            <input
              type="date"
              required
              value={form.moveInDate}
              onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {editingId ? 'Save changes' : 'Add tenant'}
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
      ) : tenants.length === 0 ? (
        <p className="text-sm text-gray-500">
          No tenants yet for this property. Add one above (requires a vacant room).
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    tenant.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tenant.isActive ? 'Active' : 'Moved out'}
                </span>
              </div>
              <p className="text-sm text-gray-500">Room {tenant.roomNumber}</p>
              <p className="text-sm text-gray-500">{tenant.phone}</p>
              <p className="mb-3 text-sm font-medium text-gray-700">
                ৳{tenant.rentAmount?.toLocaleString?.() ?? tenant.rentAmount} / month
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  onClick={() => startEdit(tenant)}
                  className="text-emerald-600 hover:underline"
                >
                  Edit
                </button>
                {tenant.isActive && (
                  <button
                    onClick={() => handleMoveOut(tenant)}
                    className="text-amber-600 hover:underline"
                  >
                    Move out
                  </button>
                )}
                <button
                  onClick={() => handleDelete(tenant)}
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
