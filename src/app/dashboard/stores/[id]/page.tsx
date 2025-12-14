'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Store {
  _id: string;
  storeId: string;
  name: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  accessNotes?: string;
  notes?: string;
  machines: Array<{
    _id: string;
    machineId: string;
    manufacturer: string;
    model: string;
    status: string;
  }>;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800',
  storage: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Store>>({});

  useEffect(() => {
    api.getStore(params.id as string)
      .then((data) => {
        setStore(data);
        setForm(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    try {
      const updated = await api.updateStore(params.id as string, form);
      setStore({ ...store!, ...updated });
      setEditing(false);
    } catch (err) {
      alert('Failed to update store');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this store? Machines will be unassigned.')) return;

    try {
      await api.deleteStore(params.id as string);
      router.push('/dashboard/stores');
    } catch (err) {
      alert('Failed to delete store');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!store) return <div className="text-center py-10">Store not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
          <p className="text-gray-500">{store.storeId}</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setForm(store);
                  setEditing(false);
                }}
                className="border px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          {!editing ? (
            <dl className="space-y-3">
              {store.address && (
                <div>
                  <dt className="text-gray-500 text-sm">Address</dt>
                  <dd className="font-medium">{store.address}</dd>
                </div>
              )}
              {store.contactName && (
                <div>
                  <dt className="text-gray-500 text-sm">Contact</dt>
                  <dd className="font-medium">
                    {store.contactName}
                    {store.contactPhone && <span className="text-gray-500"> - {store.contactPhone}</span>}
                  </dd>
                  {store.contactEmail && <dd className="text-gray-500">{store.contactEmail}</dd>}
                </div>
              )}
              {store.accessNotes && (
                <div>
                  <dt className="text-gray-500 text-sm">Access Notes</dt>
                  <dd className="font-medium bg-yellow-50 p-2 rounded">{store.accessNotes}</dd>
                </div>
              )}
              {store.notes && (
                <div>
                  <dt className="text-gray-500 text-sm">Notes</dt>
                  <dd>{store.notes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input
                    type="text"
                    value={form.contactName || ''}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.contactPhone || ''}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Notes</label>
                <textarea
                  value={form.accessNotes || ''}
                  onChange={(e) => setForm({ ...form, accessNotes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm">
                Delete Store
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Machines at this Store</h2>
          {store.machines && store.machines.length > 0 ? (
            <div className="space-y-3">
              {store.machines.map((machine) => (
                <Link
                  key={machine._id}
                  href={`/dashboard/machines/${machine._id}`}
                  className="block p-3 border rounded hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{machine.machineId}</p>
                      <p className="text-gray-500 text-sm">
                        {machine.manufacturer} {machine.model}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[machine.status]}`}>
                      {machine.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No machines assigned to this store</p>
          )}
        </div>
      </div>
    </div>
  );
}
