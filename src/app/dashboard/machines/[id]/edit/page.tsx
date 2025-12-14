'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Store {
  _id: string;
  name: string;
}

export default function EditMachinePage() {
  const router = useRouter();
  const params = useParams();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    lockPin: '',
  });

  useEffect(() => {
    async function fetchData() {
      const [machineRes, storesRes] = await Promise.all([
        fetch(`/api/machines/${params.id}`),
        fetch('/api/stores'),
      ]);
      const machine = await machineRes.json();
      setStores(await storesRes.json());

      setForm({
        machineId: machine.machineId || '',
        gambinoMachineId: machine.gambinoMachineId || '',
        serialNumber: machine.serialNumber || '',
        manufacturer: machine.manufacturer || '',
        model: machine.model || '',
        purchaseDate: machine.purchaseDate ? machine.purchaseDate.split('T')[0] : '',
        purchasePrice: machine.purchasePrice?.toString() || '',
        romVersion: machine.romVersion || '',
        currentLocation: machine.currentLocation || 'warehouse',
        storeId: machine.storeId?._id || '',
        status: machine.status || 'storage',
        notes: machine.notes || '',
        lockPin: machine.credentials?.lockPin || '',
      });
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      purchaseDate: form.purchaseDate || undefined,
      storeId: form.storeId || undefined,
      credentials: form.lockPin ? { lockPin: form.lockPin } : undefined,
    };

    const res = await fetch(`/api/machines/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push(`/dashboard/machines/${params.id}`);
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to update machine');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this machine?')) return;

    const res = await fetch(`/api/machines/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard/machines');
    } else {
      alert('Failed to delete machine');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Machine</h1>
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambino Machine ID</label>
            <input
              type="text"
              value={form.gambinoMachineId}
              onChange={(e) => setForm({ ...form, gambinoMachineId: e.target.value })}
              className="w-full border rounded px-3 py-2"
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
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ROM Version</label>
            <input
              type="text"
              value={form.romVersion}
              onChange={(e) => setForm({ ...form, romVersion: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lock PIN</label>
            <input
              type="text"
              value={form.lockPin}
              onChange={(e) => setForm({ ...form, lockPin: e.target.value })}
              className="w-full border rounded px-3 py-2 font-mono"
            />
          </div>
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

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800"
          >
            Delete Machine
          </button>
          <div className="flex gap-4">
            <Link href={`/dashboard/machines/${params.id}`} className="px-6 py-2 border rounded hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
