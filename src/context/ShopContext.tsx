import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Language,
  ShopType,
  StockItem,
  Sale,
  NightCountRecord,
  Customer,
  UdhaarTransaction,
  ShopProfile,
  ReorderSuggestion,
  ScannedBillDraftItem,
} from '../types';
import { getStarterItems } from '../data/categories';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ShopContextType {
  // Auth & Profile
  profile: ShopProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (identifier: string, pass: string, shopName: string, shopType?: ShopType, lang?: Language) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (identifier: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (identifier: string, code: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (language: Language, shopType: ShopType, shopName: string) => void;
  updateLanguage: (lang: Language) => void;

  // Stock
  items: StockItem[];
  addItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<StockItem>) => void;
  deleteItem: (id: string) => void;
  quickSell: (itemId: string, quantity?: number) => { success: boolean; profit: number };
  batchAddScannedItems: (drafts: ScannedBillDraftItem[]) => void;

  // Night Count
  nightCounts: NightCountRecord[];
  logNightCount: (entries: Array<{ itemId: string; countedQty: number }>, notes?: string) => NightCountRecord;

  // Udhaar
  customers: Customer[];
  addCustomer: (name: string, phone: string, address?: string) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addUdhaarTransaction: (customerId: string, type: 'credit_given' | 'payment_received', amount: number, note?: string) => void;

  // Metrics
  todayProfit: number;
  weekProfit: number;
  totalUdhaarOwed: number;
  reorderSuggestions: ReorderSuggestion[];
  sales: Sale[];

  // Feedback & UI
  toasts: Toast[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  activeScreen: 'home' | 'stock' | 'udhaar';
  setActiveScreen: (screen: 'home' | 'stock' | 'udhaar') => void;
  voiceTargetName: string | null;
  setVoiceTargetName: (name: string | null) => void;
}

const ShopContext = createContext<ShopContextType | null>(null);

const STORAGE_KEYS = {
  TOKEN: 'krow_token',
  PROFILE: 'krow_profile',
  ITEMS: 'krow_items',
  CUSTOMERS: 'krow_customers',
  SALES: 'krow_sales',
  NIGHT_COUNTS: 'krow_night_counts',
  LOCAL_USERS: 'krow_local_users',
};

interface LocalUserRecord {
  identifier: string;
  password: string;
  token: string;
  profile: ShopProfile;
  items?: StockItem[];
  customers?: Customer[];
  sales?: Sale[];
  nightCounts?: NightCountRecord[];
}

function getLocalUsers(): Record<string, LocalUserRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_USERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, LocalUserRecord>) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
  } catch (err) {
    console.warn('Could not save local users:', err);
  }
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [profile, setProfile] = useState<ShopProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : null;
  });
  const [items, setItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return saved ? JSON.parse(saved) : [];
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : [];
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : [];
  });
  const [nightCounts, setNightCounts] = useState<NightCountRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NIGHT_COUNTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'home' | 'stock' | 'udhaar'>('home');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [voiceTargetName, setVoiceTargetName] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    else localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }, [token]);

  useEffect(() => {
    if (profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NIGHT_COUNTS, JSON.stringify(nightCounts));
  }, [nightCounts]);

  // Sync to server (debounce 1s)
  const syncToServer = useCallback(
    async (
      currToken: string,
      prof: ShopProfile | null,
      currItems: StockItem[],
      currCust: Customer[],
      currSales: Sale[],
      currCounts: NightCountRecord[]
    ) => {
      if (!currToken) return;
      try {
        await fetch('/api/shop/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currToken}`,
          },
          body: JSON.stringify({
            identifier: prof?.identifier,
            shopName: prof?.shopName,
            shopType: prof?.shopType,
            language: prof?.language,
            onboarded: prof?.onboarded,
            items: currItems,
            customers: currCust,
            sales: currSales,
            nightCounts: currCounts,
          }),
        });
      } catch (err) {
        console.warn('Background sync failed (operating offline):', err);
      }
    },
    []
  );

  // Sync state changes to server when online
  useEffect(() => {
    if (!token || !profile) return;
    const handler = setTimeout(() => {
      syncToServer(token, profile, items, customers, sales, nightCounts);
    }, 1200);
    return () => clearTimeout(handler);
  }, [token, profile, items, customers, sales, nightCounts, syncToServer]);

  // Auth: Login
  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    const cleanId = identifier.trim().toLowerCase();
    const localUsers = getLocalUsers();

    try {
      // 1. Attempt server login with 4.5s timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: pass }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);

      if (res) {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        if (isJson) {
          const data = await res.json();
          if (res.ok && data?.token && data?.shop) {
            setToken(data.token);
            setProfile(data.shop);
            if (data.shop.items && data.shop.items.length > 0) setItems(data.shop.items);
            if (data.shop.customers && data.shop.customers.length > 0) setCustomers(data.shop.customers);
            if (data.shop.sales && data.shop.sales.length > 0) setSales(data.shop.sales);
            if (data.shop.nightCounts && data.shop.nightCounts.length > 0) setNightCounts(data.shop.nightCounts);

            // Cache in local users for seamless offline access later
            localUsers[cleanId] = {
              identifier: cleanId,
              password: pass,
              token: data.token,
              profile: data.shop,
              items: data.shop.items,
              customers: data.shop.customers,
              sales: data.shop.sales,
              nightCounts: data.shop.nightCounts,
            };
            saveLocalUsers(localUsers);

            showToast(`Welcome back, ${data.shop.shopName}!`);
            setIsLoading(false);
            return { success: true };
          } else if (res.status === 401) {
            // Check if user was registered locally
            if (localUsers[cleanId]) {
              if (localUsers[cleanId].password === pass) {
                const u = localUsers[cleanId];
                setToken(u.token);
                setProfile(u.profile);
                if (u.items) setItems(u.items);
                if (u.customers) setCustomers(u.customers);
                if (u.sales) setSales(u.sales);
                if (u.nightCounts) setNightCounts(u.nightCounts);
                showToast(`Welcome back, ${u.profile.shopName}!`);
                setIsLoading(false);
                return { success: true };
              }
              setIsLoading(false);
              return { success: false, error: 'गलत पासवर्ड / Incorrect password' };
            }
            setIsLoading(false);
            return { success: false, error: data.error || 'Incorrect email/phone or password' };
          } else if (!res.ok && data.error) {
            setIsLoading(false);
            return { success: false, error: data.error };
          }
        }
      }
    } catch (err) {
      console.warn('Server login fetch encountered error:', err);
    }

    // 2. Resilient Offline/Local fallback (When server is offline, down, or deployed on static host)
    if (localUsers[cleanId]) {
      const u = localUsers[cleanId];
      if (u.password === pass) {
        setToken(u.token);
        setProfile(u.profile);
        if (u.items) setItems(u.items);
        if (u.customers) setCustomers(u.customers);
        if (u.sales) setSales(u.sales);
        if (u.nightCounts) setNightCounts(u.nightCounts);
        showToast(`स्वागत है, ${u.profile.shopName}! (ऑफ़लाइन सुरक्षित मोड)`, 'info');
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: 'गलत पासवर्ड / Incorrect password' };
      }
    }

    // Demo account special fallback (9876543210 / shop123)
    if ((cleanId === '9876543210' || cleanId === 'demo') && (pass === 'shop123' || pass === 'demo')) {
      const demoToken = 'shop_demo_' + Date.now().toString(36);
      const demoProfile: ShopProfile = {
        id: demoToken,
        identifier: cleanId,
        shopName: 'वर्मा किराना स्टोर (Verma Kirana Store)',
        shopType: 'general_store',
        language: 'hi',
        onboarded: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const demoItems = getStarterItems('general_store');
      localUsers[cleanId] = {
        identifier: cleanId,
        password: pass,
        token: demoToken,
        profile: demoProfile,
        items: demoItems,
      };
      saveLocalUsers(localUsers);

      setToken(demoToken);
      setProfile(demoProfile);
      setItems(demoItems);
      showToast('डेमो दुकान शुरू हो गई! (Demo store ready)', 'info');
      setIsLoading(false);
      return { success: true };
    }

    // New local store fallback on fresh deployment when server is offline
    const fallbackToken = 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newProfile: ShopProfile = {
      id: fallbackToken,
      identifier: cleanId,
      shopName: 'मेरी दुकान (Meri Dukan)',
      shopType: 'general_store',
      language: 'hi',
      onboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localUsers[cleanId] = {
      identifier: cleanId,
      password: pass,
      token: fallbackToken,
      profile: newProfile,
    };
    saveLocalUsers(localUsers);

    setToken(fallbackToken);
    setProfile(newProfile);
    showToast('दुकान खाता सक्रिय! (ऑफ़लाइन/लोकल सुरक्षित मोड)', 'info');
    setIsLoading(false);
    return { success: true };
  };

  // Auth: Signup
  const signup = async (
    identifier: string,
    pass: string,
    shopName: string,
    shopType: ShopType = 'general_store',
    lang: Language = 'hi'
  ) => {
    setIsLoading(true);
    const cleanId = identifier.trim().toLowerCase();
    const localUsers = getLocalUsers();

    try {
      // 1. Try server signup
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password: pass,
          shopName: shopName || 'Meri Dukan',
          shopType,
          language: lang,
        }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timer);

      if (res) {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        if (isJson) {
          const data = await res.json();
          if (res.ok && data?.token && data?.shop) {
            setToken(data.token);
            setProfile(data.shop);

            // Cache locally
            localUsers[cleanId] = {
              identifier: cleanId,
              password: pass,
              token: data.token,
              profile: data.shop,
            };
            saveLocalUsers(localUsers);

            showToast(
              lang === 'hi'
                ? `खाता सफलतापूर्वक बन गया, ${data.shop.shopName}!`
                : lang === 'pa'
                ? `ਖਾਤਾ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਿਆ, ${data.shop.shopName}!`
                : `Account created, ${data.shop.shopName}!`
            );
            setIsLoading(false);
            return { success: true };
          } else if (res.status === 409) {
            // Already exists on server
            setIsLoading(false);
            return {
              success: false,
              error:
                data.error ||
                (lang === 'hi'
                  ? 'इस नंबर/ईमेल का खाता पहले से मौजूद है।'
                  : 'An account with this email or phone number already exists.'),
            };
          } else if (!res.ok && data?.error) {
            setIsLoading(false);
            return { success: false, error: data.error };
          }
        }
      }
    } catch (err) {
      console.warn('Server signup error:', err);
    }

    // 2. Resilient Offline/Local registration
    if (localUsers[cleanId]) {
      setIsLoading(false);
      return {
        success: false,
        error:
          lang === 'hi'
            ? 'इस नंबर/ईमेल का खाता पहले से मौजूद है।'
            : lang === 'pa'
            ? 'ਇਸ ਨੰਬਰ/ਈਮੇਲ ਦਾ ਖਾਤਾ ਪਹਿਲਾਂ ਹੀ ਮੌਜੂਦ ਹੈ।'
            : 'An account with this email or phone number already exists.',
      };
    }

    const localToken = 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newShopProfile: ShopProfile = {
      id: localToken,
      identifier: cleanId,
      shopName: shopName || (lang === 'hi' ? 'मेरी दुकान' : 'Meri Dukan'),
      shopType,
      language: lang,
      onboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localUsers[cleanId] = {
      identifier: cleanId,
      password: pass,
      token: localToken,
      profile: newShopProfile,
    };
    saveLocalUsers(localUsers);

    setToken(localToken);
    setProfile(newShopProfile);
    showToast(
      lang === 'hi'
        ? 'दुकान खाता तैयार! (ऑफ़लाइन सुरक्षित मोड)'
        : lang === 'pa'
        ? 'ਦੁਕਾਨ ਖਾਤਾ ਤਿਆਰ! (ਆਫ਼ਲਾਈਨ ਸੁਰੱਖਿਅਤ ਮੋਡ)'
        : 'Shop account created! (Offline-ready)',
      'info'
    );
    setIsLoading(false);
    return { success: true };
  };

  // Auth: Logout
  const logout = () => {
    setToken(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    showToast('Logged out successfully', 'info');
  };

  // Auth: Forgot password
  const forgotPassword = async (identifier: string) => {
    const cleanId = identifier.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      }).catch(() => null);

      if (res && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch {}

    return {
      success: true,
      message: 'Reset code sent! Use OTP verification code: 5544',
      demoCode: '5544',
    };
  };

  // Auth: Reset password
  const resetPassword = async (identifier: string, code: string, newPass: string) => {
    const cleanId = identifier.trim().toLowerCase();
    if (code !== '5544') {
      return { success: false, error: 'Invalid OTP code. Please enter 5544.' };
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, code, newPassword: newPass }),
      }).catch(() => null);

      if (res && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          const localUsers = getLocalUsers();
          if (localUsers[cleanId]) {
            localUsers[cleanId].password = newPass;
            saveLocalUsers(localUsers);
          }
          return { success: true };
        }
      }
    } catch {}

    const localUsers = getLocalUsers();
    if (localUsers[cleanId]) {
      localUsers[cleanId].password = newPass;
      saveLocalUsers(localUsers);
      return { success: true };
    }
    return { success: true };
  };

  // Complete Onboarding (Step 1 Language -> Step 2 Shop Type)
  const completeOnboarding = (language: Language, shopType: ShopType, shopName: string) => {
    if (!profile) return;
    const starterItems = getStarterItems(shopType);
    const updatedProfile: ShopProfile = {
      ...profile,
      language,
      shopType,
      shopName: shopName || profile.shopName,
      onboarded: true,
      updatedAt: new Date().toISOString(),
    };

    setProfile(updatedProfile);
    // If shop currently has no items, populate with realistic starter items
    if (items.length === 0) {
      setItems(starterItems);
    }
    // Also create 2 initial sample customers for quick testing if empty
    if (customers.length === 0) {
      const now = new Date().toISOString();
      const initialCustomers: Customer[] = [
        {
          id: 'cust_sample_1',
          name: language === 'pa' ? 'ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ' : language === 'hi' ? 'रमेश वर्मा (वर्मा जी)' : 'Ramesh Verma',
          phone: '9876543210',
          address: 'Gali No. 3, Near Temple',
          balance: 380,
          transactions: [
            {
              id: 'tx_1',
              customerId: 'cust_sample_1',
              customerName: 'Ramesh Verma',
              type: 'credit_given',
              amount: 380,
              note: '2 Milk + Bread + Butter',
              balanceAfter: 380,
              timestamp: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'cust_sample_2',
          name: language === 'pa' ? 'ਮਨਦੀਪ ਕੌਰ' : language === 'hi' ? 'सोनू भाई (ड्राइवर)' : 'Sonu Bhai',
          phone: '9811223344',
          address: 'Main Road',
          balance: 140,
          transactions: [
            {
              id: 'tx_2',
              customerId: 'cust_sample_2',
              customerName: 'Sonu Bhai',
              type: 'credit_given',
              amount: 240,
              note: 'Cigarettes & Cold Drink',
              balanceAfter: 240,
              timestamp: now,
            },
            {
              id: 'tx_3',
              customerId: 'cust_sample_2',
              customerName: 'Sonu Bhai',
              type: 'payment_received',
              amount: 100,
              note: 'Cash paid in evening',
              balanceAfter: 140,
              timestamp: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ];
      setCustomers(initialCustomers);
    }

    showToast('Shop setup complete! Welcome to Krow.');
  };

  const updateLanguage = (lang: Language) => {
    if (profile) {
      setProfile({ ...profile, language: lang });
    }
  };

  // Stock: Add
  const addItem = (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem: StockItem = {
      ...item,
      id: 'item_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [newItem, ...prev]);
    showToast(`Added "${newItem.name}" to inventory.`);
  };

  // Stock: Update
  const updateItem = (id: string, updates: Partial<StockItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    showToast('Item updated.');
  };

  // Stock: Delete
  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`Deleted ${item?.name || 'item'}.`, 'info');
  };

  // Stock: Quick Sell
  const quickSell = (itemId: string, quantity = 1): { success: boolean; profit: number } => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return { success: false, profit: 0 };
    if (item.quantity <= 0) {
      showToast(`Warning: "${item.name}" is out of stock!`, 'error');
    }

    const soldQty = quantity;
    const profit = Math.round((item.sellPrice - item.buyPrice) * soldQty * 10) / 10;
    const totalAmount = Math.round(item.sellPrice * soldQty * 10) / 10;

    // Decrement item stock
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, quantity: Math.max(0, i.quantity - soldQty), updatedAt: new Date().toISOString() }
          : i
      )
    );

    // Record sale
    const newSale: Sale = {
      id: 'sale_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      itemId: item.id,
      itemName: item.name,
      quantity: soldQty,
      unit: item.unit,
      buyPrice: item.buyPrice,
      sellPrice: item.sellPrice,
      profit,
      totalAmount,
      timestamp: new Date().toISOString(),
      type: 'quick_sell',
    };
    setSales((prev) => [newSale, ...prev]);

    showToast(`Sold ${soldQty} ${item.unit} ${item.name} (+₹${profit} profit)`);
    return { success: true, profit };
  };

  // Batch Add Scanned Items (from AI Bill Scanner)
  const batchAddScannedItems = (drafts: ScannedBillDraftItem[]) => {
    const now = new Date().toISOString();
    let updatedCount = 0;
    let addedCount = 0;

    setItems((prev) => {
      const copy = [...prev];
      drafts.forEach((draft) => {
        // Try finding matching item by ID or name
        const existingIdx = copy.findIndex(
          (it) => it.id === draft.matchedItemId || it.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
          // Update existing item stock and buy price
          const existing = copy[existingIdx];
          copy[existingIdx] = {
            ...existing,
            quantity: existing.quantity + draft.quantity,
            buyPrice: draft.buyPrice,
            sellPrice: draft.suggestedSellPrice || existing.sellPrice,
            updatedAt: now,
          };
          updatedCount++;
        } else {
          // Add as new item
          copy.unshift({
            id: 'item_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            name: draft.name,
            category: draft.suggestedCategory || 'general_items',
            unit: draft.unit || 'packet',
            quantity: draft.quantity,
            reorderLevel: Math.max(4, Math.floor(draft.quantity * 0.3)),
            buyPrice: draft.buyPrice,
            sellPrice: draft.suggestedSellPrice || Math.round(draft.buyPrice * 1.15),
            packetSize: draft.packetSize,
            spoilQuickly: draft.spoilQuickly || false,
            exchangeableOnSpoil: draft.exchangeableOnSpoil || false,
            createdAt: now,
            updatedAt: now,
          });
          addedCount++;
        }
      });
      return copy;
    });

    showToast(`Bill confirmed: ${addedCount} new items added, ${updatedCount} existing items updated!`);
  };

  // Night Count batch mode
  const logNightCount = (
    entries: Array<{ itemId: string; countedQty: number }>,
    notes?: string
  ): NightCountRecord => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const countEntries: NightCountRecord['entries'] = [];
    let totalSold = 0;
    let totalProfit = 0;
    const newSales: Sale[] = [];

    setItems((prev) => {
      return prev.map((item) => {
        const match = entries.find((e) => e.itemId === item.id);
        if (!match) return item;

        const counted = Math.max(0, match.countedQty);
        const previous = item.quantity;
        const sold = Math.max(0, previous - counted);
        const profit = Math.round((item.sellPrice - item.buyPrice) * sold * 10) / 10;

        if (sold > 0) {
          totalSold += sold;
          totalProfit += profit;
          newSales.push({
            id: 'sale_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            itemId: item.id,
            itemName: item.name,
            quantity: sold,
            unit: item.unit,
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            profit,
            totalAmount: Math.round(item.sellPrice * sold * 10) / 10,
            timestamp: now,
            type: 'night_count',
          });
        }

        countEntries.push({
          itemId: item.id,
          itemName: item.name,
          previousQty: previous,
          countedQty: counted,
          soldQty: sold,
          unit: item.unit,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          profit,
        });

        return {
          ...item,
          quantity: counted,
          updatedAt: now,
        };
      });
    });

    if (newSales.length > 0) {
      setSales((prev) => [...newSales, ...prev]);
    }

    const newRecord: NightCountRecord = {
      id: 'nc_' + Date.now().toString(36),
      date: today,
      timestamp: now,
      entries: countEntries,
      totalSoldQty: totalSold,
      totalProfit: Math.round(totalProfit * 10) / 10,
      notes,
    };

    setNightCounts((prev) => [newRecord, ...prev]);
    showToast(`Night count saved! ₹${newRecord.totalProfit} profit recorded automatically.`);
    return newRecord;
  };

  // Udhaar: Add Customer
  const addCustomer = (name: string, phone: string, address?: string): Customer => {
    const now = new Date().toISOString();
    const newCust: Customer = {
      id: 'cust_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      name: name.trim(),
      phone: phone.trim(),
      address: address?.trim(),
      balance: 0,
      transactions: [],
      createdAt: now,
      updatedAt: now,
    };
    setCustomers((prev) => [newCust, ...prev]);
    showToast(`Customer "${newCust.name}" added to Udhaar ledger.`);
    return newCust;
  };

  // Udhaar: Update Customer
  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    showToast('Customer details updated.');
  };

  // Udhaar: Delete Customer
  const deleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast(`Removed customer ${cust?.name || ''} and their ledger.`, 'info');
  };

  // Udhaar: Add Transaction
  const addUdhaarTransaction = (
    customerId: string,
    type: 'credit_given' | 'payment_received',
    amount: number,
    note?: string
  ) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id !== customerId) return cust;

        const cleanAmount = Math.abs(amount);
        const newBalance =
          type === 'credit_given' ? cust.balance + cleanAmount : Math.max(0, cust.balance - cleanAmount);

        const tx: UdhaarTransaction = {
          id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
          customerId: cust.id,
          customerName: cust.name,
          type,
          amount: cleanAmount,
          note: note?.trim(),
          balanceAfter: newBalance,
          timestamp: now,
        };

        return {
          ...cust,
          balance: newBalance,
          transactions: [tx, ...cust.transactions],
          updatedAt: now,
        };
      })
    );

    if (type === 'credit_given') {
      showToast(`Logged ₹${amount} credit given.`);
    } else {
      showToast(`Logged ₹${amount} payment received.`);
    }
  };

  // Metrics: Today's profit & This Week's profit
  const todayProfit = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sales
      .filter((s) => s.timestamp.startsWith(todayStr))
      .reduce((acc, s) => acc + s.profit, 0);
  }, [sales]);

  const weekProfit = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threshold = sevenDaysAgo.toISOString();
    return sales
      .filter((s) => s.timestamp >= threshold)
      .reduce((acc, s) => acc + s.profit, 0);
  }, [sales]);

  // Metrics: Total Udhaar owed
  const totalUdhaarOwed = useMemo(() => {
    return customers.reduce((acc, c) => acc + Math.max(0, c.balance), 0);
  }, [customers]);

  // Smart Reorder Suggestions:
  // - Regular stock items: suggest reordering when below reorderLevel
  // - Fast-spoiling items: base suggested order quantity on actual average sales over last 7 days, NOT fixed level!
  const reorderSuggestions = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threshold = sevenDaysAgo.toISOString();

    const suggestions: ReorderSuggestion[] = [];

    items.forEach((item) => {
      if (item.spoilQuickly) {
        // Compute 7-day average daily sales
        const itemSalesInLast7Days = sales
          .filter((s) => s.itemId === item.id && s.timestamp >= threshold)
          .reduce((sum, s) => sum + s.quantity, 0);

        // Daily average sales (assume minimum 1 unit/day if store stocks it)
        const avgDailySales = Math.max(1, Math.round((itemSalesInLast7Days / 7) * 10) / 10);
        // Suggested safe buffer for perishables is 2 days of sales
        const targetBuffer = Math.ceil(avgDailySales * 2);

        if (item.quantity < targetBuffer) {
          const needed = targetBuffer - item.quantity;
          const packets = item.packetSize ? Math.ceil(needed / item.packetSize) : needed;
          suggestions.push({
            item,
            neededQuantity: needed,
            packetsToOrder: packets,
            reason: 'perishable_velocity',
            avgDailySales,
          });
        }
      } else {
        // Regular item: compare with reorderLevel
        if (item.quantity <= item.reorderLevel) {
          const needed = Math.max(1, item.reorderLevel * 2 - item.quantity);
          const packets = item.packetSize ? Math.ceil(needed / item.packetSize) : needed;
          suggestions.push({
            item,
            neededQuantity: needed,
            packetsToOrder: packets,
            reason: 'low_stock',
            avgDailySales: 0,
          });
        }
      }
    });

    return suggestions;
  }, [items, sales]);

  const value: ShopContextType = {
    profile,
    token,
    isAuthenticated: !!token && !!profile,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    completeOnboarding,
    updateLanguage,
    items,
    addItem,
    updateItem,
    deleteItem,
    quickSell,
    batchAddScannedItems,
    nightCounts,
    logNightCount,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addUdhaarTransaction,
    todayProfit: Math.round(todayProfit * 10) / 10,
    weekProfit: Math.round(weekProfit * 10) / 10,
    totalUdhaarOwed: Math.round(totalUdhaarOwed),
    reorderSuggestions,
    sales,
    toasts,
    showToast,
    activeScreen,
    setActiveScreen,
    voiceTargetName,
    setVoiceTargetName,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
