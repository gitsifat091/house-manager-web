import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  addProperty,
  deleteProperty,
  getPropertiesByLandlord,
  updateProperty,
} from '../../services/propertyService';

const emptyForm = { name: '', address: '', isListed: false };

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await getPropertiesByLandlord(user.uid);
    setProperties(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(property) {
    setForm({
      name: property.name || '',
      address: property.address || '',
      isListed: !!property.isListed,
    });
    setEditingId(property.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await updateProperty(editingId, form);
    } else {
      await addProperty(user.uid, form);
    }
    setShowForm(false);
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    await deleteProperty(id);
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
        </p>
        <button
          onClick={startAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Add property
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Property name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isListed}
              onChange={(e) => setForm({ ...form, isListed: e.target.checked })}
            />
            List as "To-Let" (visible to tenants browsing)
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {editingId ? 'Save changes' : 'Add property'}
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
      ) : properties.length === 0 ? (
        <p className="text-sm text-gray-500">
          No properties yet. Add your first one above.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                {p.isListed && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    To-Let
                  </span>
                )}
              </div>
              <p className="mb-3 text-sm text-gray-500">{p.address}</p>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => startEdit(p)}
                  className="text-emerald-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
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
