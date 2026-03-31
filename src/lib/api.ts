const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_API_KEY || 'coursepay_secret_2024';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Users (bot-registered)
  getRegisteredUsers: () => request<import('@/types').RegisteredUser[]>('/api/users'),

  // Clients
  getClients: () => request<import('@/types').Client[]>('/api/clients'),
  getClient: (id: string) => request<import('@/types').Client>(`/api/clients/${id}`),
  createClient: (data: {
    userId: string;
    installmentPrice: number;
    numberOfMonths: number;
    startDate: string;
  }) =>
    request<import('@/types').Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteClient: (id: string) =>
    request<{ success: boolean }>(`/api/clients/${id}`, { method: 'DELETE' }),

  // Payments
  addPayment: (data: {
    clientId: string;
    amount: number;
    date: string;
    monthNumber: number;
    note?: string;
  }) =>
    request<{
      remainingBalance: number;
      status: string;
      nextPaymentDate: string;
      payments: import('@/types').Payment[];
    }>('/api/payments', { method: 'POST', body: JSON.stringify(data) }),

  clearMonthPayments: (clientId: string, monthNumber: number) =>
    request<{
      remainingBalance: number;
      status: string;
      nextPaymentDate: string;
      payments: import('@/types').Payment[];
    }>('/api/payments/clear', {
      method: 'POST',
      body: JSON.stringify({ clientId, monthNumber }),
    }),

  refreshStatuses: () =>
    request<{ success: boolean }>('/api/payments/refresh-statuses', { method: 'POST' }),

  // Stats
  getStats: () =>
    request<import('@/types').DashboardStats>('/api/stats'),

  // Remind
  sendReminder: (clientId: string) =>
    request<{ success: boolean }>(`/api/remind/${clientId}`, { method: 'POST' }),
};
