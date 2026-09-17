import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  RuleCategory,
  addRule,
  deleteRule,
  getRulesByLandlord,
  updateRule,
} from '../../services/ruleService';

const CATEGORY_LABELS = {
  house: 'House',
  legal: 'Legal',
  payment: 'Payment',
  maintenance: 'Maintenance',
};

const CATEGORY_STYLES = {
  house: 'bg-purple-50 text-purple-700',
  legal: 'bg-blue-50 text-blue-700',
  payment: 'bg-emerald-50 text-emerald-700',
  maintenance: 'bg-amber-50 text-amber-700',
};

const emptyForm = { title: '', description: '', category: RuleCategory.HOUSE };

export default function RulesPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await getRulesByLandlord(user.uid);
    data.sort((a, b) => b.createdAt - a.createdAt);
    setRules(data);
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

  function startEdit(rule) {
    setForm({ title: rule.title, description: rule.description, category: rule.category });
    setEditingId(rule.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await updateRule(editingId, form);
    } else {
      await addRule(user.uid, form);
    }
    setShowForm(false);
    refresh();
  }

  async function toggleActive(rule) {
    await updateRule(rule.id, { isActive: !rule.isActive });
    refresh();
  }

  async function handleDelete(rule) {
    if (!confirm(`Delete "${rule.title}"?`)) return;
    await deleteRule(rule.id);
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Visible to all your tenants, across every property.
        </p>
        <button
          onClick={startAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Add rule
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {editingId ? 'Save changes' : 'Add rule'}
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
      ) : rules.length === 0 ? (
        <p className="text-sm text-gray-500">No rules added yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border bg-white p-4 ${
                r.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[r.category]}`}
                >
                  {CATEGORY_LABELS[r.category]}
                </span>
              </div>
              <p className="mb-3 text-sm text-gray-700">{r.description}</p>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => toggleActive(r)}
                  className="text-gray-500 hover:underline"
                >
                  {r.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => startEdit(r)}
                  className="text-emerald-600 hover:underline"
                >
                  Edit
                </button>
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
