'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function EditMachinePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [machine, setMachine] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    manufacturer: '',
    machineModel: '',
    serialNumber: '',
    romVersion: '',
    softwareVersion: '',
    location: '',
    physicalStatus: 'deployed',
    lockPin: '',
    attendantPin: '',
    inventoryNotes: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const machineData = await api.getMachine(params.id as string);
        setMachine(machineData);
        setForm({
          name: machineData.name || '',
          displayName: machineData.displayName || '',
          manufacturer: machineData.manufacturer || '',
          machineModel: machineData.machineModel || '',
          serialNumber: machineData.serialNumber || '',
          romVersion: machineData.romVersion || '',
          softwareVersion: machineData.softwareVersion || '',
          location: machineData.location || '',
          physicalStatus: machineData.physicalStatus || 'deployed',
          lockPin: machineData.credentials?.lockPin || '',
          attendantPin: machineData.credentials?.attendantPin || '',
          inventoryNotes: machineData.inventoryNotes || '',
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name || undefined,
      displayName: form.displayName || undefined,
      manufacturer: form.manufacturer || undefined,
      machineModel: form.machineModel || undefined,
      serialNumber: form.serialNumber || undefined,
      romVersion: form.romVersion || undefined,
      softwareVersion: form.softwareVersion || undefined,
      location: form.location || undefined,
      physicalStatus: form.physicalStatus,
      credentials: (form.lockPin || form.attendantPin) ? {
        lockPin: form.lockPin || undefined,
        attendantPin: form.attendantPin || undefined,
      } : undefined,
      inventoryNotes: form.inventoryNotes || undefined,
    };

    try {
      await api.updateMachine(params.id as string, payload);
      router.push(`/dashboard/machines/${params.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update machine');
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!machine) return <div className="text-center py-10">Machine not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Edit Machine</h1>
        <p className="text-gray-500 text-sm mt-1">
          {machine.machineId} - Hub: {machine.hubId || 'Unassigned'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
        {/* Display Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              placeholder="e.g., Lucky 7, Big Winner"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
            <p className="text-xs text-gray-400 mt-1">Friendly name for this machine</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambino Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
            <p className="text-xs text-gray-400 mt-1">Name shown in Gambino Admin</p>
          </div>
        </div>

        {/* Make/Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
            <input
              type="text"
              placeholder="e.g., IGT, Aristocrat, Konami"
              value={form.manufacturer}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              placeholder="e.g., S2000, Game King"
              value={form.machineModel}
              onChange={(e) => setForm({ ...form, machineModel: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
        </div>

        {/* Serial & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              type="text"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Location</label>
            <input
              type="text"
              placeholder="e.g., Front row, Near entrance"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
        </div>

        {/* Software */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ROM Version</label>
            <input
              type="text"
              value={form.romVersion}
              onChange={(e) => setForm({ ...form, romVersion: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Software Version</label>
            <input
              type="text"
              value={form.softwareVersion}
              onChange={(e) => setForm({ ...form, softwareVersion: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base font-mono"
            />
          </div>
        </div>

        {/* Credentials */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lock PIN</label>
              <input
                type="text"
                value={form.lockPin}
                onChange={(e) => setForm({ ...form, lockPin: e.target.value })}
                className="w-full border rounded px-3 py-3 md:py-2 text-base font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendant PIN</label>
              <input
                type="text"
                value={form.attendantPin}
                onChange={(e) => setForm({ ...form, attendantPin: e.target.value })}
                className="w-full border rounded px-3 py-3 md:py-2 text-base font-mono"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Physical Status</label>
          <select
            value={form.physicalStatus}
            onChange={(e) => setForm({ ...form, physicalStatus: e.target.value })}
            className="w-full border rounded px-3 py-3 md:py-2 text-base"
          >
            <option value="deployed">Deployed</option>
            <option value="storage">In Storage</option>
            <option value="repair">In Repair</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Notes</label>
          <textarea
            value={form.inventoryNotes}
            onChange={(e) => setForm({ ...form, inventoryNotes: e.target.value })}
            className="w-full border rounded px-3 py-3 md:py-2 text-base"
            rows={3}
            placeholder="Any notes about this machine..."
          />
        </div>

        <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 md:gap-4 pt-4">
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
      </form>
    </div>
  );
}
