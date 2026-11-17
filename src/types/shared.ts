// Shared types for consistent usage across all components

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  notes?: string;
  taxId?: string;
  type?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  clientId: string;
  date: string;
  type: string;
  vehicle: string;
  notes: string;
  amount: number;
  amountDelivered?: number;
  paymentMethod: string;
  secondaryPaymentMethod?: string;
  status: string;
  responsiblePerson?: string;
  companyRepresentative?: string;
  signature?: string;
  category?: string;
  serviceItems?: Array<{
    type: string;
    vehicle: string;
    price: number;
    quantity?: number;
  }>;
}

export interface Debt {
  id: string;
  clientId: string;
  serviceId: string;
  amount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'active' | 'uncollectible' | string;
  comments: string;
  signature?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: string;
  date: string;
  notes: string;
}

export interface PaymentPlan {
  id: string;
  clientId: string;
  serviceId: string;
  totalAmount: number;
  type: 'installments';
  installments: Array<{
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
    paymentMethod?: string;
    paymentDate?: string;
  }>;
  comments: string;
  createdAt: string;
  signature?: string;
}