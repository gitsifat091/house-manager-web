import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getActiveTenantByEmail } from '../../services/tenantService';
import { getRulesByLandlord } from '../../services/ruleService';

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

export default function TenantRulesPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasTenancy, setHasTenancy] = useState(false);

  useEffect(() => {
    getActiveTenantByEmail(user.email).then(async (tenant) => {
      setHasTenancy(!!tenant);
      if (tenant) {
        const data = await getRulesByLandlord(tenant.landlordId);
        // Only show rules the landlord has left active.
        setRules(data.filter((r) => r.isActive));
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

  if (rules.length === 0) {
    return <p className="text-sm text-gray-500">No rules posted yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rules.map((r) => (
        <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900">{r.title}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[r.category]}`}
            >
              {CATEGORY_LABELS[r.category]}
            </span>
          </div>
          <p className="text-sm text-gray-700">{r.description}</p>
        </div>
      ))}
    </div>
  );
}
