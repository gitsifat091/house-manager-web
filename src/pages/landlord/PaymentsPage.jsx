import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPropertiesByLandlord } from '../../services/propertyService';
import { getTenantsByLandlord } from '../../services/tenantService';
import {
  PaymentStatus,
  addPayment,
  deletePayment,
  getPaymentsByProperty,
  markPaymentPaid,
  rejectPayment,
} from '../../services/paymentService';

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

const now = new Date();

export default function PaymentsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

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
    const [tenantData, paymentData] = await Promise.all([
      getTenantsByLandlord(user.uid),
      getPaymentsByProperty(propertyId),
    ]);
    setTenants(tenantData.filter((t) => t.propertyId === propertyId && t.isActive));
    setPayments(paymentData);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedPropertyId) refresh(selectedPropertyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPropertyId]);

  const paymentsThisMonth = payments.filter(
    (p) => p.month === Number(month) && p.year === Number(year)
  );

  // Active tenants who don't yet have a payment record for the selected month.
  const tenantsMissingPayment = tenants.filter(
    (t) => !paymentsThisMonth.some((p) => p.tenantId === t.id)
  );

  async function generateForMonth() {
    const property = properties.find((p) => p.id === selectedPropertyId);
    await Promise.all(
      tenantsMissingPayment.map((tenant) =>
        addPayment(user.uid, {
          tenantId: tenant.id,
          tenantName: tenant.name,
          roomId: tenant.roomId,
          roomNumber: tenant.roomNumber,
          propertyId: selectedPropertyId,
          propertyName: property?.name || '',
          amount: tenant.rentAmount,
          month: Number(month),
          year: Number(year),
          status: PaymentStatus.PENDING,
        })
      )
    );
    refresh(selectedPropertyId);
  }

  async function handleMarkPaid(payment) {
    await markPaymentPaid(payment.id);
    refresh(selectedPropertyId);
  }

  async function handleApproveSubmitted(payment) {
    await markPaymentPaid(payment.id, {
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
    });
    refresh(selectedPropertyId);
  }

  function startReject(payment) {
    setRejectingId(payment.id);
    setRejectReason('');
  }

  async function confirmReject() {
    await rejectPayment(rejectingId, rejectReason);
    setRejectingId(null);
    refresh(selectedPropertyId);
  }

  async function handleDelete(payment) {
    if (!confirm(`Delete this payment record for ${payment.tenantName}?`)) return;
    await deletePayment(payment.id);
    refresh(selectedPropertyId);
  }

  if (properties.length === 0 && !loading) {
    return (
      <p className="text-sm text-gray-500">
        Add a property, rooms, and at least one tenant first.
      </p>
    );
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
          <label className="text-sm font-medium text-gray-700">Month:</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {MONTH_NAMES.slice(1).map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {tenantsMissingPayment.length > 0 && (
          <button
            onClick={generateForMonth}
            className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Generate rent for {tenantsMissingPayment.length} tenant
            {tenantsMissingPayment.length === 1 ? '' : 's'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : paymentsThisMonth.length === 0 ? (
        <p className="text-sm text-gray-500">
          No payment records for {MONTH_NAMES[month]} {year} yet. Generate them above
          (requires active tenants on this property).
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Tenant</th>
                <th className="px-4 py-2 font-medium">Room</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentsThisMonth.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-900">{p.tenantName}</td>
                  <td className="px-4 py-2 text-gray-500">Room {p.roomNumber}</td>
                  <td className="px-4 py-2 text-gray-700">
                    ৳{p.amount?.toLocaleString?.() ?? p.amount}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[p.status] || STATUS_STYLES.pending
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      {(p.status === PaymentStatus.PENDING ||
                        p.status === PaymentStatus.OVERDUE) && (
                        <button
                          onClick={() => handleMarkPaid(p)}
                          className="text-emerald-600 hover:underline"
                        >
                          Mark paid
                        </button>
                      )}
                      {p.status === PaymentStatus.SUBMITTED && (
                        <>
                          <button
                            onClick={() => handleApproveSubmitted(p)}
                            className="text-emerald-600 hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => startReject(p)}
                            className="text-red-600 hover:underline"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-gray-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h3 className="mb-2 font-semibold text-gray-900">Reject payment</h3>
            <p className="mb-3 text-sm text-gray-500">
              This sends the payment back for the tenant to resubmit.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional)"
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
