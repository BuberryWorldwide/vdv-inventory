'use client';

import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Machine {
  _id: string;
  machineId: string;
  originalMachineId?: string;
  name: string;
  displayName?: string;
  gameTitle?: string;
  hubId?: string;
  hubDisplayName?: string;
  storeId?: { _id: string; storeName: string };
  derivedVenue?: string;
  status: string;
  physicalStatus?: string;
  manufacturer?: string;
  machineModel?: string;
  serialNumber?: string;
  location?: string;
  credentials?: { lockPin?: string; attendantPin?: string };
  inventoryNotes?: string;
}

// Helper to format machine name for display
function formatMachineName(machine: Machine): string {
  // If displayName is set, use it
  if (machine.displayName) return machine.displayName;

  // Try to format originalMachineId nicely (machine_01 -> "Machine 01")
  const idToFormat = machine.originalMachineId || machine.machineId;

  // Handle formats like "machine_01", "machine_07", etc.
  const machineMatch = idToFormat.match(/^machine[_-]?(\d+)$/i);
  if (machineMatch) {
    return `Machine ${machineMatch[1].padStart(2, '0')}`;
  }

  // Handle composite IDs like "pi-2-nimbus-1_machine_01" - extract the machine part
  const compositeMatch = idToFormat.match(/machine[_-]?(\d+)$/i);
  if (compositeMatch) {
    return `Machine ${compositeMatch[1].padStart(2, '0')}`;
  }

  // Handle other formats - just capitalize and clean up
  if (machine.name && machine.name !== idToFormat) {
    return machine.name;
  }

  // Last resort: clean up the ID
  return idToFormat
    .replace(/^(pi-\d+-\w+-\d+_)/, '') // Remove hub prefix
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface Store {
  _id: string;
  storeId: string;
  name?: string;
  storeName?: string;
}

interface Hub {
  _id: string;
  machineId: string;
  name: string;
  hubId?: string;
}

interface EditForm {
  displayName: string;
  gameTitle: string;
  manufacturer: string;
  machineModel: string;
  serialNumber: string;
  hubId: string;
  storeId: string;
  physicalStatus: string;
  lockPin: string;
  attendantPin: string;
  inventoryNotes: string;
}

type SortField = 'machineId' | 'displayName' | 'gameTitle' | 'makeModel' | 'serialNumber' | 'hubId' | 'venue' | 'physicalStatus';
type SortDirection = 'asc' | 'desc';

type ColumnKey = 'select' | 'machineId' | 'displayName' | 'gameTitle' | 'makeModel' | 'serialNumber' | 'hub' | 'venue' | 'status' | 'pins' | 'notes' | 'actions';

interface Column {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
  sortField?: SortField;
  width?: string;
}

const ALL_COLUMNS: Column[] = [
  { key: 'select', label: '', defaultVisible: true, width: 'w-10' },
  { key: 'machineId', label: 'ID', defaultVisible: true, sortField: 'machineId', width: 'w-28' },
  { key: 'displayName', label: 'Name', defaultVisible: true, sortField: 'displayName', width: 'w-32' },
  { key: 'gameTitle', label: 'Game', defaultVisible: true, sortField: 'gameTitle', width: 'w-32' },
  { key: 'makeModel', label: 'Make/Model', defaultVisible: true, sortField: 'makeModel', width: 'w-36' },
  { key: 'serialNumber', label: 'Serial #', defaultVisible: false, sortField: 'serialNumber', width: 'w-28' },
  { key: 'hub', label: 'Hub', defaultVisible: false, sortField: 'hubId', width: 'w-32' },
  { key: 'venue', label: 'Venue', defaultVisible: true, sortField: 'venue', width: 'w-32' },
  { key: 'status', label: 'Status', defaultVisible: true, sortField: 'physicalStatus', width: 'w-28' },
  { key: 'pins', label: 'PINs', defaultVisible: false, width: 'w-28' },
  { key: 'notes', label: 'Notes', defaultVisible: false, width: 'w-40' },
  { key: 'actions', label: '', defaultVisible: true, width: 'w-24' },
];

const statusColors: Record<string, string> = {
  deployed: 'bg-green-100 text-green-800 border-green-200',
  storage: 'bg-gray-100 text-gray-800 border-gray-200',
  repair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  decommissioned: 'bg-red-100 text-red-800 border-red-200',
};

const physicalStatusOptions = [
  { value: '', label: 'All Status' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'storage', label: 'Storage' },
  { value: 'repair', label: 'Repair' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const statusOnlyOptions = physicalStatusOptions.filter(o => o.value !== '');

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  const isActive = field === currentField;
  return (
    <span className="ml-1 inline-flex flex-col">
      <svg className={`w-2 h-2 ${isActive && direction === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 8 4" fill="currentColor">
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg className={`w-2 h-2 -mt-0.5 ${isActive && direction === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 8 4" fill="currentColor">
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );
}

function MachinesContent() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hubFilter, setHubFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('machineId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const searchParams = useSearchParams();

  // Spreadsheet state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    const defaults = new Set<ColumnKey>();
    ALL_COLUMNS.forEach(col => { if (col.defaultVisible) defaults.add(col.key); });
    return defaults;
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showBulkVenueModal, setShowBulkVenueModal] = useState(false);
  const [bulkVenueTarget, setBulkVenueTarget] = useState('');

  // New machine state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachine, setNewMachine] = useState({ machineId: '', displayName: '', gameTitle: '', manufacturer: '', machineModel: '' });
  const [addingMachine, setAddingMachine] = useState(false);

  useEffect(() => {
    const hub = searchParams.get('hub');
    const venue = searchParams.get('venue');
    const status = searchParams.get('status');
    if (hub) setHubFilter(hub);
    if (venue) setVenueFilter(venue);
    if (status) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [machinesData, hubsData, storesData] = await Promise.all([
          api.getMachines(),
          api.getHubs(),
          api.getStores(),
        ]);
        setMachines(machinesData);
        setHubs(hubsData);
        setStores(storesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Load saved column preferences
  useEffect(() => {
    const saved = localStorage.getItem('machine-columns');
    if (saved) {
      try {
        setVisibleColumns(new Set(JSON.parse(saved)));
      } catch {}
    }
  }, []);

  const saveColumnPrefs = (cols: Set<ColumnKey>) => {
    localStorage.setItem('machine-columns', JSON.stringify(Array.from(cols)));
    setVisibleColumns(cols);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedMachines = useMemo(() => {
    const filtered = machines.filter((machine) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = search === '' ||
        machine.machineId.toLowerCase().includes(searchLower) ||
        (machine.name || '').toLowerCase().includes(searchLower) ||
        (machine.displayName || '').toLowerCase().includes(searchLower) ||
        (machine.gameTitle || '').toLowerCase().includes(searchLower) ||
        (machine.manufacturer || '').toLowerCase().includes(searchLower) ||
        (machine.machineModel || '').toLowerCase().includes(searchLower) ||
        (machine.serialNumber || '').toLowerCase().includes(searchLower) ||
        (machine.storeId?.storeName || '').toLowerCase().includes(searchLower) ||
        (machine.derivedVenue || '').toLowerCase().includes(searchLower);

      const matchesHub = hubFilter === '' || machine.hubId === hubFilter;
      const matchesVenue = venueFilter === '' || machine.storeId?._id === venueFilter;
      const matchesStatus = statusFilter === '' || machine.physicalStatus === statusFilter;

      return matchesSearch && matchesHub && matchesVenue && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';

      switch (sortField) {
        case 'machineId':
          aVal = a.machineId || '';
          bVal = b.machineId || '';
          break;
        case 'displayName':
          aVal = formatMachineName(a);
          bVal = formatMachineName(b);
          break;
        case 'gameTitle':
          aVal = a.gameTitle || '';
          bVal = b.gameTitle || '';
          break;
        case 'makeModel':
          aVal = `${a.manufacturer || ''} ${a.machineModel || ''}`.trim();
          bVal = `${b.manufacturer || ''} ${b.machineModel || ''}`.trim();
          break;
        case 'serialNumber':
          aVal = a.serialNumber || '';
          bVal = b.serialNumber || '';
          break;
        case 'hubId':
          aVal = a.hubDisplayName || a.hubId || '';
          bVal = b.hubDisplayName || b.hubId || '';
          break;
        case 'venue':
          aVal = a.storeId?.storeName || a.derivedVenue || '';
          bVal = b.storeId?.storeName || b.derivedVenue || '';
          break;
        case 'physicalStatus':
          aVal = a.physicalStatus || '';
          bVal = b.physicalStatus || '';
          break;
      }

      const comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [machines, search, hubFilter, venueFilter, statusFilter, sortField, sortDirection]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedMachines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedMachines.map(m => m._id)));
    }
  };

  // Edit handlers
  const startEditing = (machine: Machine) => {
    setEditingId(machine._id);
    setEditForm({
      displayName: machine.displayName || '',
      gameTitle: machine.gameTitle || '',
      manufacturer: machine.manufacturer || '',
      machineModel: machine.machineModel || '',
      serialNumber: machine.serialNumber || '',
      hubId: machine.hubId || '',
      storeId: machine.storeId?._id || '',
      physicalStatus: machine.physicalStatus || 'deployed',
      lockPin: machine.credentials?.lockPin || '',
      attendantPin: machine.credentials?.attendantPin || '',
      inventoryNotes: machine.inventoryNotes || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEditing = async () => {
    if (!editingId || !editForm) return;
    setSaving(true);
    try {
      const payload = {
        displayName: editForm.displayName || undefined,
        gameTitle: editForm.gameTitle || undefined,
        manufacturer: editForm.manufacturer || undefined,
        machineModel: editForm.machineModel || undefined,
        serialNumber: editForm.serialNumber || undefined,
        hubId: editForm.hubId || null,
        storeId: editForm.storeId || null,
        physicalStatus: editForm.physicalStatus,
        credentials: (editForm.lockPin || editForm.attendantPin) ? {
          lockPin: editForm.lockPin || undefined,
          attendantPin: editForm.attendantPin || undefined,
        } : undefined,
        inventoryNotes: editForm.inventoryNotes || undefined,
      };
      const updated = await api.updateMachine(editingId, payload);
      setMachines(machines.map(m => m._id === editingId ? { ...m, ...updated } : m));
      setEditingId(null);
      setEditForm(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Bulk action handlers
  const executeBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;

    if (action === 'reassign') {
      setShowBulkVenueModal(true);
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Delete ${selectedIds.size} machine(s)? This cannot be undone.`)) return;
      const idsArray = Array.from(selectedIds);
      for (const id of idsArray) {
        try {
          await api.deleteMachine(id);
        } catch {}
      }
      setMachines(machines.filter(m => !selectedIds.has(m._id)));
      setSelectedIds(new Set());
      return;
    }

    // Status changes
    const statusMap: Record<string, string> = {
      'to-storage': 'storage',
      'to-repair': 'repair',
      'to-deployed': 'deployed',
      'to-decommissioned': 'decommissioned',
    };

    const newStatus = statusMap[action];
    if (!newStatus) return;

    const idsToUpdate = Array.from(selectedIds);
    for (const id of idsToUpdate) {
      try {
        await api.updateMachine(id, { physicalStatus: newStatus });
      } catch {}
    }

    setMachines(machines.map(m =>
      selectedIds.has(m._id) ? { ...m, physicalStatus: newStatus } : m
    ));
    setSelectedIds(new Set());
  };

  const executeBulkReassign = async () => {
    if (!bulkVenueTarget) return;
    const idsToReassign = Array.from(selectedIds);
    for (const id of idsToReassign) {
      try {
        await api.updateMachine(id, { storeId: bulkVenueTarget });
      } catch {}
    }
    // Refresh to get updated store data
    const machinesData = await api.getMachines();
    setMachines(machinesData);
    setSelectedIds(new Set());
    setShowBulkVenueModal(false);
    setBulkVenueTarget('');
  };

  // Add machine handler
  const handleAddMachine = async () => {
    if (!newMachine.machineId) {
      alert('Machine ID is required');
      return;
    }
    setAddingMachine(true);
    try {
      const created = await api.createMachine({
        machineId: newMachine.machineId,
        name: newMachine.displayName || newMachine.machineId,
        displayName: newMachine.displayName || undefined,
        gameTitle: newMachine.gameTitle || undefined,
        manufacturer: newMachine.manufacturer || undefined,
        machineModel: newMachine.machineModel || undefined,
        physicalStatus: 'storage',
      });
      setMachines([created, ...machines]);
      setShowAddModal(false);
      setNewMachine({ machineId: '', displayName: '', gameTitle: '', manufacturer: '', machineModel: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to create machine');
    } finally {
      setAddingMachine(false);
    }
  };

  const isColumnVisible = (key: ColumnKey) => visibleColumns.has(key);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  const selectedCount = selectedIds.size;
  const allSelected = selectedCount > 0 && selectedCount === filteredAndSortedMachines.length;
  const someSelected = selectedCount > 0 && selectedCount < filteredAndSortedMachines.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-3">
        <h1 className="text-xl font-bold text-gray-900">
          Machines
          <span className="text-gray-400 font-normal text-sm ml-2">({filteredAndSortedMachines.length})</span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          + Add Machine
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 mb-3 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1 min-w-[150px]"
        />
        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="">All Venues</option>
          {stores.map((store) => (
            <option key={store._id} value={store._id}>
              {store.storeName || store.name}
            </option>
          ))}
        </select>
        <select
          value={hubFilter}
          onChange={(e) => setHubFilter(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="">All Hubs</option>
          {hubs.map((hub) => (
            <option key={hub._id} value={hub.hubId || hub.machineId}>
              {hub.name || hub.hubId || hub.machineId}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm"
        >
          {physicalStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Column picker */}
        <div className="relative">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="border rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Columns ▼
          </button>
          {showColumnPicker && (
            <div className="absolute right-0 mt-1 bg-white border rounded shadow-lg z-20 p-2 min-w-[150px]">
              {ALL_COLUMNS.filter(c => c.key !== 'select' && c.key !== 'actions').map(col => (
                <label key={col.key} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col.key)}
                    onChange={() => {
                      const newCols = new Set(visibleColumns);
                      if (newCols.has(col.key)) {
                        newCols.delete(col.key);
                      } else {
                        newCols.add(col.key);
                      }
                      saveColumnPrefs(newCols);
                    }}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-800 font-medium">{selectedCount} selected</span>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => executeBulkAction('to-deployed')}
              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
            >
              → Deployed
            </button>
            <button
              onClick={() => executeBulkAction('to-storage')}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              → Storage
            </button>
            <button
              onClick={() => executeBulkAction('to-repair')}
              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
            >
              → Repair
            </button>
            <button
              onClick={() => executeBulkAction('reassign')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Reassign Venue
            </button>
            <button
              onClick={() => executeBulkAction('delete')}
              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Mobile card view */}
      <div className="md:hidden space-y-2 flex-1 overflow-auto">
        {filteredAndSortedMachines.map((machine) => (
          <div key={machine._id} className="bg-white rounded-lg shadow p-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(machine._id)}
                onChange={() => toggleSelect(machine._id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 truncate">
                      {formatMachineName(machine)}
                    </p>
                    <p className="text-xs text-gray-500">{machine.machineId}</p>
                  </div>
                  {machine.physicalStatus && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[machine.physicalStatus] || 'bg-gray-100'}`}>
                      {machine.physicalStatus}
                    </span>
                  )}
                </div>
                {machine.gameTitle && (
                  <p className="text-sm text-gray-600 mt-1">{machine.gameTitle}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {machine.storeId?.storeName || machine.derivedVenue || 'Unassigned'}
                </p>
              </div>
              <Link
                href={`/dashboard/machines/${machine._id}`}
                className="text-blue-600 text-sm"
              >
                View
              </Link>
            </div>
          </div>
        ))}
        {filteredAndSortedMachines.length === 0 && (
          <div className="text-center py-10 text-gray-500">No machines found</div>
        )}
      </div>

      {/* Desktop spreadsheet view */}
      <div className="hidden md:block flex-1 bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {isColumnVisible('select') && (
                  <th className="px-2 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                {isColumnVisible('machineId') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('machineId')}
                  >
                    <span className="flex items-center">
                      ID<SortIcon field="machineId" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('displayName') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('displayName')}
                  >
                    <span className="flex items-center">
                      Name<SortIcon field="displayName" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('gameTitle') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('gameTitle')}
                  >
                    <span className="flex items-center">
                      Game<SortIcon field="gameTitle" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('makeModel') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('makeModel')}
                  >
                    <span className="flex items-center">
                      Make/Model<SortIcon field="makeModel" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('serialNumber') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('serialNumber')}
                  >
                    <span className="flex items-center">
                      Serial<SortIcon field="serialNumber" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('hub') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('hubId')}
                  >
                    <span className="flex items-center">
                      Hub<SortIcon field="hubId" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('venue') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('venue')}
                  >
                    <span className="flex items-center">
                      Venue<SortIcon field="venue" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('status') && (
                  <th
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('physicalStatus')}
                  >
                    <span className="flex items-center">
                      Status<SortIcon field="physicalStatus" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                )}
                {isColumnVisible('pins') && (
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    PINs
                  </th>
                )}
                {isColumnVisible('notes') && (
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                )}
                {isColumnVisible('actions') && (
                  <th className="px-2 py-2 w-24"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedMachines.map((machine) => {
                const isEditing = editingId === machine._id;
                return (
                  <tr key={machine._id} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                    {isColumnVisible('select') && (
                      <td className="px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(machine._id)}
                          onChange={() => toggleSelect(machine._id)}
                        />
                      </td>
                    )}
                    {isColumnVisible('machineId') && (
                      <td className="px-2 py-1.5 font-mono text-xs">
                        <Link href={`/dashboard/machines/${machine._id}`} className="text-blue-600 hover:underline">
                          {machine.machineId}
                        </Link>
                      </td>
                    )}
                    {isColumnVisible('displayName') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm?.displayName || ''}
                            onChange={(e) => setEditForm({ ...editForm!, displayName: e.target.value })}
                            className="w-full border rounded px-1.5 py-0.5 text-sm"
                            placeholder={formatMachineName(machine)}
                          />
                        ) : (
                          <span className={machine.displayName ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                            {formatMachineName(machine)}
                          </span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('gameTitle') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm?.gameTitle || ''}
                            onChange={(e) => setEditForm({ ...editForm!, gameTitle: e.target.value })}
                            className="w-full border rounded px-1.5 py-0.5 text-sm"
                            placeholder="Game title..."
                          />
                        ) : (
                          <span className="text-gray-600">{machine.gameTitle || <span className="text-gray-300">-</span>}</span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('makeModel') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={editForm?.manufacturer || ''}
                              onChange={(e) => setEditForm({ ...editForm!, manufacturer: e.target.value })}
                              className="w-1/2 border rounded px-1.5 py-0.5 text-sm"
                              placeholder="Make"
                            />
                            <input
                              type="text"
                              value={editForm?.machineModel || ''}
                              onChange={(e) => setEditForm({ ...editForm!, machineModel: e.target.value })}
                              className="w-1/2 border rounded px-1.5 py-0.5 text-sm"
                              placeholder="Model"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            {machine.manufacturer || machine.machineModel
                              ? `${machine.manufacturer || ''} ${machine.machineModel || ''}`.trim()
                              : <span className="text-gray-300">-</span>}
                          </span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('serialNumber') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm?.serialNumber || ''}
                            onChange={(e) => setEditForm({ ...editForm!, serialNumber: e.target.value })}
                            className="w-full border rounded px-1.5 py-0.5 text-sm font-mono"
                          />
                        ) : (
                          <span className="font-mono text-xs text-gray-500">{machine.serialNumber || '-'}</span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('hub') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <select
                            value={editForm?.hubId || ''}
                            onChange={(e) => setEditForm({ ...editForm!, hubId: e.target.value })}
                            className="w-full border rounded px-1 py-0.5 text-sm"
                          >
                            <option value="">None</option>
                            {hubs.map((hub) => (
                              <option key={hub._id} value={hub.hubId || hub.machineId}>
                                {hub.name || hub.hubId || hub.machineId}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-500 text-xs">{machine.hubDisplayName || machine.hubId || '-'}</span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('venue') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <select
                            value={editForm?.storeId || ''}
                            onChange={(e) => setEditForm({ ...editForm!, storeId: e.target.value })}
                            className="w-full border rounded px-1 py-0.5 text-sm"
                          >
                            <option value="">None</option>
                            {stores.map((store) => (
                              <option key={store._id} value={store._id}>
                                {store.storeName || store.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-600 text-xs">{machine.storeId?.storeName || machine.derivedVenue || '-'}</span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('status') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <select
                            value={editForm?.physicalStatus || ''}
                            onChange={(e) => setEditForm({ ...editForm!, physicalStatus: e.target.value })}
                            className="w-full border rounded px-1 py-0.5 text-sm"
                          >
                            {statusOnlyOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          machine.physicalStatus ? (
                            <span className={`px-1.5 py-0.5 text-xs rounded ${statusColors[machine.physicalStatus]}`}>
                              {machine.physicalStatus}
                            </span>
                          ) : <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('pins') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={editForm?.lockPin || ''}
                              onChange={(e) => setEditForm({ ...editForm!, lockPin: e.target.value })}
                              className="w-1/2 border rounded px-1 py-0.5 text-xs font-mono"
                              placeholder="Lock"
                            />
                            <input
                              type="text"
                              value={editForm?.attendantPin || ''}
                              onChange={(e) => setEditForm({ ...editForm!, attendantPin: e.target.value })}
                              className="w-1/2 border rounded px-1 py-0.5 text-xs font-mono"
                              placeholder="Att"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-gray-500">
                            {machine.credentials?.lockPin || machine.credentials?.attendantPin
                              ? `${machine.credentials?.lockPin || '-'}/${machine.credentials?.attendantPin || '-'}`
                              : '-'}
                          </span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('notes') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm?.inventoryNotes || ''}
                            onChange={(e) => setEditForm({ ...editForm!, inventoryNotes: e.target.value })}
                            className="w-full border rounded px-1.5 py-0.5 text-sm"
                          />
                        ) : (
                          <span className="text-gray-500 text-xs truncate block max-w-[150px]" title={machine.inventoryNotes}>
                            {machine.inventoryNotes || '-'}
                          </span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('actions') && (
                      <td className="px-2 py-1.5">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={saveEditing}
                              disabled={saving}
                              className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                            >
                              {saving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-500 hover:text-gray-700 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(machine)}
                              className="text-gray-400 hover:text-blue-600"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <Link
                              href={`/dashboard/machines/${machine._id}`}
                              className="text-gray-400 hover:text-gray-600"
                              title="View details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredAndSortedMachines.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                    No machines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Machine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Add New Machine</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID *</label>
                <input
                  type="text"
                  value={newMachine.machineId}
                  onChange={(e) => setNewMachine({ ...newMachine, machineId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., slot-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newMachine.displayName}
                  onChange={(e) => setNewMachine({ ...newMachine, displayName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Lucky 7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Title</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newMachine.manufacturer}
                    onChange={(e) => setNewMachine({ ...newMachine, manufacturer: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., IGT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={newMachine.machineModel}
                    onChange={(e) => setNewMachine({ ...newMachine, machineModel: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., S2000"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMachine}
                disabled={addingMachine}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {addingMachine ? 'Adding...' : 'Add Machine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reassign Venue Modal */}
      {showBulkVenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-4">Reassign {selectedCount} Machine(s)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Venue</label>
              <select
                value={bulkVenueTarget}
                onChange={(e) => setBulkVenueTarget(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a venue...</option>
                {stores.map((store) => (
                  <option key={store._id} value={store._id}>
                    {store.storeName || store.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowBulkVenueModal(false); setBulkVenueTarget(''); }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkReassign}
                disabled={!bulkVenueTarget}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close column picker */}
      {showColumnPicker && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowColumnPicker(false)}
        />
      )}
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
