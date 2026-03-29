export type AppTheme = 'dark' | 'light' | 'gray';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  status: 'pending' | 'authorized' | 'rejected';
  createdAt: number;
}

export interface Client {
  id: string;
  name: string;
  cpf?: string;
  cnpj?: string;
  residentialAddress?: string;
  deliveryAddress?: string;
  email: string;
  phone: string;
  contactDate: string; // ISO string
  referredBy?: string;
  partnerArchitectId?: string;
  partnerArchitectName?: string;
  createdAt: number;
  ownerId: string;
}

export interface Architect {
  id: string;
  name: string;
  cau?: string;
  phone: string;
  email: string;
  officeName?: string;
  address?: string;
  createdAt: number;
  ownerId: string;
}

export type SaleStatus = 'Orcamento' | 'Contrato' | 'Medicao' | 'Producao' | 'Entrega' | 'Finalizado';

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  description: string;
  status: SaleStatus;
  cost: number;
  commission: number;
  miscExpenses: number;
  purchaseDate: string; // ISO string
  deliveryDate: string; // ISO string
  executiveMeasurementDate: string; // ISO string
  executiveProjectApprovalDate: string; // ISO string
  budgetFileUrl?: string;
  contractFileUrl?: string;
  projectFileUrl?: string;
  createdAt: number;
  ownerId: string;
}

export interface CompanySettings {
  name: string;
  logoUrl?: string;
  address?: string;
  contact?: string;
  theme: AppTheme;
  ownerId: string;
}
