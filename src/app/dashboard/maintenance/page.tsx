'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface MaintenanceLog {
  _id: string;
  machineId: { _id: string; machineId: string; manufacturer: string; model: string };
  date: string;
  technician: string;
  type: string;
  description: string;
  cost?: number;
}

const typeColors: Record<string, string> = {
  preventive: 'bg-blue-100 text-blue-800',
  repair: 'bg-red-100 text-red-800',
  install: 'bg-green-100 text-green-800',
  move: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMaintenanceLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Maintenance</h1>
        <Link
          href="/dashboard/maintenance/new"
          className="bg-blue-600 text-white px-3 py-2 text-sm md:px-4 md:text-base rounded hover:bg-blue-700"
        >
          Log Maintenance
        </Link>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {logs.map((log) => (
          <div key={log._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link href={`/dashboard/machines/${log.machineId?._id}`} className="font-semibold text-blue-600">
                  {log.machineId?.machineId || 'Unknown'}
                </Link>
                <p className="text-xs text-gray-400">{log.machineId?.manufacturer} {log.machineId?.model}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${typeColors[log.type]}`}>
                {log.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{log.description}</p>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>{new Date(log.date).toLocaleDateString()}</span>
              <span>{log.technician}</span>
              {log.cost && <span>${log.cost}</span>}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-10 text-gray-500">No maintenance logs found</div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(log.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link href={`/dashboard/machines/${log.machineId?._id}`} className="text-blue-600 hover:text-blue-800">
                    {log.machineId?.machineId || 'Unknown'}
                  </Link>
                  <p className="text-gray-400 text-xs">
                    {log.machineId?.manufacturer} {log.machineId?.model}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${typeColors[log.type]}`}>
                    {log.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                  {log.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.technician}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.cost ? `$${log.cost}` : '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No maintenance logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
