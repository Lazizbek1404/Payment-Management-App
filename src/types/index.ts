export type PaymentStatus = 'paying' | 'overdue' | 'completed';
export type Language = 'en' | 'uz' | 'ru';

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  monthNumber: number;
  note?: string;
  partial?: boolean;
  groupId?: string;
  cancelled?: boolean;
  cancelledAt?: string;
  overpayment?: boolean;
}

export interface Client {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  telegramUsername: string;
  telegramId: number;
  language: Language;
  courseName: string;
  installmentPrice: number;
  numberOfMonths: number;
  startDate: string;
  monthlyPayment: number;
  remainingBalance: number;
  status: PaymentStatus;
  nextPaymentDate: string;
  payments: Payment[];
  createdAt: string;
}

export interface RegisteredUser {
  id: string;
  telegramId: number;
  telegramUsername: string;
  fullName: string;
  phoneNumber: string;
  language: Language;
  status: string;
  registeredAt: string;
}

export interface DashboardStats {
  totalClients: number;
  overdueClients: number;
  totalCollected: number;
  monthlyData: {
    month: string;
    amount: number;
  }[];
}

export interface User {
  username: string;
  isAuthenticated: boolean;
}
