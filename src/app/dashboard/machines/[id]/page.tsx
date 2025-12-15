'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

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
  const [machine, setMachine] = useState<any>(null);
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {machine.displayName || machine.name || machine.machineId}
          </h1>
          <p className="text-gray-500">{machine.machineId}</p>
          {machine.manufacturer && (
            <p className="text-gray-400 text-sm">{machine.manufacturer} {machine.machineModel}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/machines/${machine._id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Edit Machine
          </Link>
          <Link
            href={`/dashboard/maintenance/new?machineId=${machine._id}`}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm"
          >
            Log Maintenance
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Gambino Info */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gambino Info</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Machine ID</dt>
              <dd className="font-medium">{machine.machineId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium">{machine.name || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Hub</dt>
              <dd className="font-medium">{machine.hubId || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Venue</dt>
              <dd className="font-medium">{machine.storeId?.storeName || machine.derivedVenue || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Game Type</dt>
              <dd className="font-medium capitalize">{machine.gameType || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium capitalize">{machine.status || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Connection</dt>
              <dd className="font-medium capitalize">{machine.connectionStatus || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Mapping</dt>
              <dd className="font-medium capitalize">{machine.mappingStatus || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Physical Info */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Info</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Display Name</dt>
              <dd className="font-medium">{machine.displayName || <span className="text-gray-300">Not set</span>}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Manufacturer</dt>
              <dd className="font-medium">{machine.manufacturer || <span className="text-gray-300">Not set</span>}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Model</dt>
              <dd className="font-medium">{machine.machineModel || <span className="text-gray-300">Not set</span>}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Serial Number</dt>
              <dd className="font-mono">{machine.serialNumber || <span className="text-gray-300">Not set</span>}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Location</dt>
              <dd className="font-medium">{machine.location || <span className="text-gray-300">Not set</span>}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Physical Status</dt>
              <dd>
                {machine.physicalStatus ? (
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[machine.physicalStatus]}`}>
                    {machine.physicalStatus}
                  </span>
                ) : (
                  <span className="text-gray-300">Not set</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Software Info */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Software</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">ROM Version</dt>
              <dd className="font-mono">{machine.romVersion || <span className="text-gray-300">Not set</span>}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Software Version</dt>
              <dd className="font-mono">{machine.softwareVersion || <span className="text-gray-300">Not set</span>}</dd>
            </div>
          </dl>
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Credentials</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Lock PIN</dt>
              <dd className="font-mono bg-gray-100 px-2 py-1 rounded">
                {machine.credentials?.lockPin || <span className="text-gray-300">Not set</span>}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Attendant PIN</dt>
              <dd className="font-mono bg-gray-100 px-2 py-1 rounded">
                {machine.credentials?.attendantPin || <span className="text-gray-300">Not set</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Notes */}
      {machine.inventoryNotes && (
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-4 md:mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{machine.inventoryNotes}</p>
        </div>
      )}

      {/* Maintenance History */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-4 md:mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Maintenance History</h2>
        </div>
        {logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log._id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{log.type}</span>
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

      {/* Back link */}
      <div className="mt-6">
        <Link href="/dashboard/machines" className="text-blue-600 hover:text-blue-800">
          Back to Machines
        </Link>
      </div>
    </div>
  );
}
