import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getActiveTenantByEmail } from '../../services/tenantService';
import { getPaymentsByTenant, submitPayment } from '../../services/paymentService';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_STYLES = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  submitted: 'bg-blue-50 text-blue-700',
  rejected: 'bg-gray-100 text-gray-500',
};

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const [tenantRecord, setTenantRecord] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [form, setForm] = useState({ paymentMethod: 'bKash', transactionId: '', note: '' });

  async function refresh() {
    setLoading(true);
    const tenant = await getActiveTenantByEmail(user.email);
    setTenantRecord(tenant);
    if (tenant) {
      const data = await getPaymentsByTenant(tenant.id);
      // Most recent first.
      data.sort((a, b) => b.year - a.year || b.month - a.month);
      setPayments(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  function startPay(payment) {
    setPayingId(payment.id);
    setForm({ paymentMethod: 'bKash', transactionId: '', note: '' });
  }

  async function confirmPay() {
    await submitPayment(payingId, form);
    setPayingId(null);
    refresh();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (!tenantRecord) {
    return (
      <p className="text-sm text-gray-500">
        No active tenancy found for your account yet. Your landlord needs to add you
        as a tenant using the same email you registered with ({user.email}) before
        rent records will show up here.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {tenantRecord.propertyName} — Room {tenantRecord.roomNumber}
      </p>

      {payments.length === 0 ? (
        <p className="text-sm text-gray-500">
          No payment records yet. Your landlord generates these monthly.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">
                  {MONTH_NAMES[p.month]} {p.year}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    STATUS_STYLES[p.status] || STATUS_STYLES.pending
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mb-3 text-sm font-medium text-gray-700">
                ৳{p.amount?.toLocaleString?.() ?? p.amount}
              </p>
              {p.status === 'rejected' && p.rejectionReason && (
                <p className="mb-3 text-xs text-red-600">
                  Rejected: {p.rejectionReason}
                </p>
              )}
              {(p.status === 'pending' ||
                p.status === 'overdue' ||
                p.status === 'rejected') && (
                <button
                  onClick={() => startPay(p)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Submit payment
                </button>
              )}
              {p.status === 'submitted' && (
                <p className="text-xs text-blue-600">Waiting for landlord approval</p>
              )}
              {p.status === 'paid' && (
                <p className="text-xs text-emerald-600">Paid</p>
              )}
            </div>
          ))}
        </div>
      )}

      {payingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h3 className="mb-3 font-semibold text-gray-900">Submit payment</h3>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Payment method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option>bKash</option>
                <option>Nagad</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Transaction ID
              </label>
              <input
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. 8N7XK2P1"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Note (optional)
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPayingId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmPay}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
