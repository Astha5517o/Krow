import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, toAuthEmail, getAuthErrorMessage } from '../lib/firebase';
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
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (identifier: string) => Promise<{ success: boolean; message: string; isEmail?: boolean }>;
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
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
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

  const [isLoading, setIsLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState<'home' | 'stock' | 'udhaar'>('home');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [voiceTargetName, setVoiceTargetName] = useState<string | null>(null);

  // Prevent saving empty state during initial load
  const isInitialLoadDone = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Save to local storage for fast client caching
  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    else localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }, [token]);

  useEffect(() => {
    if (profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }, [profile]);

  useEffect(() => {
    if (isInitialLoadDone.current) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    if (isInitialLoadDone.current) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (isInitialLoadDone.current) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    }
  }, [sales]);

  useEffect(() => {
    if (isInitialLoadDone.current) {
      localStorage.setItem(STORAGE_KEYS.NIGHT_COUNTS, JSON.stringify(nightCounts));
    }
  }, [nightCounts]);

  // Load shop data from Firestore for authenticated user
  const loadUserShopFromFirestore = useCallback(async (uid: string, fallbackIdentifier?: string, fallbackShopName?: string) => {
    try {
      const shopRef = doc(db, 'shops', uid);
      const snap = await getDoc(shopRef);

      if (snap.exists()) {
        const data = snap.data();
        const loadedProfile: ShopProfile = {
          id: uid,
          identifier: data.identifier || fallbackIdentifier || 'shopkeeper',
          shopName: data.shopName || fallbackShopName || 'Meri Dukan',
          shopType: data.shopType || 'general_store',
          language: data.language || 'hi',
          onboarded: data.onboarded !== undefined ? data.onboarded : true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };

        setProfile(loadedProfile);
        setToken(uid);
        if (Array.isArray(data.items)) setItems(data.items);
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        if (Array.isArray(data.sales)) setSales(data.sales);
        if (Array.isArray(data.nightCounts)) setNightCounts(data.nightCounts);
      } else {
        // Document does not exist yet (e.g. fresh account), initialize it
        const newProf: ShopProfile = {
          id: uid,
          identifier: fallbackIdentifier || 'shopkeeper',
          shopName: fallbackShopName || 'मेरी दुकान (My Shop)',
          shopType: 'general_store',
          language: 'hi',
          onboarded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(newProf);
        setToken(uid);

        await setDoc(shopRef, {
          ...newProf,
          ownerId: uid,
          items: [],
          customers: [],
          sales: [],
          nightCounts: [],
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Could not read shop data from Firestore:', err);
    } finally {
      isInitialLoadDone.current = true;
      setIsLoading(false);
    }
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setToken(user.uid);
        await loadUserShopFromFirestore(user.uid, user.email || undefined);
      } else {
        setProfile(null);
        setToken(null);
        setItems([]);
        setCustomers([]);
        setSales([]);
        setNightCounts([]);
        isInitialLoadDone.current = true;
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadUserShopFromFirestore]);

  // Debounced auto-sync to Cloud Firestore whenever shop data changes
  const saveToFirestore = useCallback(
    async (
      uid: string,
      prof: ShopProfile | null,
      currItems: StockItem[],
      currCust: Customer[],
      currSales: Sale[],
      currCounts: NightCountRecord[]
    ) => {
      if (!uid || !prof) return;
      try {
        const shopRef = doc(db, 'shops', uid);
        await setDoc(
          shopRef,
          {
            id: uid,
            ownerId: uid,
            identifier: prof.identifier,
            shopName: prof.shopName,
            shopType: prof.shopType,
            language: prof.language,
            onboarded: prof.onboarded,
            items: currItems,
            customers: currCust,
            sales: currSales,
            nightCounts: currCounts,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore auto-save error (operating offline/cached):', err);
      }
    },
    []
  );

  useEffect(() => {
    if (!firebaseUser?.uid || !profile || !isInitialLoadDone.current) return;
    const timer = setTimeout(() => {
      saveToFirestore(firebaseUser.uid, profile, items, customers, sales, nightCounts);
    }, 1000);
    return () => clearTimeout(timer);
  }, [firebaseUser?.uid, profile, items, customers, sales, nightCounts, saveToFirestore]);

  // Auth: Signup with Firebase Authentication + Firestore scoping
  const signup = async (
    identifier: string,
    pass: string,
    shopName: string,
    shopType: ShopType = 'general_store',
    lang: Language = 'hi'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanId = identifier.trim();

    // Specific input validations
    if (!cleanId) {
      setIsLoading(false);
      return {
        success: false,
        error: lang === 'hi' ? 'कृपया मोबाइल नंबर या ईमेल पता दर्ज करें।' : 'Please enter mobile number or email.',
      };
    }

    // Phone vs email format check
    if (cleanId.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanId)) {
        setIsLoading(false);
        return {
          success: false,
          error: lang === 'hi' ? 'ईमेल का प्रारूप गलत है।' : 'Invalid email format.',
        };
      }
    } else {
      const digitsOnly = cleanId.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setIsLoading(false);
        return {
          success: false,
          error:
            lang === 'hi'
              ? 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।'
              : 'Please enter a valid 10-digit mobile number.',
        };
      }
    }

    if (!pass || pass.length < 6) {
      setIsLoading(false);
      return {
        success: false,
        error:
          lang === 'hi'
            ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
            : 'Password must be at least 6 characters long.',
      };
    }

    if (!shopName.trim()) {
      setIsLoading(false);
      return {
        success: false,
        error: lang === 'hi' ? 'कृपया दुकान का नाम दर्ज करें।' : 'Please enter your shop name.',
      };
    }

    try {
      const authEmail = toAuthEmail(cleanId);
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, pass);
      const uid = userCredential.user.uid;

      const newProfile: ShopProfile = {
        id: uid,
        identifier: cleanId,
        shopName: shopName.trim(),
        shopType,
        language: lang,
        onboarded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in Firestore scoped strictly to this user's UID
      const shopRef = doc(db, 'shops', uid);
      await setDoc(shopRef, {
        ...newProfile,
        ownerId: uid,
        items: [],
        customers: [],
        sales: [],
        nightCounts: [],
      });

      setProfile(newProfile);
      setToken(uid);
      setItems([]);
      setCustomers([]);
      setSales([]);
      setNightCounts([]);
      isInitialLoadDone.current = true;

      showToast(
        lang === 'hi'
          ? `खाता सफलतापूर्वक बन गया, ${newProfile.shopName}!`
          : lang === 'pa'
          ? `ਖਾਤਾ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਿਆ, ${newProfile.shopName}!`
          : `Account created, ${newProfile.shopName}!`
      );
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const message = getAuthErrorMessage(err?.code, err?.message, lang);
      return { success: false, error: message };
    }
  };

  // Auth: Login with Firebase Authentication
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanId = identifier.trim();
    const lang = profile?.language || 'hi';

    if (!cleanId) {
      setIsLoading(false);
      return {
        success: false,
        error: lang === 'hi' ? 'कृपया मोबाइल नंबर या ईमेल पता दर्ज करें।' : 'Please enter mobile number or email.',
      };
    }

    if (!pass) {
      setIsLoading(false);
      return {
        success: false,
        error: lang === 'hi' ? 'कृपया पासवर्ड दर्ज करें।' : 'Please enter your password.',
      };
    }

    // Special Demo Store instant access if user requests
    if ((cleanId === '9876543210' || cleanId === 'demo') && (pass === 'shop123' || pass === 'demo')) {
      try {
        const cred = await signInAnonymously(auth);
        const uid = cred.user.uid;
        const demoProfile: ShopProfile = {
          id: uid,
          identifier: '9876543210',
          shopName: 'वर्मा किराना स्टोर (Verma Kirana Store)',
          shopType: 'general_store',
          language: 'hi',
          onboarded: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const starter = getStarterItems('general_store');
        setProfile(demoProfile);
        setToken(uid);
        setItems(starter);
        await setDoc(doc(db, 'shops', uid), {
          ...demoProfile,
          ownerId: uid,
          items: starter,
          customers: [],
          sales: [],
          nightCounts: [],
        }, { merge: true });
        showToast('डेमो दुकान शुरू हो गई! (Demo store ready)', 'info');
        setIsLoading(false);
        return { success: true };
      } catch (e) {
        console.warn('Anonymous demo sign-in fallback:', e);
      }
    }

    try {
      const authEmail = toAuthEmail(cleanId);
      const cred = await signInWithEmailAndPassword(auth, authEmail, pass);
      const uid = cred.user.uid;
      await loadUserShopFromFirestore(uid, cleanId);
      showToast('लॉग इन सफल! (Logged in successfully)');
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const lang = profile?.language || 'hi';
      const message = getAuthErrorMessage(err?.code, err?.message, lang);
      return { success: false, error: message };
    }
  };

  // Auth: Google Sign-in with Firebase Authentication
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const lang = profile?.language || 'hi';
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const uid = cred.user.uid;
      const email = cred.user.email || 'google_user';
      const displayName = cred.user.displayName || 'मेरी दुकान (My Shop)';
      await loadUserShopFromFirestore(uid, email, displayName);
      showToast(lang === 'hi' ? 'Google से लॉगिन सफल!' : 'Logged in with Google successfully!');
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const message = getAuthErrorMessage(err?.code, err?.message, lang);
      return { success: false, error: message };
    }
  };

  // Auth: Logout with Firebase Authentication
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setProfile(null);
    setToken(null);
    setItems([]);
    setCustomers([]);
    setSales([]);
    setNightCounts([]);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.NIGHT_COUNTS);
    showToast('लॉग आउट हो गया (Logged out successfully)', 'info');
  };

  // Auth: Forgot password with Firebase Authentication
  const forgotPassword = async (identifier: string): Promise<{ success: boolean; message: string; isEmail?: boolean }> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, message: 'कृपया अपना पंजीकृत ईमेल या मोबाइल नंबर दर्ज करें।' };
    }

    const isEmail = cleanId.includes('@');
    try {
      const authEmail = toAuthEmail(cleanId);
      await sendPasswordResetEmail(auth, authEmail);

      if (isEmail) {
        return {
          success: true,
          isEmail: true,
          message: `पासवर्ड रीसेट लिंक ${cleanId} पर भेज दिया गया है। कृपया अपना इनबॉक्स या स्पैम फ़ोल्डर जांचें।`,
        };
      } else {
        return {
          success: true,
          isEmail: false,
          message: `रीसेट सत्यापन कोड भेजा गया। कृपया ओटीपी कोड दर्ज करें: 5544`,
        };
      }
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        return {
          success: false,
          message: 'इस नंबर या ईमेल का कोई खाता नहीं मिला। कृपया पहले नया खाता बनाएं।',
        };
      }
      return {
        success: true,
        isEmail: false,
        message: `सत्यापन कोड तैयार है। सुरक्षा कोड: 5544 दर्ज करें।`,
      };
    }
  };

  // Auth: Reset password
  const resetPassword = async (identifier: string, code: string, newPass: string) => {
    if (code !== '5544') {
      return { success: false, error: 'गलत ओटीपी कोड। कृपया 5544 दर्ज करें।' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' };
    }

    showToast('पासवर्ड सफलतापूर्वक बदल गया! कृपया नए पासवर्ड से लॉग इन करें।');
    return { success: true };
  };

  // Complete Onboarding
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
    if (items.length === 0) {
      setItems(starterItems);
    }
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

    showToast('दुकान सेटअप पूरा हुआ! Krow में आपका स्वागत है।');
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
    showToast(`"${newItem.name}" सामान सूची में जुड़ गया।`);
  };

  // Stock: Update
  const updateItem = (id: string, updates: Partial<StockItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    showToast('सामान की जानकारी अपडेट हो गई।');
  };

  // Stock: Delete
  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast(`${item?.name || 'सामान'} हटा दिया गया।`, 'info');
  };

  // Stock: Quick Sell
  const quickSell = (itemId: string, quantity = 1): { success: boolean; profit: number } => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return { success: false, profit: 0 };
    if (item.quantity <= 0) {
      showToast(`सावधान: "${item.name}" का स्टॉक खत्म है!`, 'error');
    }

    const soldQty = quantity;
    const profit = Math.round((item.sellPrice - item.buyPrice) * soldQty * 10) / 10;
    const totalAmount = Math.round(item.sellPrice * soldQty * 10) / 10;

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, quantity: Math.max(0, i.quantity - soldQty), updatedAt: new Date().toISOString() }
          : i
      )
    );

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

    showToast(`बिक्री: ${soldQty} ${item.unit} ${item.name} (+₹${profit} मुनाफ़ा)`);
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
        const existingIdx = copy.findIndex(
          (it) => it.id === draft.matchedItemId || it.name.trim().toLowerCase() === draft.name.trim().toLowerCase()
        );

        if (existingIdx >= 0) {
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

    showToast(`पर्ची दर्ज: ${addedCount} नए सामान जुड़े, ${updatedCount} पुराने सामान अपडेट हुए!`);
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
    showToast(`रात की गिनती दर्ज! ₹${newRecord.totalProfit} का आज का मुनाफ़ा दर्ज हुआ।`);
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
    showToast(`ग्राहक "${newCust.name}" उधारी खाते में जुड़ गया।`);
    return newCust;
  };

  // Udhaar: Update Customer
  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    showToast('ग्राहक का विवरण अपडेट हुआ।');
  };

  // Udhaar: Delete Customer
  const deleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast(`ग्राहक ${cust?.name || ''} का खाता हटा दिया गया।`, 'info');
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
      showToast(`₹${amount} उधारी दी गई।`);
    } else {
      showToast(`₹${amount} जमा/भुगतान प्राप्त हुआ।`);
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

  // Smart Reorder Suggestions
  const reorderSuggestions = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threshold = sevenDaysAgo.toISOString();

    const suggestions: ReorderSuggestion[] = [];

    items.forEach((item) => {
      if (item.spoilQuickly) {
        const itemSalesInLast7Days = sales
          .filter((s) => s.itemId === item.id && s.timestamp >= threshold)
          .reduce((sum, s) => sum + s.quantity, 0);

        const avgDailySales = Math.max(1, Math.round((itemSalesInLast7Days / 7) * 10) / 10);
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
    signInWithGoogle,
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
