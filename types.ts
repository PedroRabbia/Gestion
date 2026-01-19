
export interface StockProduct {
  id: string;
  name: string;
  quantity: number;
  kilos: number;
  unitPrice: number;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  active: boolean;
  currentBalance: number;
}

export interface InvoiceItem {
  id: string;
  quantity: number;
  detail: string;
  kilos: number;
  unitPrice: number;
  total: number;
}

export interface ClientInvoice {
  id: string;
  invoiceNumber: number;
  clientId: string;
  date: string;
  items: InvoiceItem[];
  previousBalance: number;
  invoiceTotal: number;
  cashPayment: number;
  finalBalance: number;
  closed: boolean;
  type?: 'sale' | 'payment'; // 'sale' = Venta con items, 'payment' = Solo entrega de dinero
}

export interface Supplier {
  id: string;
  name: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: number;
  supplierId: string;
  date: string;
  items: InvoiceItem[];
  closed: boolean;
}

export type AppView = 'home' | 'clients' | 'stock' | 'suppliers' | 'client_detail' | 'supplier_detail' | 'metrics';
