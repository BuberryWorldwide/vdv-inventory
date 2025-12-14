'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Machine {
  _id: string;
  machineId: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  status: string;
  currentLocation: string;
  storeId?: { name: string };
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800',
  storage: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

function MachinesContent() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  useEffect(() => {
    async function fetchMachines() {
      const url = statusFilter ? `/api/machines?status=${statusFilter}` : '/api/machines';
      const res = await fetch(url);
      const data = await res.json();
      setMachines(data);
      setLoading(false);
    }
    fetchMachines();
  }, [statusFilter]);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Machines {statusFilter && `(${statusFilter})`}
        </h1>
        <Link
          href="/dashboard/machines/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Machine
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Make/Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {machines.map((machine) => (
              <tr key={machine._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {machine.machineId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.serialNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.manufacturer} {machine.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.storeId?.name || machine.currentLocation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[machine.status]}`}>
                    {machine.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link href={`/dashboard/machines/${machine._id}`} className="text-blue-600 hover:text-blue-800 mr-4">
                    View
                  </Link>
                  <Link href={`/dashboard/machines/${machine._id}/edit`} className="text-gray-600 hover:text-gray-800">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {machines.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No machines found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MachinesPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <MachinesContent />
    </Suspense>
  );
}
