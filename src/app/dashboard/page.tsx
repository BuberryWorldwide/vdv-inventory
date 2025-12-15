'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Stats {
  totalMachines: number;
  deployed: number;
  storage: number;
  repair: number;
  totalVenues: number;
  totalHubs: number;
  connectedHubs: number;
  recentMaintenance: number;
}

interface VenueQuickView {
  _id: string;
  name: string;
  machineCount: number;
  hubCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topVenues, setTopVenues] = useState<VenueQuickView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [machines, stores, hubs, maintenance] = await Promise.all([
          api.getMachines(),
          api.getStores(),
          api.getHubs(),
          api.getMaintenanceLogs(),
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Filter to slot machines only
        const slotMachines = machines.filter((m: any) => m.gameType !== 'edge');

        setStats({
          totalMachines: slotMachines.length,
          deployed: slotMachines.filter((m: any) => m.physicalStatus === 'deployed').length,
          storage: slotMachines.filter((m: any) => m.physicalStatus === 'storage').length,
          repair: slotMachines.filter((m: any) => m.physicalStatus === 'repair').length,
          totalVenues: stores.length,
          totalHubs: hubs.length,
          connectedHubs: hubs.filter((h: any) => h.connectionStatus === 'connected').length,
          recentMaintenance: maintenance.filter(
            (m: any) => new Date(m.date) > thirtyDaysAgo
          ).length,
        });

        // Build top venues
        const venueStats = new Map<string, { name: string; machines: number; hubs: Set<string> }>();

        stores.forEach((store: any) => {
          venueStats.set(store._id, { name: store.storeName || store.name, machines: 0, hubs: new Set() });
        });

        slotMachines.forEach((m: any) => {
          const storeId = m.storeId?._id;
          if (storeId && venueStats.has(storeId)) {
            const vs = venueStats.get(storeId)!;
            vs.machines++;
            if (m.hubId) vs.hubs.add(m.hubId);
          }
        });

        const venueList: VenueQuickView[] = [];
        venueStats.forEach((vs, id) => {
          if (vs.machines > 0) {
            venueList.push({ _id: id, name: vs.name, machineCount: vs.machines, hubCount: vs.hubs.size });
          }
        });

        venueList.sort((a, b) => b.machineCount - a.machineCount);
        setTopVenues(venueList.slice(0, 5));

      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Link href="/dashboard/venues">
          <div className="bg-purple-500 rounded-lg p-4 text-white shadow hover:opacity-90 transition">
            <p className="text-xs font-medium opacity-90">Venues</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalVenues || 0}</p>
          </div>
        </Link>
        <Link href="/dashboard/machines">
          <div className="bg-blue-500 rounded-lg p-4 text-white shadow hover:opacity-90 transition">
            <p className="text-xs font-medium opacity-90">Machines</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalMachines || 0}</p>
          </div>
        </Link>
        <div className="bg-gray-700 rounded-lg p-4 text-white shadow">
          <p className="text-xs font-medium opacity-90">Hubs Online</p>
          <p className="text-2xl font-bold mt-1">
            {stats?.connectedHubs || 0}
            <span className="text-sm font-normal opacity-75">/{stats?.totalHubs || 0}</span>
          </p>
        </div>
        <Link href="/dashboard/maintenance">
          <div className="bg-orange-500 rounded-lg p-4 text-white shadow hover:opacity-90 transition">
            <p className="text-xs font-medium opacity-90">Maintenance (30d)</p>
            <p className="text-2xl font-bold mt-1">{stats?.recentMaintenance || 0}</p>
          </div>
        </Link>
      </div>

      {/* Machine Status + Venues */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Machine Status */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Machine Status</h2>
          <div className="space-y-3">
            <Link href="/dashboard/machines?status=deployed" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-700">Deployed</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.deployed || 0}</span>
            </Link>
            <Link href="/dashboard/machines?status=storage" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-gray-700">In Storage</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.storage || 0}</span>
            </Link>
            <Link href="/dashboard/machines?status=repair" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-700">In Repair</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.repair || 0}</span>
            </Link>
          </div>
        </div>

        {/* Top Venues */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Venues</h2>
            <Link href="/dashboard/venues" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
          {topVenues.length > 0 ? (
            <div className="space-y-2">
              {topVenues.map((venue) => (
                <Link
                  key={venue._id}
                  href={`/dashboard/venues?expand=${venue._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <span className="text-gray-900 font-medium">{venue.name}</span>
                    <p className="text-xs text-gray-500">
                      {venue.hubCount} hub{venue.hubCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-sm text-gray-600">
                    {venue.machineCount} machine{venue.machineCount !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No venues with machines yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
