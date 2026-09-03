export type Language = 'hi' | 'pa' | 'en';

export type ShopType = 'general_store' | 'stationery';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string; // custom free-text unit (e.g. 'laddi', 'packet', 'kg', 'piece', 'box', 'pouch', 'meter')
  quantity: number;
  reorderLevel: number;
  buyPrice: number;
  sellPrice: number;
  packetSize?: number; // how many come in one packet when ordering (e.g. 4 soaps per packet)
  spoilQuickly: boolean; // Does it spoil quickly (like milk)?
  exchangeableOnSpoil: boolean; // If spoiled, can supplier exchange (like bread), or pure loss (like milk)?
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  profit: number; // (sellPrice - buyPrice) * quantity
  totalAmount: number; // sellPrice * quantity
  timestamp: string; // ISO string
  type: 'quick_sell' | 'night_count';
}

export interface NightCountEntry {
  itemId: string;
  itemName: string;
  previousQty: number;
  countedQty: number;
  soldQty: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
}

export interface NightCountRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  entries: NightCountEntry[];
  totalSoldQty: number;
  totalProfit: number;
  notes?: string;
}

export interface UdhaarTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'credit_given' | 'payment_received';
  amount: number;
  note?: string;
  balanceAfter: number;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  balance: number; // Positive number = customer owes money to the shopkeeper
  transactions: UdhaarTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopProfile {
  id: string;
  identifier: string; // email or phone
  shopName: string;
  shopType: ShopType;
  language: Language;
  onboarded: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScannedBillDraftItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  buyPrice: number;
  totalPrice: number;
  suggestedSellPrice: number;
  suggestedCategory: string;
  spoilQuickly: boolean;
  exchangeableOnSpoil: boolean;
  packetSize?: number;
  matchedItemId?: string; // If matched with existing stock item
}

export interface ReorderSuggestion {
  item: StockItem;
  neededQuantity: number;
  packetsToOrder: number;
  reason: 'low_stock' | 'perishable_velocity';
  avgDailySales: number;
}
