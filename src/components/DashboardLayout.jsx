import { useAuth } from '../context/AuthContext';

// Shared shell for landlord/tenant dashboards: sidebar nav + top bar.
// `navItems` = [{ label, key }], `active` = current key, `onSelect(key)`.
export default function DashboardLayout({ navItems, active, onSelect, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 flex-col border-r border-gray-200 bg-white p-4 sm:flex">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            🏠
          </div>
          <span className="font-bold text-gray-900">House Manager</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium ${
                active === item.key
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Log out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold capitalize text-gray-900">
            {navItems.find((n) => n.key === active)?.label ?? ''}
          </h1>
          <div className="text-sm text-gray-500">{user?.name}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
