'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Store {
  _id: string;
  name: string;
  storeId: string;
}

export default function NewMachinePage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    machineId: '',
    gambinoMachineId: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    purchaseDate: '',
    purchasePrice: '',
    romVersion: '',
    currentLocation: 'warehouse',
    storeId: '',
    status: 'storage',
    notes: '',
  });

  useEffect(() => {
    api.getStores().then(setStores).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      purchaseDate: form.purchaseDate || undefined,
      storeId: form.storeId || undefined,
    };

    try {
      await api.createMachine(payload);
      router.push('/dashboard/machines');
    } catch (err: any) {
      alert(err.message || 'Failed to create machine');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Machine</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID *</label>
            <input
              type="text"
              required
              value={form.machineId}
              onChange={(e) => setForm({ ...form, machineId: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="VDV-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambino Machine ID</label>
            <input
              type="text"
              value={form.gambinoMachineId}
              onChange={(e) => setForm({ ...form, gambinoMachineId: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="For future sync"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
          <input
            type="text"
            required
            value={form.serialNumber}
            onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label>
            <input
              type="text"
              required
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="IGT, Aristocrat, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <input
              type="text"
              required
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ROM Version</label>
          <input
            type="text"
            value={form.romVersion}
            onChange={(e) => setForm({ ...form, romVersion: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="storage">In Storage</option>
              <option value="deployed">Deployed</option>
              <option value="repair">In Repair</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Assignment</label>
            <select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">None (Warehouse)</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Machine'}
          </button>
          <Link href="/dashboard/machines" className="px-6 py-2 border rounded hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
