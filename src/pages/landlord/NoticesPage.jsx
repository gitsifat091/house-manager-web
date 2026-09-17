import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  addNotice,
  deleteNotice,
  getNoticesByLandlord,
  updateNotice,
} from '../../services/noticeService';

const emptyForm = { title: '', body: '' };

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await getNoticesByLandlord(user.uid);
    data.sort((a, b) => b.createdAt - a.createdAt);
    setNotices(data);
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

  function startEdit(notice) {
    setForm({ title: notice.title, body: notice.body });
    setEditingId(notice.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await updateNotice(editingId, form);
    } else {
      await addNotice(user.uid, form);
    }
    setShowForm(false);
    refresh();
  }

  async function handleDelete(notice) {
    if (!confirm(`Delete "${notice.title}"?`)) return;
    await deleteNotice(notice.id);
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
          + Post notice
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
              Body
            </label>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {editingId ? 'Save changes' : 'Post notice'}
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
      ) : notices.length === 0 ? (
        <p className="text-sm text-gray-500">No notices posted yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notices.map((n) => (
            <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-1 font-semibold text-gray-900">{n.title}</h3>
              <p className="mb-3 whitespace-pre-wrap text-sm text-gray-700">{n.body}</p>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => startEdit(n)}
                  className="text-emerald-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(n)}
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
