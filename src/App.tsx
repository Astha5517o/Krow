import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  subscribeToUserData,
  seedInitialFirestoreDataIfEmpty,
  clearUserFirestoreData,
  recordUserLoginInfo,
  batchSaveStockItems,
  batchUpdateStockQuantities,
  saveStockItemToFirestore,
  deleteStockItemFromFirestore,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  saveTransactionToFirestore,
  saveSaleRecordToFirestore,
} from './services/firestoreSyncService';
import {
  StockItem,
  Customer,
  CustomerTransaction,
  SaleRecord,
  UserProfile,
  Language,
  StoreType,
} from './types';
import {
  INITIAL_STOCK_ITEMS,
  INITIAL_CUSTOMERS,
  INITIAL_TRANSACTIONS,
  INITIAL_SALES,
} from './data/defaultData';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { StockList } from './components/StockList';
import { UdhaarLedger } from './components/UdhaarLedger';
import { AddItemModal } from './components/AddItemModal';
import { OrderListModal } from './components/OrderListModal';
import { NightCountModal } from './components/NightCountModal';
import { ScanBillModal } from './components/ScanBillModal';
import { QuickSellModal } from './components/QuickSellModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileModal } from './components/ProfileModal';
import { ClearDataModal } from './components/ClearDataModal';
import { AuthModal } from './components/AuthModal';
import { PersonalizeShopModal } from './components/PersonalizeShopModal';
import { KrowWelcomeFirstView } from './components/KrowWelcomeFirstView';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { usePWAInstall } from './hooks/usePWAInstall';
import { AppLogo } from './components/AppLogo';
import { inferCategory, matchStockItem } from './utils/stockMatcher';
import { ScanToSellModal, CartItem } from './components/ScanToSellModal';
import { ShareStockModal } from './components/ShareStockModal';
import { PublicStockView } from './components/PublicStockView';
import { publishStoreCatalog } from './services/publicCatalogService';
import { getAllStationeryStockItems } from './data/stationeryMasterCatalog';
import { translations } from './translations';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const pwa = usePWAInstall();

  // Profile & Settings
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('krow_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      uid: 'local-user',
      shopName: 'मेरी दुकान',
      ownerName: '',
      language: 'hi',
      storeType: 'kirana',
      phone: '',
      createdAt: new Date().toISOString(),
    };
  });

  const t = translations[profile.language];

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('krow_onboarded') === 'true';
  });

  // Main UI Tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Main Data States (local persistence with realistic starter items)
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('krow_stock_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_STOCK_ITEMS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('krow_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Record<string, CustomerTransaction[]>>(() => {
    const saved = localStorage.getItem('krow_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('krow_sales');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_SALES;
  });

  // Modal active flags
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<StockItem | undefined>(undefined);
  const [initialBarcodeForNewItem, setInitialBarcodeForNewItem] = useState<string | undefined>(undefined);
  const [showOrderListModal, setShowOrderListModal] = useState(false);
  const [showNightCountModal, setShowNightCountModal] = useState(false);
  const [showScanBillModal, setShowScanBillModal] = useState(false);
  const [showQuickSellModal, setShowQuickSellModal] = useState(false);
  const [quickSellTargetItem, setQuickSellTargetItem] = useState<StockItem | undefined>(undefined);
  const [showScanToSellModal, setShowScanToSellModal] = useState(false);
  const [scanToSellInitialItem, setScanToSellInitialItem] = useState<StockItem | undefined>(undefined);
  const [scanToSellInitialLoose, setScanToSellInitialLoose] = useState<boolean>(false);
  const [showShareStockModal, setShowShareStockModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if viewing customer public stock catalog (No Login Required)
  const [isPublicView, setIsPublicView] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined' || !window.location) return false;
      const params = new URLSearchParams(window.location.search || '');
      return (
        params.get('view') === 'public-stock' ||
        params.has('public') ||
        Boolean(window.location.pathname && window.location.pathname.startsWith('/catalog'))
      );
    } catch {
      return false;
    }
  });
  const [publicStoreId, setPublicStoreId] = useState<string>(() => {
    try {
      if (typeof window === 'undefined' || !window.location) return 'demo';
      const params = new URLSearchParams(window.location.search || '');
      return params.get('store') || 'demo';
    } catch {
      return 'demo';
    }
  });

  // Debounced sync to public customer catalog (prevents lag, avoids continuous network writes, stays in Free Spark Plan)
  useEffect(() => {
    const timer = setTimeout(() => {
      const storeId = profile.phone || (currentUser ? currentUser.uid : 'demo');
      publishStoreCatalog(storeId, profile.shopName, profile.storeType, profile.phone, stockItems);
    }, 6000);
    return () => clearTimeout(timer);
  }, [stockItems, profile.shopName, profile.storeType, profile.phone, currentUser]);

  // Sync to local storage for fast client responsiveness
  useEffect(() => {
    localStorage.setItem('krow_user_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('krow_stock_items', JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem('krow_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('krow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('krow_sales', JSON.stringify(salesRecords));
  }, [salesRecords]);

  // Keep latest refs to prevent stale closures in async auth listener
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const stockItemsRef = useRef(stockItems);
  stockItemsRef.current = stockItems;
  const customersRef = useRef(customers);
  customersRef.current = customers;
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;
  const salesRecordsRef = useRef(salesRecords);
  salesRecordsRef.current = salesRecords;

  // Real-time Cloud Firestore & Firebase Auth Synchronization
  useEffect(() => {
    let dataUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (dataUnsubscribe) {
        dataUnsubscribe();
        dataUnsubscribe = null;
      }

      if (user) {
        setIsSyncing(true);
        const currentProfile = profileRef.current;

        // 1. Record User Login Info & Login Session Audit in Firestore
        recordUserLoginInfo(user.uid, user, currentProfile);

        // 2. Update profile in local state
        setProfile((prev) => ({
          ...prev,
          uid: user.uid,
          email: user.email || prev.email,
          ownerName: prev.ownerName || user.displayName || '',
          photoURL: user.photoURL || prev.photoURL,
        }));

        // 3. Seed initial local inventory and customer data to Firestore if user's cloud db is empty
        try {
          await seedInitialFirestoreDataIfEmpty(user.uid, {
            profile: {
              ...currentProfile,
              uid: user.uid,
              email: user.email || undefined,
              ownerName: currentProfile.ownerName || user.displayName || '',
            },
            stockItems: stockItemsRef.current,
            customers: customersRef.current,
            transactions: transactionsRef.current,
            salesRecords: salesRecordsRef.current,
          });
        } catch (e) {
          console.warn('Initial Firestore seed check:', e);
        }

        // 4. Subscribe to real-time updates from Firestore for this specific logged in user
        dataUnsubscribe = subscribeToUserData(user.uid, {
          onProfileChange: (cloudProfile) => {
            setProfile((prev) => ({ ...prev, ...cloudProfile }));
          },
          onStockItemsChange: (cloudItems) => {
            if (cloudItems && cloudItems.length > 0) {
              setStockItems(cloudItems);
            }
          },
          onCustomersChange: (cloudCusts) => {
            if (cloudCusts && cloudCusts.length > 0) {
              setCustomers(cloudCusts);
            }
          },
          onTransactionsChange: (cloudTxMap) => {
            if (cloudTxMap) {
              setTransactions(cloudTxMap);
            }
          },
          onSalesChange: (cloudSales) => {
            if (cloudSales && cloudSales.length > 0) {
              setSalesRecords(cloudSales);
            }
          },
          onError: (err) => {
            console.warn('Real-time sync notice:', err);
          },
        });

        setIsSyncing(false);
      } else {
        setIsSyncing(false);
      }
    });

    return () => {
      if (dataUnsubscribe) dataUnsubscribe();
      authUnsubscribe();
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Manual trigger to force cloud sync
  const handleManualSync = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsSyncing(true);
    try {
      await seedInitialFirestoreDataIfEmpty(currentUser.uid, {
        profile,
        stockItems,
        customers,
        transactions,
        salesRecords,
      });
      showToast(
        profile.language === 'en'
          ? 'Cloud database synchronized!'
          : 'क्लाउड डेटाबेस सफलतापूर्वक सिंक हो गया!'
      );
    } catch (err) {
      console.warn('Manual sync error:', err);
      showToast('सिंक करने में समस्या आई, कृपया दोबारा कोशिश करें');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      showToast(
        profile.language === 'en'
          ? 'Logged out successfully'
          : 'सफलतापूर्वक लॉगआउट कर दिया गया'
      );
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  // Clear Store Data Handler
  const handleClearData = async (options: {
    clearStock: boolean;
    clearCustomers: boolean;
    clearSales: boolean;
    resetOnboarding: boolean;
  }) => {
    if (options.clearStock) {
      setStockItems([]);
      localStorage.removeItem('krow_stock_items');
    }
    if (options.clearCustomers) {
      setCustomers([]);
      setTransactions({});
      localStorage.removeItem('krow_customers');
      localStorage.removeItem('krow_transactions');
    }
    if (options.clearSales) {
      setSalesRecords([]);
      localStorage.removeItem('krow_sales');
    }
    if (options.resetOnboarding) {
      setHasCompletedOnboarding(false);
      localStorage.removeItem('krow_onboarded');
    }

    if (currentUser) {
      try {
        await clearUserFirestoreData(currentUser.uid, options);
      } catch (e) {
        console.warn('Firestore clear error:', e);
      }
    }

    showToast(
      profile.language === 'en'
        ? 'Store data successfully cleared!'
        : 'दुकान का चुना हुआ डेटा सफलतापूर्वक साफ़ कर दिया गया!'
    );
  };

  // Profile Update Handler
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);
    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid), newProfile, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Onboarding Complete Handler
  const handleCompleteOnboarding = async (lang: Language, storeType: StoreType) => {
    const updated = {
      ...profile,
      language: lang,
      storeType,
    };
    setProfile(updated);
    setHasCompletedOnboarding(true);
    localStorage.setItem('krow_onboarded', 'true');

    if (storeType === 'stationery') {
      const stationeryStock = getAllStationeryStockItems();
      setStockItems(stationeryStock);
    }

    if (currentUser) {
      const path = `users/${currentUser.uid}`;
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Load Full Stationery Catalog (71 items with barcodes & MRP)
  const handleLoadStationeryInventory = () => {
    const stationeryStock = getAllStationeryStockItems();
    setStockItems(stationeryStock);
    if (currentUser) {
      batchSaveStockItems(currentUser.uid, stationeryStock);
    }
    showToast(
      profile.language === 'en'
        ? '71 stationery items with barcodes loaded into stock!'
        : '71 स्टेशनरी सामान (बारकोड सहित) स्टॉक में सफलतापूर्वक लोड हो गए!'
    );
  };

  // Stock Handlers - Instant UI update + background asynchronous cloud sync
  const handleSaveStockItem = (
    itemData: Omit<StockItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = stockItems.map((item) =>
        item.id === existingId
          ? { ...item, ...itemData, updatedAt: new Date().toISOString() }
          : item
      );
      setStockItems(updated);
      showToast('सामान का विवरण अपडेट कर दिया गया');

      if (currentUser) {
        const item = stockItems.find((i) => i.id === existingId);
        saveStockItemToFirestore(currentUser.uid, {
          ...itemData,
          id: existingId,
          createdAt: item?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).catch((e) => console.warn('Background save stock item:', e));
      }
    } else {
      const newItem: StockItem = {
        ...itemData,
        id: 'item-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setStockItems([newItem, ...stockItems]);
      showToast('नया सामान स्टॉक में जुड़ गया');

      if (currentUser) {
        saveStockItemToFirestore(currentUser.uid, newItem).catch((e) =>
          console.warn('Background save new stock item:', e)
        );
      }
    }

    setShowAddItemModal(false);
    setEditingStockItem(undefined);
  };

  const handleDeleteStockItem = (id: string) => {
    setStockItems(stockItems.filter((i) => i.id !== id));
    setShowAddItemModal(false);
    setEditingStockItem(undefined);
    showToast('सामान हटा दिया गया');

    if (currentUser) {
      deleteStockItemFromFirestore(currentUser.uid, id).catch((e) =>
        console.warn('Background delete stock item:', e)
      );
    }
  };

  // Batch restock when daily salesman delivery van unloads items at the shop
  const handleBatchReceiveStock = (itemsToReceive: { itemId: string; addedQty: number }[]) => {
    const updates: { itemId: string; currentQuantity: number }[] = [];
    setStockItems((prev) => {
      const map = new Map(itemsToReceive.map((i) => [i.itemId, i.addedQty]));
      return prev.map((item) => {
        if (map.has(item.id)) {
          const updatedQty = item.currentQuantity + (map.get(item.id) || 0);
          updates.push({ itemId: item.id, currentQuantity: updatedQty });
          return {
            ...item,
            currentQuantity: updatedQty,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });
    });

    if (currentUser && updates.length > 0) {
      batchUpdateStockQuantities(currentUser.uid, updates);
    }

    showToast(t.stockReceivedSuccessMsg || 'वैन से माल स्टॉक में जोड़ दिया गया!');
  };

  // Udhaar Transaction Handlers
  const handleAddTransaction = (
    customerId: string,
    type: 'credit' | 'payment',
    amount: number,
    note: string
  ) => {
    const txDate = 'आज • ' + new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
    const newTx: CustomerTransaction = {
      id: 'tx-' + Date.now(),
      customerId,
      type,
      amount,
      note,
      date: txDate,
      timestamp: Date.now(),
    };

    // Update transactions dictionary
    setTransactions((prev) => ({
      ...prev,
      [customerId]: [newTx, ...(prev[customerId] || [])],
    }));

    // Update customer balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newBal = type === 'credit' ? c.balance + amount : Math.max(0, c.balance - amount);
          return {
            ...c,
            balance: newBal,
            lastTransactionDate: txDate,
            lastTransactionAmount: amount,
            lastTransactionType: type,
          };
        }
        return c;
      })
    );

    if (currentUser) {
      saveTransactionToFirestore(currentUser.uid, newTx).catch(() => {});

      const cust = customers.find((c) => c.id === customerId);
      const updatedBal = type === 'credit' ? (cust?.balance || 0) + amount : Math.max(0, (cust?.balance || 0) - amount);
      saveCustomerToFirestore(currentUser.uid, {
        ...(cust || { id: customerId, name: '', phone: '', createdAt: new Date().toISOString() }),
        balance: updatedBal,
        lastTransactionDate: txDate,
        lastTransactionAmount: amount,
        lastTransactionType: type,
      }).catch(() => {});
    }

    showToast(type === 'credit' ? 'उधार सफलतापूर्वक दर्ज किया' : 'जमा राशि दर्ज कर दी गई');
  };

  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...custData,
      id: 'cust-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    setCustomers([newCustomer, ...customers]);

    if (currentUser) {
      saveCustomerToFirestore(currentUser.uid, newCustomer).catch(() => {});
    }

    showToast('नया ग्राहक खाता जुड़ गया');
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(customers.filter((c) => c.id !== customerId));

    if (currentUser) {
      deleteCustomerFromFirestore(currentUser.uid, customerId).catch(() => {});
    }

    showToast('ग्राहक खाता हटा दिया गया');
  };

  // Quick Sale Handler
  const handleRecordSale = (sale: SaleRecord, remainingQty: number) => {
    setSalesRecords([sale, ...salesRecords]);

    // Update item stock quantity
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === sale.itemId ? { ...item, currentQuantity: remainingQty } : item
      )
    );

    if (currentUser) {
      saveSaleRecordToFirestore(currentUser.uid, sale).catch(() => {});
      batchUpdateStockQuantities(currentUser.uid, [{ itemId: sale.itemId, currentQuantity: remainingQty }]);
    }

    showToast(`बिक्री सफल! +₹${sale.profit.toFixed(0)} मुनाफ़ा दर्ज`);
  };

  // Barcode Scan to Sell Handler (Bulk Cart Confirmation)
  const handleConfirmScanToSell = (cart: CartItem[]) => {
    const today = new Date().toISOString().split('T')[0];
    const newSales: SaleRecord[] = [];

    // Deduct stock quantities safely
    setStockItems((prev) =>
      prev.map((item) => {
        const cartMatch = cart.find((ci) => ci.item.id === item.id);
        if (cartMatch) {
          const updatedQty = Math.max(0, item.currentQuantity - cartMatch.quantity);
          return {
            ...item,
            currentQuantity: updatedQty,
            salesHistory: item.salesHistory
              ? [
                  ...item.salesHistory.slice(0, 6),
                  (item.salesHistory[6] || 0) + cartMatch.quantity,
                ]
              : [0, 0, 0, 0, 0, 0, cartMatch.quantity],
          };
        }
        return item;
      })
    );

    // Record sales
    cart.forEach((ci) => {
      const sale: SaleRecord = {
        id: 'sale-scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        itemId: ci.item.id,
        itemName: ci.item.name,
        quantity: ci.quantity,
        unit: ci.item.unit,
        buyPrice: ci.buyPrice,
        sellPrice: ci.sellPrice,
        totalAmount: ci.lineTotal,
        profit: ci.lineProfit,
        date: today,
        timestamp: Date.now(),
      };
      newSales.push(sale);
    });

    setSalesRecords((prev) => [...newSales, ...prev]);

    if (currentUser) {
      // 1. Background save sales records
      for (const sale of newSales) {
        saveSaleRecordToFirestore(currentUser.uid, sale).catch(() => {});
      }
      // 2. Batch update stock quantities in Firestore
      const stockUpdates = cart.map((ci) => {
        const currentItem = stockItems.find((s) => s.id === ci.item.id);
        const remaining = Math.max(0, (currentItem?.currentQuantity || 0) - ci.quantity);
        return { itemId: ci.item.id, currentQuantity: remaining };
      });
      batchUpdateStockQuantities(currentUser.uid, stockUpdates);
    }

    const totalBill = cart.reduce((sum, ci) => sum + ci.lineTotal, 0);
    const totalProfit = cart.reduce((sum, ci) => sum + ci.lineProfit, 0);

    showToast(
      profile.language === 'en'
        ? `Barcode Sale Confirmed! Bill: ₹${totalBill} (Profit: +₹${totalProfit.toFixed(0)})`
        : `बारकोड बिक्री दर्ज! कुल बिल ₹${totalBill} (मुनाफ़ा +₹${totalProfit.toFixed(0)})`
    );
  };

  // Link scanned barcode to an existing item
  const handleLinkBarcodeToItem = (itemId: string, barcode: string) => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, barcode } : item))
    );

    if (currentUser) {
      const itemPath = `users/${currentUser.uid}/items/${itemId}`;
      setDoc(doc(db, 'users', currentUser.uid, 'items', itemId), { barcode }, { merge: true }).catch((e) => {
        handleFirestoreError(e, OperationType.UPDATE, itemPath);
      });
    }

    showToast(
      profile.language === 'en'
        ? 'Barcode linked to item!'
        : 'बारकोड सामान से सफलतापूर्वक लिंक हो गया!'
    );
  };

  // Add a new item starting with a scanned barcode
  const handleAddNewItemWithBarcode = (barcode: string) => {
    setShowScanToSellModal(false);
    setInitialBarcodeForNewItem(barcode);
    setEditingStockItem(undefined);
    setShowAddItemModal(true);
  };

  // Add an item directly to stock from master barcode catalog
  const handleAddMasterItemToStock = (itemData: Omit<StockItem, 'id' | 'createdAt'>): StockItem => {
    const newItem: StockItem = {
      ...itemData,
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };

    setStockItems((prev) => [newItem, ...prev]);

    if (currentUser) {
      const itemPath = `users/${currentUser.uid}/items/${newItem.id}`;
      setDoc(doc(db, 'users', currentUser.uid, 'items', newItem.id), newItem).catch((e) => {
        handleFirestoreError(e, OperationType.CREATE, itemPath);
      });
    }

    showToast(
      profile.language === 'en'
        ? `Added "${newItem.name}" to shop stock!`
        : `"${newItem.name}" दुकान के स्टॉक में जुड़ गया!`
    );

    return newItem;
  };

  // Quick Sell POS Launcher (Barcode scanner + instant billing)
  const handleOpenScanQuickSell = (item?: StockItem, openLoose = false) => {
    setScanToSellInitialItem(item);
    setScanToSellInitialLoose(openLoose);
    setShowScanToSellModal(true);
  };

  // Night Count Save Handler
  const handleSaveNightCount = (
    updatedStock: { id: string; newQty: number }[],
    newSales: SaleRecord[],
    totalProfit: number
  ) => {
    // Update all stock quantities
    setStockItems((prev) =>
      prev.map((item) => {
        const found = updatedStock.find((u) => u.id === item.id);
        return found ? { ...item, currentQuantity: found.newQty } : item;
      })
    );

    // Append sales records
    if (newSales.length > 0) {
      setSalesRecords((prev) => [...newSales, ...prev]);
    }

    if (currentUser) {
      const countId = 'count-' + Date.now();
      const countPath = `users/${currentUser.uid}/night_counts/${countId}`;
      setDoc(doc(db, 'users', currentUser.uid, 'night_counts', countId), {
        date: new Date().toISOString(),
        totalSoldQty: updatedStock.length,
        totalProfit,
        itemsCheckedCount: updatedStock.length,
        createdAt: new Date().toISOString(),
      }).catch((e) => {
        handleFirestoreError(e, OperationType.CREATE, countPath);
      });

      // Save each new sale generated from night count in background
      for (const sale of newSales) {
        saveSaleRecordToFirestore(currentUser.uid, sale).catch(() => {});
      }

      // Fast atomic batch update for all audited stock items
      const qtyUpdates = updatedStock.map((u) => ({
        itemId: u.id,
        currentQuantity: u.newQty,
      }));
      batchUpdateStockQuantities(currentUser.uid, qtyUpdates);
    }

    showToast(`रात की गिनती सुरक्षित! आज का शुद्ध मुनाफ़ा: +₹${totalProfit.toFixed(0)}`);
  };

  // Scan Bill Confirmation Handler
  const handleConfirmBillToStock = (
    itemsToAdd: {
      name: string;
      quantity: number;
      unit: string;
      rate: number;
      category?: string;
      matchedItemId?: string;
    }[],
    vendorName: string,
    paymentMode: 'cash' | 'credit'
  ) => {
    const newlyCreatedItems: StockItem[] = [];
    const matchedUpdates: { id: string; currentQuantity: number; buyPrice: number; supplierName: string }[] = [];

    setStockItems((prev) => {
      let updated = [...prev];

      itemsToAdd.forEach((item) => {
        // Find match either from modal or by fuzzy synonym matching
        const effectiveMatchedId = item.matchedItemId || matchStockItem(item.name, updated)?.id;

        if (effectiveMatchedId) {
          const currentItem = updated.find((s) => s.id === effectiveMatchedId);
          const newQty = (currentItem?.currentQuantity || 0) + item.quantity;
          const newBuyPrice = item.rate > 0 ? item.rate : (currentItem?.buyPrice || 0);
          const sup = vendorName || (currentItem?.supplierName || '');
          matchedUpdates.push({ id: effectiveMatchedId, currentQuantity: newQty, buyPrice: newBuyPrice, supplierName: sup });

          updated = updated.map((s) =>
            s.id === effectiveMatchedId
              ? {
                  ...s,
                  currentQuantity: newQty,
                  buyPrice: newBuyPrice,
                  supplierName: sup,
                }
              : s
          );
        } else {
          // Add as new item with smart category inference
          const sellPrice = item.rate > 0 ? Math.round(item.rate * 1.15) : 30;
          const inferredCat = item.category || inferCategory(item.name);
          const newItem: StockItem = {
            id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: item.name,
            category: inferredCat,
            unit: item.unit || 'पैकेट',
            currentQuantity: item.quantity,
            reorderLevel: Math.max(2, Math.floor(item.quantity * 0.4)),
            buyPrice: item.rate,
            sellPrice,
            isPerishable: false,
            exchangeType: 'none',
            supplierName: vendorName,
            createdAt: new Date().toISOString(),
          };
          newlyCreatedItems.push(newItem);
          updated.unshift(newItem);
        }
      });

      return updated;
    });

    if (currentUser) {
      if (newlyCreatedItems.length > 0) {
        batchSaveStockItems(currentUser.uid, newlyCreatedItems);
      }
      if (matchedUpdates.length > 0) {
        batchUpdateStockQuantities(
          currentUser.uid,
          matchedUpdates.map((m) => ({ itemId: m.id, currentQuantity: m.currentQuantity }))
        );
      }
    }

    showToast(`पर्चे से ${itemsToAdd.length} आयटम स्टॉक में जुड़ गए!`);
  };

  // Show Customer Public Stock Catalog if navigated to public view (No Auth Required)
  if (isPublicView) {
    return (
      <PublicStockView
        storeId={publicStoreId}
        language={profile.language}
        onBackToApp={() => {
          setIsPublicView(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('view');
          url.searchParams.delete('public');
          url.searchParams.delete('store');
          window.history.pushState(
            {},
            '',
            url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '')
          );
        }}
      />
    );
  }

  // Customer Stock Catalog Sharing Handler
  const handleOpenShareStock = () => {
    const storeId = profile.phone || (currentUser ? currentUser.uid : 'demo');
    publishStoreCatalog(storeId, profile.shopName, profile.storeType, profile.phone, stockItems);
    setShowShareStockModal(true);
  };

  // Show Onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingModal
        initialLanguage={profile.language}
        initialStoreType={profile.storeType}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#262421] font-body antialiased flex flex-col selection:bg-[#2F6B4F] selection:text-white">
      {/* PWA Mobile Browser Install Banner (Chromium / iOS Safari / Android) */}
      <PWAInstallBanner language={profile.language} />

      {/* Fixed Sticky Header */}
      <Header
        profile={profile}
        currentUser={currentUser}
        isSyncing={isSyncing}
        onLanguageChange={(lang) => setProfile((p) => ({ ...p, language: lang }))}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenStoreSelect={() => setShowPersonalizeModal(true)}
        onOpenShareStock={handleOpenShareStock}
        onOpenWelcome={() => setShowWelcomeModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Screen Container (responsive mobile-first, max-w-md centered) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-20 pb-safe">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <HomeDashboard
                language={profile.language}
                stockItems={stockItems}
                customers={customers}
                transactions={transactions}
                salesRecords={salesRecords}
                currentUser={currentUser}
                onOpenAuth={() => setShowAuthModal(true)}
                onOpenQuickSell={(item) => {
                  if (item) {
                    setQuickSellTargetItem(item);
                    setShowQuickSellModal(true);
                  } else {
                    setQuickSellTargetItem(undefined);
                    setShowQuickSellModal(true);
                  }
                }}
                onOpenScanToSell={() => handleOpenScanQuickSell()}
                onOpenShareStock={handleOpenShareStock}
                onOpenScanBill={() => setShowScanBillModal(true)}
                onOpenAddItem={() => {
                  setInitialBarcodeForNewItem(undefined);
                  setEditingStockItem(undefined);
                  setShowAddItemModal(true);
                }}
                onOpenNightCount={() => setShowNightCountModal(true)}
                onOpenOrderList={() => setShowOrderListModal(true)}
                onNavigateToStock={() => setActiveTab('stock')}
                onNavigateToUdhaar={() => setActiveTab('udhaar')}
              />
            </motion.div>
          )}

          {activeTab === 'stock' && (
            <motion.div
              key="stock"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <StockList
                language={profile.language}
                storeType={profile.storeType}
                items={stockItems}
                onOpenAddItem={(itemToEdit) => {
                  setInitialBarcodeForNewItem(undefined);
                  setEditingStockItem(itemToEdit);
                  setShowAddItemModal(true);
                }}
                onOpenOrderList={() => setShowOrderListModal(true)}
                onQuickSell={(item) => {
                  setQuickSellTargetItem(item);
                  setShowQuickSellModal(true);
                }}
                onOpenScanToSell={() => handleOpenScanQuickSell()}
                onOpenShareStock={handleOpenShareStock}
              />
            </motion.div>
          )}

          {activeTab === 'udhaar' && (
            <motion.div
              key="udhaar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <UdhaarLedger
                language={profile.language}
                customers={customers}
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onAddCustomer={handleAddCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Professional Footer & Legal Copyright Notice */}
        <footer className="w-full max-w-lg mx-auto py-8 px-4 text-center select-none border-t border-[#E8E3D8]/80 mt-10 mb-8 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <AppLogo size="xs" showText={false} />
            <span className="font-extrabold text-xs text-[#16291E] tracking-tight">Krow™ Retail Operating System</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E7F0EA] text-[#2F6B4F] font-bold">v2.4</span>
          </div>
          <p className="text-xs text-[#5A5348] font-semibold">
            © 2026 Krow Technologies Inc. All rights reserved.
          </p>
          <p className="text-[11px] text-[#7A7265] leading-relaxed">
            {profile.language === 'en'
              ? 'Know More, Grow More • Smart inventory, udhaar khata ledger & profit manager'
              : profile.language === 'pa'
              ? 'ਕੈਨੋ ਮੋਰ, ਗ੍ਰੋ ਮੋਰ • ਸਮਾਰਟ ਇਨਵੈਂਟਰੀ, ਉਧਾਰ ਖਾਤਾ ਅਤੇ ਮੁਨਾਫ਼ਾ ਪ੍ਰਬੰਧਕ'
              : 'कैनो मोर • ग्रो मोर — स्मार्ट किराना व खुदरा दुकान बिलिंग, स्टॉक और उधार खाता'}
          </p>
          <div className="flex items-center justify-center flex-wrap gap-2.5 pt-1 text-[10px] text-[#8C8275]">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              256-bit Encrypted Ledger
            </span>
            <span>•</span>
            <span>Offline Ready (PWA)</span>
            <span>•</span>
            <span>भारत में गर्व से निर्मित 🇮🇳</span>
          </div>
        </footer>
      </main>

      {/* Fixed Bottom Navigation (Stitch Screen Bottom Bar) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        language={profile.language}
      />

      {/* MODALS */}
      {/* 1. Add / Edit Item Modal (Stitch Screen 16) */}
      {showAddItemModal && (
        <AddItemModal
          language={profile.language}
          storeType={profile.storeType}
          itemToEdit={editingStockItem}
          initialBarcode={initialBarcodeForNewItem}
          onSave={handleSaveStockItem}
          onDelete={handleDeleteStockItem}
          onClose={() => {
            setShowAddItemModal(false);
            setEditingStockItem(undefined);
            setInitialBarcodeForNewItem(undefined);
          }}
        />
      )}

      {/* 2. Wholesale Order List Modal (Stitch Screen 8) */}
      {showOrderListModal && (
        <OrderListModal
          language={profile.language}
          stockItems={stockItems}
          shopName={profile.shopName}
          ownerName={profile.ownerName}
          phone={profile.phone}
          onClose={() => setShowOrderListModal(false)}
          onBatchReceiveStock={handleBatchReceiveStock}
        />
      )}

      {/* 3. Night Count Modal (Stitch Screen 1) */}
      {showNightCountModal && (
        <NightCountModal
          language={profile.language}
          stockItems={stockItems}
          onSaveCount={handleSaveNightCount}
          onClose={() => setShowNightCountModal(false)}
        />
      )}

      {/* 4. Wholesale Purchase Bill Scanner Modal */}
      {showScanBillModal && (
        <ScanBillModal
          language={profile.language}
          stockItems={stockItems}
          onConfirmAddToStock={handleConfirmBillToStock}
          onClose={() => setShowScanBillModal(false)}
        />
      )}

      {/* 5. Quick Sell Modal (Counter POS: Bring items on counter, make list, sell) */}
      {showQuickSellModal && (
        <QuickSellModal
          language={profile.language}
          stockItems={stockItems}
          customers={customers}
          shopName={profile.shopName}
          preselectedItem={quickSellTargetItem}
          onConfirmCartSale={handleConfirmScanToSell}
          onRecordSale={handleRecordSale}
          onAddUdhaarTransaction={handleAddTransaction}
          onSwitchToScanToSell={() => {
            const currentItem = quickSellTargetItem;
            setShowQuickSellModal(false);
            setQuickSellTargetItem(undefined);
            handleOpenScanQuickSell(currentItem);
          }}
          onClose={() => {
            setShowQuickSellModal(false);
            setQuickSellTargetItem(undefined);
          }}
        />
      )}

      {/* 6. Barcode Quick Sell POS Modal (Barcode scanner + rapid POS) */}
      {showScanToSellModal && (
        <ScanToSellModal
          language={profile.language}
          stockItems={stockItems}
          initialItem={scanToSellInitialItem}
          initialShowLoosePicker={scanToSellInitialLoose}
          onConfirmSale={handleConfirmScanToSell}
          onLinkBarcode={handleLinkBarcodeToItem}
          onAddNewItemWithBarcode={handleAddNewItemWithBarcode}
          onAddMasterItemToStock={handleAddMasterItemToStock}
          onClose={() => {
            setShowScanToSellModal(false);
            setScanToSellInitialItem(undefined);
            setScanToSellInitialLoose(false);
          }}
        />
      )}

      {/* 7. Share Stock & QR Code Modal (Customer facing catalog) */}
      {showShareStockModal && (
        <ShareStockModal
          language={profile.language}
          storeId={profile.phone || 'demo'}
          storeName={profile.shopName}
          storePhone={profile.phone}
          stockItems={stockItems}
          onClose={() => setShowShareStockModal(false)}
          onOpenPublicPreview={() => {
            setShowShareStockModal(false);
            setPublicStoreId(profile.phone || 'demo');
            setIsPublicView(true);
          }}
        />
      )}

      {/* 8. Profile & Settings Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          currentUser={currentUser}
          isSyncing={isSyncing}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowProfileModal(false)}
          onOpenClearData={() => setShowClearDataModal(true)}
          onOpenWelcome={() => setShowWelcomeModal(true)}
          onLoadStationeryInventory={handleLoadStationeryInventory}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenPersonalize={() => setShowPersonalizeModal(true)}
          onSignOut={handleSignOut}
          onManualSync={handleManualSync}
          onInstallApp={async () => {
            if (pwa.isIOS) {
              showToast(
                profile.language === 'en'
                  ? 'Safari: Tap Share icon below and select Add to Home Screen'
                  : 'सफारी: नीचे शेयर बटन ⎋ दबाएं और "होम स्क्रीन पर जोड़ें" चुनें'
              );
            } else if (pwa.isInstallable) {
              await pwa.install();
            } else {
              showToast(
                profile.language === 'en'
                  ? 'App is already installed or ready in browser'
                  : 'ऐप होमस्क्रीन पर जोड़ने के लिए तैयार है'
              );
            }
          }}
          isAppInstalled={pwa.isInstalled}
          isAppInstallable={pwa.isInstallable || pwa.isIOS}
        />
      )}

      {/* 9. Clear All Store Data Confirmation Modal */}
      {showClearDataModal && (
        <ClearDataModal
          isOpen={showClearDataModal}
          onClose={() => setShowClearDataModal(false)}
          onConfirmClear={handleClearData}
          language={profile.language}
        />
      )}

      {/* 10. Astha's Krōw Welcome & Features Modal ("What can Krōw do?") */}
      {showWelcomeModal && (
        <KrowWelcomeFirstView
          currentLanguage={profile.language}
          currentStoreType={profile.storeType}
          shopName={profile.shopName}
          isModal={true}
          onClose={() => setShowWelcomeModal(false)}
          onOpenShop={(lang, storeType) => {
            handleUpdateProfile({ language: lang, storeType });
            setShowWelcomeModal(false);
          }}
        />
      )}

      {/* 11. Firebase Authentication Modal (Google 1-Click Sign-in/Sign-up) */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(customShopName, isNewUser, user) => {
            setShowAuthModal(false);
            if (user) {
              handleUpdateProfile({
                shopName: customShopName || profile.shopName,
                ownerName: user.displayName || profile.ownerName,
                logoUrl: user.photoURL || profile.logoUrl,
              });
            } else if (customShopName) {
              handleUpdateProfile({ shopName: customShopName });
            }
            // Automatically launch Shop Personalization so person can customize their shop immediately!
            setShowPersonalizeModal(true);
            showToast(
              profile.language === 'en'
                ? 'Signed in with Google! Customize your shop logo, title & category.'
                : 'Google से लॉगिन सफल! अब अपनी दुकान का लोगो, नाम और प्रकार चुनें।'
            );
          }}
          language={profile.language}
        />
      )}

      {/* 12. Personalize Shop Branding Modal (Logo Upload, Title & Category) */}
      {showPersonalizeModal && (
        <PersonalizeShopModal
          isOpen={showPersonalizeModal}
          profile={profile}
          currentUser={currentUser}
          language={profile.language}
          onClose={() => setShowPersonalizeModal(false)}
          onSave={async (updated) => {
            await handleUpdateProfile(updated);
            if (updated.storeType === 'stationery' && stockItems.length === 0) {
              const stationeryStock = getAllStationeryStockItems();
              setStockItems(stationeryStock);
            }
            showToast(
              profile.language === 'en'
                ? 'Shop branding & settings saved!'
                : 'आपकी दुकान की सजावट व सेटिंग्स सुरक्षित हो गईं!'
            );
          }}
        />
      )}

      {/* Toast Notification with Dynamic Island spring animation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="fixed top-20 left-1/2 z-50 bg-[#16291E] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-[#2F6B4F]/40 backdrop-blur-md select-none pointer-events-none"
          >
            <span className="material-symbols-outlined text-base text-[#D9A62E]">check_circle</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
