'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vdv-api.gambino.gold';

interface MachineInfo {
  machineId: string;
  displayName?: string;
  manufacturer?: string;
  machineModel?: string;
  serialNumber?: string;
  physicalStatus?: string;
  venue?: string;
  location?: string;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800',
  storage: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

export default function MachineScanPage() {
  const params = useParams();
  const [machine, setMachine] = useState<MachineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMachine() {
      try {
        const res = await fetch(`${API_URL}/api/machines/by-token/${params.token}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Machine not found');
        }
        const data = await res.json();
        setMachine(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load machine info');
      } finally {
        setLoading(false);
      }
    }
    fetchMachine();
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading machine info...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Machine Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-400">This QR code may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white rounded-t-lg p-4">
          <h1 className="text-xl font-bold">
            {machine?.displayName || machine?.machineId}
          </h1>
          <p className="text-blue-100 text-sm">{machine?.machineId}</p>
        </div>

        {/* Machine Info */}
        <div className="bg-white rounded-b-lg shadow-lg p-4 space-y-4">
          {machine?.manufacturer && (
            <div>
              <p className="text-xs text-gray-400 uppercase">Make/Model</p>
              <p className="text-gray-900">{machine.manufacturer} {machine.machineModel}</p>
            </div>
          )}

          {machine?.serialNumber && (
            <div>
              <p className="text-xs text-gray-400 uppercase">Serial Number</p>
              <p className="font-mono text-gray-900">{machine.serialNumber}</p>
            </div>
          )}

          {machine?.venue && (
            <div>
              <p className="text-xs text-gray-400 uppercase">Venue</p>
              <p className="text-gray-900">{machine.venue}</p>
            </div>
          )}

          {machine?.location && (
            <div>
              <p className="text-xs text-gray-400 uppercase">Location</p>
              <p className="text-gray-900">{machine.location}</p>
            </div>
          )}

          {machine?.physicalStatus && (
            <div>
              <p className="text-xs text-gray-400 uppercase">Status</p>
              <span className={`inline-block px-2 py-1 text-sm rounded-full ${statusColors[machine.physicalStatus] || 'bg-gray-100'}`}>
                {machine.physicalStatus}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">VDV Inventory System</p>
          <Link href="/" className="text-xs text-blue-600 hover:text-blue-800">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
