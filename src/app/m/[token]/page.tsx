'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, isLoggedIn } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vdv-api.gambino.gold';

interface MachineInfo {
  _id: string;
  machineId: string;
  displayName?: string;
  gameTitle?: string;
  manufacturer?: string;
  machineModel?: string;
  serialNumber?: string;
  physicalStatus?: string;
  venue?: string;
  location?: string;
  credentials?: { lockPin?: string; attendantPin?: string };
}

interface TagInfo {
  token: string;
  status: 'unlinked' | 'linked';
  machineId?: string;
  machine?: MachineInfo;
  createdAt: string;
  linkedAt?: string;
}

interface Store {
  _id: string;
  storeId: string;
  name?: string;
  storeName?: string;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800',
  storage: 'bg-gray-100 text-gray-800',
  repair: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

export default function TagScanPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [tagInfo, setTagInfo] = useState<TagInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Link/Create state
  const [mode, setMode] = useState<'view' | 'link' | 'create'>('view');
  const [machines, setMachines] = useState<MachineInfo[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // New machine form
  const [newMachine, setNewMachine] = useState({
    machineId: '',
    displayName: '',
    gameTitle: '',
    manufacturer: '',
    machineModel: '',
    serialNumber: '',
    storeId: '',
    physicalStatus: 'storage',
  });

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
  }, []);

  useEffect(() => {
    async function fetchTag() {
      try {
        const res = await fetch(`${API_URL}/api/tags/${token}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Tag not found');
        }
        const data = await res.json();
        setTagInfo(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load tag info');
      } finally {
        setLoading(false);
      }
    }
    fetchTag();
  }, [token]);

  // Load machines and stores when entering link/create mode
  useEffect(() => {
    if ((mode === 'link' || mode === 'create') && isAuthenticated) {
      Promise.all([api.getMachines(), api.getStores()])
        .then(([machinesData, storesData]) => {
          // Filter to untagged machines only for linking
          setMachines(machinesData.filter((m: any) => !m.assetTag));
          setStores(storesData);
        })
        .catch(console.error);
    }
  }, [mode, isAuthenticated]);

  const handleLinkMachine = async () => {
    if (!selectedMachineId) return;
    setSaving(true);
    try {
      await api.linkTagToMachine(token, selectedMachineId);
      // Refresh tag info
      const res = await fetch(`${API_URL}/api/tags/${token}`);
      const data = await res.json();
      setTagInfo(data);
      setMode('view');
    } catch (err: any) {
      alert(err.message || 'Failed to link tag');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMachine = async () => {
    if (!newMachine.machineId) {
      alert('Machine ID is required');
      return;
    }
    setSaving(true);
    try {
      await api.createMachineWithTag(token, newMachine);
      // Refresh tag info
      const res = await fetch(`${API_URL}/api/tags/${token}`);
      const data = await res.json();
      setTagInfo(data);
      setMode('view');
    } catch (err: any) {
      alert(err.message || 'Failed to create machine');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Unlink this tag from the machine?')) return;
    setSaving(true);
    try {
      await api.unlinkTag(token);
      const res = await fetch(`${API_URL}/api/tags/${token}`);
      const data = await res.json();
      setTagInfo(data);
    } catch (err: any) {
      alert(err.message || 'Failed to unlink tag');
    } finally {
      setSaving(false);
    }
  };

  const filteredMachines = machines.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.machineId.toLowerCase().includes(q) ||
      (m.displayName || '').toLowerCase().includes(q) ||
      (m.gameTitle || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tag Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-400">This tag may be invalid.</p>
        </div>
      </div>
    );
  }

  // Unlinked tag - show link/create options
  if (tagInfo?.status === 'unlinked') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-yellow-500 text-white rounded-t-lg p-4">
            <h1 className="text-xl font-bold">Unassigned Tag</h1>
            <p className="text-yellow-100 text-sm font-mono">{token.slice(0, 12)}...</p>
          </div>

          <div className="bg-white rounded-b-lg shadow-lg p-4">
            {!isAuthenticated ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">This tag isn't linked to any machine yet.</p>
                <Link
                  href={`/?redirect=/m/${token}`}
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Login to Link
                </Link>
              </div>
            ) : mode === 'view' ? (
              <div className="space-y-4">
                <p className="text-gray-600 text-center">This tag isn't linked to any machine.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('link')}
                    className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700"
                  >
                    Link to Existing
                  </button>
                  <button
                    onClick={() => setMode('create')}
                    className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700"
                  >
                    Create New
                  </button>
                </div>
              </div>
            ) : mode === 'link' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Link to Existing Machine</h2>
                  <button onClick={() => setMode('view')} className="text-gray-500 text-sm">Cancel</button>
                </div>
                <input
                  type="text"
                  placeholder="Search machines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <div className="max-h-60 overflow-y-auto border rounded">
                  {filteredMachines.length === 0 ? (
                    <p className="text-gray-400 text-center py-4 text-sm">No untagged machines found</p>
                  ) : (
                    filteredMachines.map(m => (
                      <label
                        key={m._id}
                        className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedMachineId === m._id ? 'bg-blue-50' : ''}`}
                      >
                        <input
                          type="radio"
                          name="machine"
                          value={m._id}
                          checked={selectedMachineId === m._id}
                          onChange={() => setSelectedMachineId(m._id)}
                        />
                        <div>
                          <p className="font-medium">{m.displayName || m.machineId}</p>
                          <p className="text-xs text-gray-500">{m.machineId}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <button
                  onClick={handleLinkMachine}
                  disabled={!selectedMachineId || saving}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Linking...' : 'Link Tag'}
                </button>
              </div>
            ) : mode === 'create' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Create New Machine</h2>
                  <button onClick={() => setMode('view')} className="text-gray-500 text-sm">Cancel</button>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Machine ID *</label>
                  <input
                    type="text"
                    value={newMachine.machineId}
                    onChange={(e) => setNewMachine({ ...newMachine, machineId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., slot-001"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newMachine.displayName}
                    onChange={(e) => setNewMachine({ ...newMachine, displayName: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Lucky 7"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Game Title</label>
                  <input
                    type="text"
                    value={newMachine.gameTitle}
                    onChange={(e) => setNewMachine({ ...newMachine, gameTitle: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Buffalo Gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={newMachine.manufacturer}
                      onChange={(e) => setNewMachine({ ...newMachine, manufacturer: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="IGT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Model</label>
                    <input
                      type="text"
                      value={newMachine.machineModel}
                      onChange={(e) => setNewMachine({ ...newMachine, machineModel: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="S2000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={newMachine.serialNumber}
                    onChange={(e) => setNewMachine({ ...newMachine, serialNumber: e.target.value })}
                    className="w-full border rounded px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Venue</label>
                  <select
                    value={newMachine.storeId}
                    onChange={(e) => setNewMachine({ ...newMachine, storeId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select venue...</option>
                    {stores.map(s => (
                      <option key={s._id} value={s._id}>{s.storeName || s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select
                    value={newMachine.physicalStatus}
                    onChange={(e) => setNewMachine({ ...newMachine, physicalStatus: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="storage">Storage</option>
                    <option value="deployed">Deployed</option>
                    <option value="repair">Repair</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateMachine}
                  disabled={!newMachine.machineId || saving}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create & Link'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">VDV Inventory System</p>
          </div>
        </div>
      </div>
    );
  }

  // Linked tag - show machine info
  const machine = tagInfo?.machine;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white rounded-t-lg p-4">
          <h1 className="text-xl font-bold">
            {machine?.displayName || machine?.machineId}
          </h1>
          <p className="text-blue-100 text-sm">{machine?.machineId}</p>
          {machine?.gameTitle && (
            <p className="text-blue-200 text-sm mt-1">{machine.gameTitle}</p>
          )}
        </div>

        {/* Machine Info */}
        <div className="bg-white shadow-lg p-4 space-y-4">
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

          {/* Show PINs if authenticated */}
          {isAuthenticated && machine?.credentials && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 uppercase mb-2">Credentials</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Lock PIN</p>
                  <p className="font-mono bg-gray-100 px-2 py-1 rounded">{machine.credentials.lockPin || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Attendant PIN</p>
                  <p className="font-mono bg-gray-100 px-2 py-1 rounded">{machine.credentials.attendantPin || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions for authenticated users */}
        {isAuthenticated && (
          <div className="bg-white rounded-b-lg shadow-lg p-4 border-t space-y-2">
            <Link
              href={`/dashboard/machines/${machine?._id}`}
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View Full Details
            </Link>
            <Link
              href={`/dashboard/machines/${machine?._id}/edit`}
              className="block w-full text-center border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              Edit Machine
            </Link>
            <button
              onClick={handleUnlink}
              disabled={saving}
              className="block w-full text-center text-red-600 px-4 py-2 rounded hover:bg-red-50 text-sm"
            >
              {saving ? 'Unlinking...' : 'Unlink Tag'}
            </button>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-white rounded-b-lg shadow-lg p-4 border-t">
            <Link
              href="/"
              className="block w-full text-center text-blue-600 px-4 py-2 rounded hover:bg-blue-50 text-sm"
            >
              Admin Login
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">VDV Inventory System</p>
          <p className="text-xs text-gray-300 font-mono mt-1">{token.slice(0, 12)}...</p>
        </div>
      </div>
    </div>
  );
}
