'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalMachines: number;
  deployed: number;
  storage: number;
  repair: number;
  totalStores: number;
  recentMaintenance: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [machinesRes, storesRes, maintenanceRes] = await Promise.all([
          fetch('/api/machines'),
          fetch('/api/stores'),
          fetch('/api/maintenance'),
        ]);

        const machines = await machinesRes.json();
        const stores = await storesRes.json();
        const maintenance = await maintenanceRes.json();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        setStats({
          totalMachines: machines.length,
          deployed: machines.filter((m: any) => m.status === 'deployed').length,
          storage: machines.filter((m: any) => m.status === 'storage').length,
          repair: machines.filter((m: any) => m.status === 'repair').length,
          totalStores: stores.length,
          recentMaintenance: maintenance.filter(
            (m: any) => new Date(m.date) > thirtyDaysAgo
          ).length,
        });
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

  const statCards = [
    { label: 'Total Machines', value: stats?.totalMachines || 0, color: 'bg-blue-500', href: '/dashboard/machines' },
    { label: 'Deployed', value: stats?.deployed || 0, color: 'bg-green-500', href: '/dashboard/machines?status=deployed' },
    { label: 'In Storage', value: stats?.storage || 0, color: 'bg-gray-500', href: '/dashboard/machines?status=storage' },
    { label: 'In Repair', value: stats?.repair || 0, color: 'bg-yellow-500', href: '/dashboard/machines?status=repair' },
    { label: 'Stores', value: stats?.totalStores || 0, color: 'bg-purple-500', href: '/dashboard/stores' },
    { label: 'Maintenance (30d)', value: stats?.recentMaintenance || 0, color: 'bg-orange-500', href: '/dashboard/maintenance' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className={`${card.color} rounded-lg p-6 text-white shadow-lg hover:opacity-90 transition`}>
              <p className="text-sm font-medium opacity-90">{card.label}</p>
              <p className="text-4xl font-bold mt-2">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
