const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vdv-api.gambino.gold';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

export function setToken(token: string) {
  localStorage.setItem('auth-token', token);
}

export function clearToken() {
  localStorage.removeItem('auth-token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Unauthorized');
  }

  return res;
}

export const api = {
  // Auth
  login: async (password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('Invalid password');
    const data = await res.json();
    setToken(data.token);
    return data;
  },

  logout: () => {
    clearToken();
  },

  // Machines
  getMachines: async (filters?: { status?: string; hubId?: string; physicalStatus?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.hubId) params.append('hubId', filters.hubId);
    if (filters?.physicalStatus) params.append('physicalStatus', filters.physicalStatus);
    const url = params.toString() ? `/api/machines?${params}` : '/api/machines';
    const res = await fetchAPI(url);
    return res.json();
  },

  getMachinesByHub: async () => {
    const res = await fetchAPI('/api/machines/by-hub');
    return res.json();
  },

  getHubs: async () => {
    const res = await fetchAPI('/api/hubs');
    return res.json();
  },

  getMachine: async (id: string) => {
    const res = await fetchAPI(`/api/machines/${id}`);
    return res.json();
  },

  createMachine: async (data: any) => {
    const res = await fetchAPI('/api/machines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  updateMachine: async (id: string, data: any) => {
    const res = await fetchAPI(`/api/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  deleteMachine: async (id: string) => {
    const res = await fetchAPI(`/api/machines/${id}`, { method: 'DELETE' });
    return res.json();
  },

  generateMachineQR: async (id: string) => {
    const res = await fetchAPI(`/api/machines/${id}/generate-qr`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  getMachineByToken: async (token: string) => {
    const res = await fetch(`${API_URL}/api/machines/by-token/${token}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  // Maintenance
  getMaintenanceLogs: async (machineId?: string) => {
    const url = machineId ? `/api/maintenance?machineId=${machineId}` : '/api/maintenance';
    const res = await fetchAPI(url);
    return res.json();
  },

  createMaintenanceLog: async (data: any) => {
    const res = await fetchAPI('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  // Stores
  getStores: async () => {
    const res = await fetchAPI('/api/stores');
    return res.json();
  },

  getStore: async (id: string) => {
    const res = await fetchAPI(`/api/stores/${id}`);
    return res.json();
  },

  createStore: async (data: any) => {
    const res = await fetchAPI('/api/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  updateStore: async (id: string, data: any) => {
    const res = await fetchAPI(`/api/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  deleteStore: async (id: string) => {
    const res = await fetchAPI(`/api/stores/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Asset Tags
  getTags: async (filters?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    const url = params.toString() ? `/api/tags?${params}` : '/api/tags';
    const res = await fetchAPI(url);
    return res.json();
  },

  getTagByToken: async (token: string) => {
    const res = await fetch(`${API_URL}/api/tags/${token}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  generateTags: async (count: number) => {
    const res = await fetchAPI('/api/tags/generate', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  linkTagToMachine: async (token: string, machineId: string) => {
    const res = await fetchAPI(`/api/tags/${token}/link`, {
      method: 'POST',
      body: JSON.stringify({ machineId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  unlinkTag: async (token: string) => {
    const res = await fetchAPI(`/api/tags/${token}/unlink`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  createMachineWithTag: async (token: string, machineData: any) => {
    const res = await fetchAPI(`/api/tags/${token}/create-machine`, {
      method: 'POST',
      body: JSON.stringify(machineData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },
};
