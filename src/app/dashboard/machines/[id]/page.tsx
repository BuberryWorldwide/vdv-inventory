'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Machine {
  _id: string;
  machineId: string;
  gambinoMachineId?: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  purchaseDate?: string;
  purchasePrice?: number;
  romVersion?: string;
  dipSwitchConfig?: Record<string, any>;
  credentials?: { lockPin?: string; passwords?: Record<string, string> };
  currentLocation: string;
  storeId?: { _id: string; name: string };
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceLog {
  _id: string;
  date: string;
  technician: string;
  type: string;
  description: string;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800',
  storage: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

export default function MachineDetailPage() {
  const params = useParams();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [machineData, logsData] = await Promise.all([
          api.getMachine(params.id as string),
          api.getMaintenanceLogs(params.id as string),
        ]);
        setMachine(machineData);
        setLogs(logsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!machine) return <div className="text-center py-10">Machine not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{machine.machineId}</h1>
          <p className="text-gray-500">{machine.manufacturer} {machine.model}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/machines/${machine._id}/edit`}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Edit
          </Link>
          <Link
            href={`/dashboard/maintenance/new?machineId=${machine._id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Log Maintenance
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Serial Number</dt>
              <dd className="font-medium">{machine.serialNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[machine.status]}`}>
                  {machine.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Location</dt>
              <dd className="font-medium">{machine.storeId?.name || machine.currentLocation}</dd>
            </div>
            {machine.gambinoMachineId && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Gambino ID</dt>
                <dd className="font-medium">{machine.gambinoMachineId}</dd>
              </div>
            )}
            {machine.romVersion && (
              <div className="flex justify-between">
                <dt className="text-gray-500">ROM Version</dt>
                <dd className="font-medium">{machine.romVersion}</dd>
              </div>
            )}
            {machine.purchaseDate && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Purchase Date</dt>
                <dd className="font-medium">{new Date(machine.purchaseDate).toLocaleDateString()}</dd>
              </div>
            )}
            {machine.purchasePrice && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Purchase Price</dt>
                <dd className="font-medium">${machine.purchasePrice.toLocaleString()}</dd>
              </div>
            )}
          </dl>
          {machine.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-500 text-sm">Notes</p>
              <p className="mt-1">{machine.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Credentials</h2>
          {machine.credentials?.lockPin || machine.credentials?.passwords ? (
            <dl className="space-y-3">
              {machine.credentials.lockPin && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Lock PIN</dt>
                  <dd className="font-mono bg-gray-100 px-2 py-1 rounded">{machine.credentials.lockPin}</dd>
                </div>
              )}
              {machine.credentials.passwords && Object.entries(machine.credentials.passwords).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-500">{key}</dt>
                  <dd className="font-mono bg-gray-100 px-2 py-1 rounded">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-gray-400">No credentials stored</p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Maintenance History</h2>
        </div>
        {logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log._id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between">
                  <span className="font-medium">{log.type}</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600">{log.description}</p>
                <p className="text-gray-400 text-sm">by {log.technician}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No maintenance records</p>
        )}
      </div>
    </div>
  );
}
