'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Store {
  _id: string;
  storeId: string;
  name: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getStores()
      .then(setStores)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredStores = useMemo(() => {
    if (search === '') return stores;
    const lowerSearch = search.toLowerCase();
    return stores.filter((store) =>
      store.name.toLowerCase().includes(lowerSearch) ||
      store.storeId.toLowerCase().includes(lowerSearch) ||
      (store.address || '').toLowerCase().includes(lowerSearch) ||
      (store.contactName || '').toLowerCase().includes(lowerSearch)
    );
  }, [stores, search]);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Stores
          <span className="text-gray-400 font-normal text-base ml-2">({filteredStores.length})</span>
        </h1>
        <Link
          href="/dashboard/stores/new"
          className="bg-blue-600 text-white px-3 py-2 text-sm md:px-4 md:text-base rounded hover:bg-blue-700 text-center"
        >
          Add Store
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-4">
        <input
          type="text"
          placeholder="Search stores by name, ID, address, contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-3 py-2 text-base"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {filteredStores.map((store) => (
          <Link key={store._id} href={`/dashboard/stores/${store._id}`}>
            <div className="bg-white rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">{store.name}</h2>
                  <p className="text-gray-500 text-xs md:text-sm">{store.storeId}</p>
                </div>
              </div>
              {store.address && (
                <p className="text-gray-600 mt-2 text-xs md:text-sm">{store.address}</p>
              )}
              {store.contactName && (
                <p className="text-gray-500 mt-2 text-xs md:text-sm">
                  Contact: {store.contactName}
                  {store.contactPhone && ` - ${store.contactPhone}`}
                </p>
              )}
            </div>
          </Link>
        ))}
        {filteredStores.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No stores found
          </div>
        )}
      </div>
    </div>
  );
}
