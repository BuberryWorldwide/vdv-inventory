'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function NewStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    storeId: '',
    name: '',
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    accessNotes: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createStore(form);
      router.push('/dashboard/stores');
    } catch (err: any) {
      alert(err.message || 'Failed to create store');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Add Store</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store ID *</label>
            <input
              type="text"
              required
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
              placeholder="STORE-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
              placeholder="Store Name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border rounded px-3 py-3 md:py-2 text-base"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full border rounded px-3 py-3 md:py-2 text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Access Notes</label>
          <textarea
            value={form.accessNotes}
            onChange={(e) => setForm({ ...form, accessNotes: e.target.value })}
            className="w-full border rounded px-3 py-3 md:py-2 text-base"
            rows={2}
            placeholder="e.g., Key under mat, call Joe first, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded px-3 py-3 md:py-2 text-base"
            rows={3}
          />
        </div>

        <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-4">
          <Link href="/dashboard/stores" className="px-6 py-3 md:py-2 border rounded hover:bg-gray-50 text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 md:py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Store'}
          </button>
        </div>
      </form>
    </div>
  );
}
