'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    api.getStores()
      .then(setStores)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        <Link
          href="/dashboard/stores/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Store
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <Link key={store._id} href={`/dashboard/stores/${store._id}`}>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{store.name}</h2>
                  <p className="text-gray-500 text-sm">{store.storeId}</p>
                </div>
              </div>
              {store.address && (
                <p className="text-gray-600 mt-2 text-sm">{store.address}</p>
              )}
              {store.contactName && (
                <p className="text-gray-500 mt-2 text-sm">
                  Contact: {store.contactName}
                  {store.contactPhone && ` - ${store.contactPhone}`}
                </p>
              )}
            </div>
          </Link>
        ))}
        {stores.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No stores found
          </div>
        )}
      </div>
    </div>
  );
}
