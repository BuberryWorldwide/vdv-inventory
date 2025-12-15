'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Machine {
  _id: string;
  machineId: string;
  name: string;
  displayName?: string;
  hubId?: string;
  storeId?: { _id: string; storeName: string };
  status: string;
  physicalStatus?: string;
  manufacturer?: string;
  machineModel?: string;
  serialNumber?: string;
  location?: string;
}

interface Hub {
  _id: string;
  machineId: string;
  name: string;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800',
  storage: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

const physicalStatusOptions = [
  { value: '', label: 'All Status' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'storage', label: 'In Storage' },
  { value: 'repair', label: 'In Repair' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

function MachinesContent() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hubFilter, setHubFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const hub = searchParams.get('hub');
    if (hub) setHubFilter(hub);
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [machinesData, hubsData] = await Promise.all([
          api.getMachines(),
          api.getHubs(),
        ]);
        setMachines(machinesData);
        setHubs(hubsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = search === '' ||
        machine.machineId.toLowerCase().includes(searchLower) ||
        (machine.name || '').toLowerCase().includes(searchLower) ||
        (machine.displayName || '').toLowerCase().includes(searchLower) ||
        (machine.manufacturer || '').toLowerCase().includes(searchLower) ||
        (machine.machineModel || '').toLowerCase().includes(searchLower) ||
        (machine.serialNumber || '').toLowerCase().includes(searchLower) ||
        (machine.storeId?.storeName || '').toLowerCase().includes(searchLower);

      const matchesHub = hubFilter === '' || machine.hubId === hubFilter;
      const matchesStatus = statusFilter === '' || machine.physicalStatus === statusFilter;

      return matchesSearch && matchesHub && matchesStatus;
    });
  }, [machines, search, hubFilter, statusFilter]);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Machines
          <span className="text-gray-400 font-normal text-base ml-2">({filteredMachines.length})</span>
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-4 space-y-3 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search ID, name, manufacturer, model, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={hubFilter}
            onChange={(e) => setHubFilter(e.target.value)}
            className="flex-1 md:flex-none border rounded px-3 py-2 text-base"
          >
            <option value="">All Hubs</option>
            {hubs.map((hub) => (
              <option key={hub._id} value={hub.machineId}>
                {hub.name || hub.machineId}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none border rounded px-3 py-2 text-base"
          >
            {physicalStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filteredMachines.map((machine) => (
          <Link key={machine._id} href={`/dashboard/machines/${machine._id}`}>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">
                    {machine.displayName || machine.name || machine.machineId}
                  </p>
                  <p className="text-sm text-gray-500">{machine.machineId}</p>
                  {machine.manufacturer && (
                    <p className="text-xs text-gray-400 mt-1">
                      {machine.manufacturer} {machine.machineModel}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Hub: {machine.hubId || 'Unassigned'}
                  </p>
                </div>
                {machine.physicalStatus && (
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[machine.physicalStatus] || 'bg-gray-100'}`}>
                    {machine.physicalStatus}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {filteredMachines.length === 0 && (
          <div className="text-center py-10 text-gray-500">No machines found</div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Make/Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hub</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMachines.map((machine) => (
              <tr key={machine._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {machine.machineId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {machine.displayName || machine.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.manufacturer || machine.machineModel ? (
                    <span>{machine.manufacturer} {machine.machineModel}</span>
                  ) : (
                    <span className="text-gray-300">Not set</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.hubId || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.storeId?.storeName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {machine.physicalStatus ? (
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[machine.physicalStatus]}`}>
                      {machine.physicalStatus}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
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
            {filteredMachines.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
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
