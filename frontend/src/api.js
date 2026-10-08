const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('cst_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem('cst_token') || null;
}

export function setSession(token, user) {
  if (token) localStorage.setItem('cst_token', token);
  if (user) localStorage.setItem('cst_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('cst_token');
  localStorage.removeItem('cst_user');
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

// The 5 client API calls matching the 5 backend endpoints
export const api = {
  // 1. Send OTP (Minimoth API)
  sendOtp: (phone) => request('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),

  // 2. Verify OTP & authenticate
  verifyOtp: async (phone, code, name) => {
    const res = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    });
    if (res.token && res.user) {
      setSession(res.token, res.user);
    }
    return res;
  },

  // 3. Get all tickets
  getTickets: () => request('/api/tickets', { method: 'GET' }),

  // 4. Create new ticket
  createTicket: (payload) => request('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // 5. Reply to ticket / update status
  replyTicket: (ticketId, payload) => request(`/api/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};
