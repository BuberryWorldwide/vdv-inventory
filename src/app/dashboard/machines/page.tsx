'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Machine {
  _id: string;
  machineId: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  status: string;
  currentLocation: string;
  storeId?: { _id: string; name: string };
}

interface Store {
  _id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800',
  storage: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'storage', label: 'In Storage' },
  { value: 'repair', label: 'In Repair' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

function MachinesContent() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [machinesData, storesData] = await Promise.all([
          api.getMachines(),
          api.getStores(),
        ]);
        setMachines(machinesData);
        setStores(storesData);
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
      const matchesSearch = search === '' ||
        machine.machineId.toLowerCase().includes(search.toLowerCase()) ||
        machine.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        machine.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
        machine.model.toLowerCase().includes(search.toLowerCase()) ||
        (machine.storeId?.name || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === '' || machine.status === statusFilter;
      const matchesStore = storeFilter === '' ||
        (storeFilter === 'warehouse' && !machine.storeId) ||
        machine.storeId?._id === storeFilter;

      return matchesSearch && matchesStatus && matchesStore;
    });
  }, [machines, search, statusFilter, storeFilter]);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Machines
          <span className="text-gray-400 font-normal text-base ml-2">({filteredMachines.length})</span>
        </h1>
        <Link
          href="/dashboard/machines/new"
          className="bg-blue-600 text-white px-3 py-2 text-sm md:px-4 md:text-base rounded hover:bg-blue-700 text-center"
        >
          Add Machine
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-3 md:p-4 mb-4 space-y-3 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search ID, serial, make, model, store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none border rounded px-3 py-2 text-base"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="flex-1 md:flex-none border rounded px-3 py-2 text-base"
          >
            <option value="">All Locations</option>
            <option value="warehouse">Warehouse</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>{store.name}</option>
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
                  <p className="font-semibold text-gray-900">{machine.machineId}</p>
                  <p className="text-sm text-gray-500">{machine.manufacturer} {machine.model}</p>
                  <p className="text-sm text-gray-400 mt-1">{machine.storeId?.name || 'Warehouse'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[machine.status]}`}>
                  {machine.status}
                </span>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Make/Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.serialNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.manufacturer} {machine.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {machine.storeId?.name || 'Warehouse'}
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
            {filteredMachines.length === 0 && (
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
