import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import FindHomePage from './FindHomePage';
import TenantPaymentsPage from './TenantPaymentsPage';
import TenantMaintenancePage from './TenantMaintenancePage';

// Phase 1 wires up Find Home, Payments, and Maintenance. Add Utilities,
// Notices, Rules, History, Community, Profile here as you build them out.
const NAV_ITEMS = [
  { key: 'find-home', label: 'Find Home' },
  { key: 'payments', label: 'Payments' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'notices', label: 'Notices' },
  { key: 'community', label: 'Community' },
];

const BUILT_KEYS = ['find-home', 'payments', 'maintenance'];

export default function TenantDashboard() {
  const [active, setActive] = useState('find-home');

  return (
    <DashboardLayout navItems={NAV_ITEMS} active={active} onSelect={setActive}>
      {active === 'find-home' && <FindHomePage />}
      {active === 'payments' && <TenantPaymentsPage />}
      {active === 'maintenance' && <TenantMaintenancePage />}
      {!BUILT_KEYS.includes(active) && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          {NAV_ITEMS.find((n) => n.key === active)?.label} — build this page next,
          following the same pattern as Find Home.
        </div>
      )}
    </DashboardLayout>
  );
}
