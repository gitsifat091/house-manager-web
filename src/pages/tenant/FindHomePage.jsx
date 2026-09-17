import { useEffect, useState } from 'react';
import { getListedProperties } from '../../services/propertyService';

export default function FindHomePage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListedProperties().then((data) => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (properties.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No listings available right now. Check back later.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => (
        <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900">{p.name}</h3>
          <p className="mb-3 text-sm text-gray-500">{p.address}</p>
          <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
            Request to rent
          </button>
        </div>
      ))}
    </div>
  );
}
