import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Client, Payment } from '@/types';
import { api } from '@/lib/api';

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  addClient: (clientData: {
    userId: string;
    installmentPrice: number;
    numberOfMonths: number;
    startDate: string;
  }) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  addPayment: (clientId: string, payment: { amount: number; date: string; monthNumber: number; note?: string }) => Promise<void>;
  clearMonthPayments: (clientId: string, monthNumber: number) => Promise<void>;
  getDashboardStats: () => Promise<import('@/types').DashboardStats>;
  refreshStatuses: () => Promise<void>;
  sendReminder: (clientId: string) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = useCallback(async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const addClient = useCallback(async (clientData: {
    userId: string;
    installmentPrice: number;
    numberOfMonths: number;
    startDate: string;
  }): Promise<Client> => {
    const newClient = await api.createClient(clientData);
    setClients(prev => [newClient, ...prev]);
    return newClient;
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    await api.deleteClient(id);
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const getClient = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const addPayment = useCallback(async (clientId: string, payment: {
    amount: number;
    date: string;
    monthNumber: number;
    note?: string;
  }) => {
    const result = await api.addPayment({ clientId, ...payment });
    setClients(prev =>
      prev.map(c =>
        c.id === clientId
          ? {
              ...c,
              remainingBalance: result.remainingBalance,
              status: result.status as Client['status'],
              nextPaymentDate: result.nextPaymentDate,
              payments: result.payments as Payment[],
            }
          : c
      )
    );
  }, []);

  const clearMonthPayments = useCallback(async (clientId: string, monthNumber: number) => {
    const result = await api.clearMonthPayments(clientId, monthNumber);
    setClients(prev =>
      prev.map(c =>
        c.id === clientId
          ? {
              ...c,
              remainingBalance: result.remainingBalance,
              status: result.status as Client['status'],
              nextPaymentDate: result.nextPaymentDate,
              payments: result.payments as Payment[],
            }
          : c
      )
    );
  }, []);

  const getDashboardStats = useCallback(async () => {
    return api.getStats();
  }, []);

  const refreshStatuses = useCallback(async () => {
    await api.refreshStatuses();
    await loadClients();
  }, [loadClients]);

  const sendReminder = useCallback(async (clientId: string) => {
    await api.sendReminder(clientId);
  }, []);

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading,
        addClient,
        deleteClient,
        getClient,
        addPayment,
        clearMonthPayments,
        getDashboardStats,
        refreshStatuses,
        sendReminder,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
}
