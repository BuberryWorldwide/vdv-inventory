'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Machine {
  _id: string;
  machineId: string;
  originalMachineId?: string;
  name?: string;
  displayName?: string;
  gameTitle?: string;
  hubId?: string;
  storeId?: { _id: string; storeName: string };
  physicalStatus?: string;
  gameType?: string;
}

interface Store {
  _id: string;
  storeId: string;
  storeName: string;
  name?: string;
  address?: string;
}

interface Hub {
  _id: string;
  machineId: string;
  name?: string;
  hubId?: string;
  storeId?: { _id: string; storeName: string };
  connectionStatus?: string;
  lastSeen?: string;
}

interface VenueData {
  store: Store;
  hubs: {
    hub: Hub;
    machines: Machine[];
  }[];
  unassignedMachines: Machine[];
  totalMachines: number;
  deployedCount: number;
  storageCount: number;
  repairCount: number;
}

const statusColors: Record<string, string> = {
  deployed: 'bg-green-500',
  storage: 'bg-gray-400',
  repair: 'bg-yellow-500',
  decommissioned: 'bg-red-500',
};

function formatMachineName(machine: Machine): string {
  if (machine.displayName) return machine.displayName;
  const idToFormat = machine.originalMachineId || machine.machineId;
  const machineMatch = idToFormat.match(/machine[_-]?(\d+)$/i);
  if (machineMatch) {
    return `Machine ${machineMatch[1].padStart(2, '0')}`;
  }
  return machine.name || idToFormat;
}

function formatHubName(hub: Hub): string {
  if (hub.name) return hub.name;
  // Extract friendly name from hub ID like "pi-2-nimbus-1" -> "Pi 2"
  const match = (hub.hubId || hub.machineId).match(/^pi-?(\d+)/i);
  if (match) {
    return `Pi ${match[1]}`;
  }
  return hub.hubId || hub.machineId;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [unassignedVenue, setUnassignedVenue] = useState<VenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [expandedHubs, setExpandedHubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const [machines, stores, hubs] = await Promise.all([
          api.getMachines(),
          api.getStores(),
          api.getHubs(),
        ]);

        // Filter to only slot machines (not edge/hub devices)
        const slotMachines = machines.filter((m: Machine) => m.gameType !== 'edge');
        const hubDevices = hubs as Hub[];

        // Build venue hierarchy
        const venueMap = new Map<string, VenueData>();

        // Initialize venues from stores
        stores.forEach((store: Store) => {
          venueMap.set(store._id, {
            store,
            hubs: [],
            unassignedMachines: [],
            totalMachines: 0,
            deployedCount: 0,
            storageCount: 0,
            repairCount: 0,
          });
        });

        // Create hub lookup by hubId/machineId
        const hubLookup = new Map<string, Hub>();
        hubDevices.forEach((hub) => {
          hubLookup.set(hub.machineId, hub);
          if (hub.hubId) hubLookup.set(hub.hubId, hub);
        });

        // Group machines by store, then by hub
        const machinesByStoreAndHub = new Map<string, Map<string, Machine[]>>();
        const unassignedMachines: Machine[] = [];

        slotMachines.forEach((machine: Machine) => {
          const storeId = machine.storeId?._id;

          if (!storeId) {
            unassignedMachines.push(machine);
            return;
          }

          if (!machinesByStoreAndHub.has(storeId)) {
            machinesByStoreAndHub.set(storeId, new Map());
          }

          const storeHubs = machinesByStoreAndHub.get(storeId)!;
          const hubKey = machine.hubId || '_unassigned';

          if (!storeHubs.has(hubKey)) {
            storeHubs.set(hubKey, []);
          }
          storeHubs.get(hubKey)!.push(machine);
        });

        // Build final venue data
        const venueList: VenueData[] = [];

        venueMap.forEach((venueData, storeId) => {
          const storeHubs = machinesByStoreAndHub.get(storeId);

          if (storeHubs) {
            storeHubs.forEach((hubMachines, hubKey) => {
              if (hubKey === '_unassigned') {
                venueData.unassignedMachines = hubMachines;
              } else {
                const hub = hubLookup.get(hubKey);
                if (hub) {
                  venueData.hubs.push({
                    hub,
                    machines: hubMachines.sort((a, b) => {
                      const aNum = parseInt(a.originalMachineId?.match(/\d+$/)?.[0] || '99');
                      const bNum = parseInt(b.originalMachineId?.match(/\d+$/)?.[0] || '99');
                      return aNum - bNum;
                    }),
                  });
                }
              }

              // Count stats
              hubMachines.forEach((m) => {
                venueData.totalMachines++;
                if (m.physicalStatus === 'deployed') venueData.deployedCount++;
                else if (m.physicalStatus === 'storage') venueData.storageCount++;
                else if (m.physicalStatus === 'repair') venueData.repairCount++;
              });
            });
          }

          // Sort hubs by name
          venueData.hubs.sort((a, b) => formatHubName(a.hub).localeCompare(formatHubName(b.hub)));

          if (venueData.totalMachines > 0 || venueData.hubs.length > 0) {
            venueList.push(venueData);
          }
        });

        // Sort venues by machine count (most machines first)
        venueList.sort((a, b) => b.totalMachines - a.totalMachines);

        setVenues(venueList);

        // Handle unassigned machines
        if (unassignedMachines.length > 0) {
          setUnassignedVenue({
            store: { _id: '_unassigned', storeId: 'unassigned', storeName: 'Unassigned Machines' },
            hubs: [],
            unassignedMachines,
            totalMachines: unassignedMachines.length,
            deployedCount: unassignedMachines.filter(m => m.physicalStatus === 'deployed').length,
            storageCount: unassignedMachines.filter(m => m.physicalStatus === 'storage').length,
            repairCount: unassignedMachines.filter(m => m.physicalStatus === 'repair').length,
          });
        }

        // Auto-expand first venue
        if (venueList.length > 0) {
          setExpandedVenues(new Set([venueList[0].store._id]));
          if (venueList[0].hubs.length > 0) {
            setExpandedHubs(new Set([venueList[0].hubs[0].hub.machineId]));
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const toggleVenue = (storeId: string) => {
    const newExpanded = new Set(expandedVenues);
    if (newExpanded.has(storeId)) {
      newExpanded.delete(storeId);
    } else {
      newExpanded.add(storeId);
    }
    setExpandedVenues(newExpanded);
  };

  const toggleHub = (hubId: string) => {
    const newExpanded = new Set(expandedHubs);
    if (newExpanded.has(hubId)) {
      newExpanded.delete(hubId);
    } else {
      newExpanded.add(hubId);
    }
    setExpandedHubs(newExpanded);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  const totalMachines = venues.reduce((sum, v) => sum + v.totalMachines, 0) + (unassignedVenue?.totalMachines || 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Venues</h1>
          <p className="text-sm text-gray-500">
            {venues.length} venues, {totalMachines} machines
          </p>
        </div>
        <Link
          href="/dashboard/stores/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          + Add Venue
        </Link>
      </div>

      <div className="space-y-3">
        {venues.map((venue) => (
          <div key={venue.store._id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Venue Header */}
            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleVenue(venue.store._id)}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedVenues.has(venue.store._id) ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <h2 className="font-semibold text-gray-900">{venue.store.storeName || venue.store.name}</h2>
                  <p className="text-xs text-gray-500">
                    {venue.hubs.length} hub{venue.hubs.length !== 1 ? 's' : ''} · {venue.totalMachines} machine{venue.totalMachines !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {venue.deployedCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                    {venue.deployedCount} deployed
                  </span>
                )}
                {venue.storageCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {venue.storageCount} storage
                  </span>
                )}
                {venue.repairCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {venue.repairCount} repair
                  </span>
                )}
                <Link
                  href={`/dashboard/stores/${venue.store._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                >
                  Edit
                </Link>
              </div>
            </div>

            {/* Expanded Venue Content */}
            {expandedVenues.has(venue.store._id) && (
              <div className="border-t bg-gray-50">
                {venue.hubs.map((hubData) => (
                  <div key={hubData.hub.machineId} className="border-b last:border-b-0">
                    {/* Hub Header */}
                    <div
                      className="px-4 py-2 pl-10 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleHub(hubData.hub.machineId)}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedHubs.has(hubData.hub.machineId) ? 'rotate-90' : ''}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${hubData.hub.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="font-medium text-gray-700">{formatHubName(hubData.hub)}</span>
                          <span className="text-xs text-gray-400">{hubData.hub.machineId}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {hubData.machines.length} machine{hubData.machines.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Hub Machines */}
                    {expandedHubs.has(hubData.hub.machineId) && (
                      <div className="pl-16 pr-4 pb-2 pt-1 space-y-1">
                        {hubData.machines.map((machine) => (
                          <Link
                            key={machine._id}
                            href={`/dashboard/machines/${machine._id}`}
                            className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-white group"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${statusColors[machine.physicalStatus || 'storage']}`} />
                              <span className="text-sm text-gray-700 group-hover:text-blue-600">
                                {formatMachineName(machine)}
                              </span>
                              {machine.gameTitle && (
                                <span className="text-xs text-gray-400">{machine.gameTitle}</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-blue-500">
                              View →
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Unassigned machines in this venue */}
                {venue.unassignedMachines.length > 0 && (
                  <div className="px-4 py-2 pl-10">
                    <p className="text-xs text-gray-500 mb-2">No hub assigned:</p>
                    <div className="space-y-1">
                      {venue.unassignedMachines.map((machine) => (
                        <Link
                          key={machine._id}
                          href={`/dashboard/machines/${machine._id}`}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white text-sm text-gray-600"
                        >
                          <span className={`w-2 h-2 rounded-full ${statusColors[machine.physicalStatus || 'storage']}`} />
                          {formatMachineName(machine)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Unassigned Machines Section */}
        {unassignedVenue && unassignedVenue.totalMachines > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden border-l-4 border-orange-400">
            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => toggleVenue('_unassigned')}
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedVenues.has('_unassigned') ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <h2 className="font-semibold text-orange-700">Unassigned Machines</h2>
                  <p className="text-xs text-gray-500">
                    {unassignedVenue.totalMachines} machine{unassignedVenue.totalMachines !== 1 ? 's' : ''} not assigned to a venue
                  </p>
                </div>
              </div>
            </div>

            {expandedVenues.has('_unassigned') && (
              <div className="border-t bg-gray-50 px-4 py-2 space-y-1">
                {unassignedVenue.unassignedMachines.map((machine) => (
                  <Link
                    key={machine._id}
                    href={`/dashboard/machines/${machine._id}`}
                    className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${statusColors[machine.physicalStatus || 'storage']}`} />
                      <span className="text-sm text-gray-700">{formatMachineName(machine)}</span>
                    </div>
                    <span className="text-xs text-gray-400">View →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {venues.length === 0 && !unassignedVenue && (
          <div className="text-center py-10 text-gray-500">
            No venues found. <Link href="/dashboard/stores/new" className="text-blue-600 hover:underline">Add your first venue</Link>
          </div>
        )}
      </div>
    </div>
  );
}
