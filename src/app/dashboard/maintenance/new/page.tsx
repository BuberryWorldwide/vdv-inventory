'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Machine {
  _id: string;
  machineId: string;
  manufacturer: string;
  model: string;
}

function NewMaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMachine = searchParams.get('machineId');

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    machineId: preselectedMachine || '',
    date: new Date().toISOString().split('T')[0],
    technician: '',
    type: 'repair',
    description: '',
    partsReplaced: '',
    cost: '',
  });

  useEffect(() => {
    fetch('/api/machines')
      .then((res) => res.json())
      .then(setMachines);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      partsReplaced: form.partsReplaced ? form.partsReplaced.split(',').map((p) => p.trim()) : [],
      cost: form.cost ? Number(form.cost) : undefined,
    };

    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      if (preselectedMachine) {
        router.push(`/dashboard/machines/${preselectedMachine}`);
      } else {
        router.push('/dashboard/maintenance');
      }
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to create log');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Log Maintenance</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Machine *</label>
          <select
            required
            value={form.machineId}
            onChange={(e) => setForm({ ...form, machineId: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select a machine</option>
            {machines.map((machine) => (
              <option key={machine._id} value={machine._id}>
                {machine.machineId} - {machine.manufacturer} {machine.model}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="preventive">Preventive</option>
              <option value="repair">Repair</option>
              <option value="install">Install</option>
              <option value="move">Move</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Technician *</label>
          <input
            type="text"
            required
            value={form.technician}
            onChange={(e) => setForm({ ...form, technician: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="Name of technician"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Describe the work performed..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parts Replaced</label>
            <input
              type="text"
              value={form.partsReplaced}
              onChange={(e) => setForm({ ...form, partsReplaced: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Comma-separated list"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
            <input
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Log'}
          </button>
          <Link
            href={preselectedMachine ? `/dashboard/machines/${preselectedMachine}` : '/dashboard/maintenance'}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewMaintenancePage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <NewMaintenanceContent />
    </Suspense>
  );
}
