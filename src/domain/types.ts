export interface Product {
  id: string;
  name: string;
}

export interface OrderEntry {
  id: string;
  quantity: number;
}

export type OrderStatus = "completed" | "cancelled";

export interface Order {
  orderId: string;
  customerId?: string;
  entries?: OrderEntry[];
  date: string;
  status: OrderStatus;
}

export interface CompletedOrder extends Order {
  customerId: string;
  entries: OrderEntry[];
  status: "completed";
}

export interface ProductWinner {
  product: Product | null;
  salesCount: number;
}

export interface DailySizzlingHotProduct extends ProductWinner {
  date: string;
}

export interface PeriodSizzlingHotProduct extends ProductWinner {
  from: string;
  to: string;
}

export interface SizzlingHotSummary {
  today: string;
  daily: DailySizzlingHotProduct[];
  period: PeriodSizzlingHotProduct;
}
