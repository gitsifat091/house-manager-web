import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PropertiesPage from './PropertiesPage';
import RoomsPage from './RoomsPage';
import TenantsPage from './TenantsPage';

// Phase 1 wires up Properties, Rooms, and Tenants. Add more entries here
// as you build Payments, Maintenance, Utilities, Notices, Rules, etc.
// (each with its own page component, same pattern as PropertiesPage).
const NAV_ITEMS = [
  { key: 'properties', label: 'Properties' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'tenants', label: 'Tenants' },
  { key: 'payments', label: 'Payments' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'notices', label: 'Notices' },
];

const BUILT_KEYS = ['properties', 'rooms', 'tenants'];

export default function LandlordDashboard() {
  const [active, setActive] = useState('properties');

  return (
    <DashboardLayout navItems={NAV_ITEMS} active={active} onSelect={setActive}>
      {active === 'properties' && <PropertiesPage />}
      {active === 'rooms' && <RoomsPage />}
      {active === 'tenants' && <TenantsPage />}
      {!BUILT_KEYS.includes(active) && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          {NAV_ITEMS.find((n) => n.key === active)?.label} — build this page next,
          following the same pattern as Properties.
        </div>
      )}
    </DashboardLayout>
  );
}
