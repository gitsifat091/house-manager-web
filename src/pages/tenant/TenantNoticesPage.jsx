import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getActiveTenantByEmail } from '../../services/tenantService';
import { getNoticesByLandlord } from '../../services/noticeService';

export default function TenantNoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasTenancy, setHasTenancy] = useState(false);

  useEffect(() => {
    getActiveTenantByEmail(user.email).then(async (tenant) => {
      setHasTenancy(!!tenant);
      if (tenant) {
        const data = await getNoticesByLandlord(tenant.landlordId);
        data.sort((a, b) => b.createdAt - a.createdAt);
        setNotices(data);
      }
      setLoading(false);
    });
  }, [user.email]);

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (!hasTenancy) {
    return (
      <p className="text-sm text-gray-500">
        No active tenancy found for your account yet.
      </p>
    );
  }

  if (notices.length === 0) {
    return <p className="text-sm text-gray-500">No notices from your landlord yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {notices.map((n) => (
        <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-1 font-semibold text-gray-900">{n.title}</h3>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{n.body}</p>
        </div>
      ))}
    </div>
  );
}
