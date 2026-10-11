/**
 * REST API Client for Automated College Timetable Generator
 * Connects frontend directly to the Flask backend and SQL database.
 * Supports JWT authentication headers and automatic token management.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nitk_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${config.method || 'GET'} ${endpoint}]:`, err.message);
    if (err.name === 'TypeError' && err.message?.includes('Failed to fetch')) {
      throw new Error('Unable to connect server');
    }
    throw err;
  }
}

export const api = {
  // --- Authentication ---
  async login({ email, password, hodId, type = 'GENERAL' }) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, hodId, type })
    });
    if (data.token) {
      localStorage.setItem('nitk_token', data.token);
    }
    return data;
  },

  async register({ email, password, name, role = 'VIEWER', department = 'IT', year = 3, semester = 5, section = 'A', userType = 'Student', designation = 'Assistant Professor' }) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role, department, year, semester, section, userType, designation })
    });
    if (data.token) {
      localStorage.setItem('nitk_token', data.token);
    }
    return data;
  },

  async getHods() {
    return request('/auth/hods');
  },

  async forgotPassword({ email, newPassword }) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword })
    });
  },

  async getCurrentUser() {
    return request('/auth/me');
  },

  logout() {
    localStorage.removeItem('nitk_token');
  },

  // --- Schedule Data & Options ---
  async getOptions(department = null, year = null, semester = null) {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (semester) params.append('semester', semester);
    else if (year) params.append('year', year);
    return request(`/schedule/options?${params.toString()}`);
  },

  async getTimetables(filterParams = {}) {
    const params = new URLSearchParams();
    Object.entries(filterParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, v);
      }
    });
    return request(`/schedule/timetables?${params.toString()}`);
  },

  async generateDrafts(params = {}) {
    return request('/schedule/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // --- Review & Approval Workflow ---
  async swapSlots({ sourceTimetableId, targetTimetableId, source, target }) {
    return request('/review/swap', {
      method: 'POST',
      body: JSON.stringify({
        sourceTimetableId,
        targetTimetableId: targetTimetableId || sourceTimetableId,
        source,
        target
      })
    });
  },

  async approveTimetable(timetableId) {
    return request('/review/approve', {
      method: 'PUT',
      body: JSON.stringify({ timetableId })
    });
  },

  async revertTimetable(timetableId) {
    return request('/review/revert', {
      method: 'PUT',
      body: JSON.stringify({ timetableId })
    });
  },

  async disapproveTimetable(timetableId) {
    return request('/review/revert', {
      method: 'PUT',
      body: JSON.stringify({ timetableId })
    });
  },

  async deleteTimetable(timetableId) {
    return request('/review/delete', {
      method: 'DELETE',
      body: JSON.stringify({ timetableId })
    });
  }
};

