export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  type?: string;
  tax_id?: string;
}

export interface ServiceItem {
  type: string;
  vehicle: string;
  price: number;
  quantity?: number;
  unitPrice?: number;
  // Campos adicionales específicos por tipo
  material?: string;
  rodado?: string;
  marca?: string;
  modelo?: string;
  medida?: string;
  tipoNeumatico?: string;
  tipoRepuesto?: string;
}

export interface Service {
  id: string;
  clientId: string;
  date: string;
  type: string;
  vehicle: string;
  notes: string;
  amount: number;
  amount_delivered?: number;
  paymentMethod: string;
  status: string;
  signature?: string;
  serviceItems?: ServiceItem[];
  responsiblePerson?: string;
  companyRepresentative?: string;
}

export interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  date: string;
  notes?: string;
}