'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

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
  const [showNewStore, setShowNewStore] = useState(false);
  const [newStore, setNewStore] = useState({ storeId: '', name: '', address: '' });
  const [creatingStore, setCreatingStore] = useState(false);
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
      try {
        const [machine, storesData] = await Promise.all([
          api.getMachine(params.id as string),
          api.getStores(),
        ]);
        setStores(storesData);

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
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  const handleCreateStore = async () => {
    if (!newStore.storeId || !newStore.name) {
      alert('Store ID and Name are required');
      return;
    }
    setCreatingStore(true);
    try {
      const created = await api.createStore(newStore);
      setStores([...stores, created]);
      setForm({ ...form, storeId: created._id });
      setShowNewStore(false);
      setNewStore({ storeId: '', name: '', address: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to create store');
    } finally {
      setCreatingStore(false);
    }
  };

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

    try {
      await api.updateMachine(params.id as string, payload);
      router.push(`/dashboard/machines/${params.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update machine');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this machine?')) return;

    try {
      await api.deleteMachine(params.id as string);
      router.push('/dashboard/machines');
    } catch (err) {
      alert('Failed to delete machine');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Edit Machine</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID *</label>
            <input
              type="text"
              required
              value={form.machineId}
              onChange={(e) => setForm({ ...form, machineId: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambino Machine ID</label>
            <input
              type="text"
              value={form.gambinoMachineId}
              onChange={(e) => setForm({ ...form, gambinoMachineId: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
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
            className="w-full border rounded px-3 py-3 md:py-2 text-base"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label>
            <input
              type="text"
              required
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <input
              type="text"
              required
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ROM Version</label>
            <input
              type="text"
              value={form.romVersion}
              onChange={(e) => setForm({ ...form, romVersion: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lock PIN</label>
            <input
              type="text"
              value={form.lockPin}
              onChange={(e) => setForm({ ...form, lockPin: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
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
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setShowNewStore(true);
                } else {
                  setForm({ ...form, storeId: e.target.value });
                }
              }}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            >
              <option value="">Warehouse</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
              <option value="__new__">+ Add New Store</option>
            </select>
          </div>
        </div>

        {showNewStore && (
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Add New Store</h3>
              <button
                type="button"
                onClick={() => setShowNewStore(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Store ID *"
                value={newStore.storeId}
                onChange={(e) => setNewStore({ ...newStore, storeId: e.target.value })}
                className="border rounded px-3 py-2 text-base"
              />
              <input
                type="text"
                placeholder="Store Name *"
                value={newStore.name}
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                className="border rounded px-3 py-2 text-base"
              />
            </div>
            <input
              type="text"
              placeholder="Address (optional)"
              value={newStore.address}
              onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
              className="w-full border rounded px-3 py-2 text-base"
            />
            <button
              type="button"
              onClick={handleCreateStore}
              disabled={creatingStore}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creatingStore ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded px-3 py-3 md:py-2 text-base"
            rows={3}
          />
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 order-last md:order-first"
          >
            Delete Machine
          </button>
          <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
            <Link href={`/dashboard/machines/${params.id}`} className="px-6 py-3 md:py-2 border rounded hover:bg-gray-50 text-center">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 md:py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
