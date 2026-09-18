export type Language = 'hi' | 'pa' | 'en' | 'ja';

export type StoreType = 'general_store' | 'kirana' | 'stationery' | 'uniform' | 'gift_shop';

export interface UserProfile {
  uid: string;
  shopName: string;
  ownerName: string;
  language: Language;
  storeType: StoreType;
  phone: string;
  createdAt: string;
}

export type ExchangeType = 'exchangeable' | 'loss' | 'none';

export interface StockItem {
  id: string;
  name: string;
  barcode?: string; // Standard EAN-13, UPC, Code-128 for packaged goods
  category: string;
  unit: string; // Free-text: e.g. "पैकेट", "बोरी", "लड़ी", "कट्टा", "पेटी", "दर्जन", "kg", "लीटर"
  currentQuantity: number;
  reorderLevel: number;
  buyPrice: number;
  sellPrice: number;
  packSize?: number; // How many units per carton/crate/bundle when ordering from wholesale
  isPerishable: boolean; // Spoils quickly?
  exchangeType: ExchangeType; // Exchangeable with supplier vs pure loss
  supplierName?: string;
  salesHistory?: number[]; // Daily sales counts over last 7 days for smart reorder
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type StockAvailability = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface PublicCatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  sellPrice?: number; // Shopkeeper-set selling price (strictly no buy price or margins)
  status: StockAvailability;
  updatedAt?: string;
}

export interface PublicStoreInfo {
  storeId: string;
  shopName: string;
  storeType: string;
  phone?: string;
  itemCount: number;
  lastUpdated: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: 'credit' | 'payment'; // 'credit' = उधार दिया (+), 'payment' = रुपये जमा (-)
  amount: number;
  note: string;
  date: string;
  timestamp: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  balance: number; // Positive = customer owes money (बकाया)
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
  lastTransactionType?: 'credit' | 'payment';
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  profit: number; // (sellPrice - buyPrice) * quantity
  totalAmount: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface NightCountItem {
  itemId: string;
  name: string;
  category: string;
  unit: string;
  morningStock: number;
  closingStock: number;
  calculatedSold: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  isPerishable: boolean;
  isExpiryReturn?: boolean;
}

export interface NightCountRecord {
  id: string;
  date: string;
  totalSoldQty: number;
  totalProfit: number;
  itemsCheckedCount: number;
  timestamp: number;
}

export interface ScannedBillItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  category?: string;
  isUncertain?: boolean;
  nameConfidence?: 'high' | 'medium' | 'low';
  qtyConfidence?: 'high' | 'medium' | 'low';
  rateConfidence?: 'high' | 'medium' | 'low';
  matchedItemId?: string;
  existingBuyRate?: number;
  existingSellRate?: number;
  rateComparison?: 'fair' | 'cheaper' | 'costlier' | 'check';
}

export interface ScannedBillDraft {
  vendorName: string;
  billDate: string;
  billNumber: string;
  items: ScannedBillItem[];
  totalAmount: number;
  previousBalanceBaqi?: number;
  billTotal?: number;
  grandTotal?: number;
  paymentMode: 'cash' | 'credit';
}
