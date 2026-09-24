import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  StockItem,
  Customer,
  CustomerTransaction,
  SaleRecord,
  UserProfile,
  UserLoginRecord,
} from '../types';
import { getAllStationeryStockItems } from '../data/stationeryMasterCatalog';
import {
  INITIAL_STOCK_ITEMS,
  INITIAL_UNIFORM_STOCK_ITEMS,
  INITIAL_GIFT_STOCK_ITEMS,
} from '../data/defaultData';

export interface SyncCallbacks {
  onProfileChange?: (profile: UserProfile) => void;
  onStockItemsChange?: (items: StockItem[]) => void;
  onCustomersChange?: (customers: Customer[]) => void;
  onTransactionsChange?: (transactions: Record<string, CustomerTransaction[]>) => void;
  onSalesChange?: (sales: SaleRecord[]) => void;
  onError?: (err: Error) => void;
}

/**
 * Real-time subscription to all user data collections in Cloud Firestore.
 * Listens to Profile, Stock Items, Customers, Transactions, and Sales.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToUserData(userId: string, callbacks: SyncCallbacks): () => void {
  if (!userId) return () => {};

  const unsubscribers: Unsubscribe[] = [];

  try {
    // 1. Profile Doc Subscription (/users/{userId})
    const userDocRef = doc(db, 'users', userId);
    const unsubProfile = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<UserProfile>;
          callbacks.onProfileChange?.({
            uid: userId,
            shopName: data.shopName || 'Krōw Store',
            ownerName: data.ownerName || '',
            language: data.language || 'hi',
            storeType: data.storeType || 'kirana',
            phone: data.phone || '',
            createdAt: data.createdAt || new Date().toISOString(),
            email: data.email,
            photoURL: data.photoURL,
            logoUrl: data.logoUrl,
            registeredAt: data.registeredAt,
            lastLoginAt: data.lastLoginAt,
            lastLoginProvider: data.lastLoginProvider,
            loginCount: data.loginCount,
          });
        }
      },
      (error) => {
        console.warn('Firestore profile sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubscribers.push(unsubProfile);

    // 2. Stock Items Collection Subscription (/users/{userId}/items)
    const itemsCollRef = collection(db, 'users', userId, 'items');
    const unsubItems = onSnapshot(
      itemsCollRef,
      (snapshot) => {
        const items: StockItem[] = [];
        snapshot.forEach((d) => {
          items.push({ ...(d.data() as StockItem), id: d.id });
        });
        callbacks.onStockItemsChange?.(items);
      },
      (error) => {
        console.warn('Firestore stock items sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubscribers.push(unsubItems);

    // 3. Customers Collection Subscription (/users/{userId}/customers)
    const customersCollRef = collection(db, 'users', userId, 'customers');
    const unsubCustomers = onSnapshot(
      customersCollRef,
      (snapshot) => {
        const custs: Customer[] = [];
        snapshot.forEach((d) => {
          custs.push({ ...(d.data() as Customer), id: d.id });
        });
        callbacks.onCustomersChange?.(custs);
      },
      (error) => {
        console.warn('Firestore customers sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubscribers.push(unsubCustomers);

    // 4. Transactions Collection Subscription (/users/{userId}/transactions)
    const txCollRef = collection(db, 'users', userId, 'transactions');
    const unsubTx = onSnapshot(
      txCollRef,
      (snapshot) => {
        const txMap: Record<string, CustomerTransaction[]> = {};
        snapshot.forEach((d) => {
          const tx = { ...(d.data() as CustomerTransaction), id: d.id };
          if (!txMap[tx.customerId]) {
            txMap[tx.customerId] = [];
          }
          txMap[tx.customerId].push(tx);
        });
        // Sort transactions by timestamp ascending
        Object.keys(txMap).forEach((cId) => {
          txMap[cId].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        });
        callbacks.onTransactionsChange?.(txMap);
      },
      (error) => {
        console.warn('Firestore transactions sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubscribers.push(unsubTx);

    // 5. Sales Collection Subscription (/users/{userId}/sales)
    const salesCollRef = collection(db, 'users', userId, 'sales');
    const unsubSales = onSnapshot(
      salesCollRef,
      (snapshot) => {
        const sales: SaleRecord[] = [];
        snapshot.forEach((d) => {
          sales.push({ ...(d.data() as SaleRecord), id: d.id });
        });
        // Sort sales by timestamp descending
        sales.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        callbacks.onSalesChange?.(sales);
      },
      (error) => {
        console.warn('Firestore sales sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubscribers.push(unsubSales);
  } catch (err) {
    console.error('Failed to initialize Firestore real-time subscriptions:', err);
  }

  // Master cleanup
  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // ignore cleanup error
      }
    });
  };
}

/**
 * Explicitly records user registration data both to Firestore and LocalStorage.
 * Guarantees that the new shopkeeper account details, creation timestamp,
 * initial profile, and registration log are permanently saved.
 */
export async function recordUserRegistration(
  userId: string,
  data: {
    email: string;
    shopName: string;
    ownerName?: string;
    storeType?: string;
    language?: string;
    phone?: string;
    provider?: string;
    logoUrl?: string;
  }
): Promise<void> {
  if (!userId) return;
  const nowIso = new Date().toISOString();
  const provider = data.provider || 'password';

  // 1. Save to LocalStorage immediately for zero-delay offline resilience
  try {
    const localRegInfo = {
      uid: userId,
      email: data.email,
      shopName: data.shopName,
      ownerName: data.ownerName || '',
      storeType: data.storeType || 'kirana',
      language: data.language || 'hi',
      phone: data.phone || '',
      logoUrl: data.logoUrl || '',
      registeredAt: nowIso,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      lastLoginProvider: provider,
      loginCount: 1,
    };
    localStorage.setItem('krow_user_profile', JSON.stringify(localRegInfo));
    localStorage.setItem('krow_last_auth_user', JSON.stringify({
      uid: userId,
      email: data.email,
      shopName: data.shopName,
      registeredAt: nowIso,
    }));
  } catch (lsErr) {
    console.warn('LocalStorage save notice:', lsErr);
  }

  // 2. Persist to Cloud Firestore: /users/{userId}
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        uid: userId,
        email: data.email,
        shopName: data.shopName || 'Krōw Store',
        ownerName: data.ownerName || '',
        storeType: data.storeType || 'kirana',
        language: data.language || 'hi',
        phone: data.phone || '',
        logoUrl: data.logoUrl || null,
        registeredAt: nowIso,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        lastLoginProvider: provider,
        loginCount: 1,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // 3. Write registration session audit record: /users/{userId}/logins/{loginId}
    const loginId = 'reg-' + Date.now();
    const loginRef = doc(db, 'users', userId, 'logins', loginId);
    await setDoc(loginRef, {
      id: loginId,
      type: 'register',
      timestamp: Date.now(),
      isoTime: nowIso,
      provider,
      email: data.email,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      status: 'registered_successfully',
    });
  } catch (cloudErr) {
    console.warn('Could not record registration to Firestore:', cloudErr);
  }
}

/**
 * Records user login information, tracking each login session and auth provider.
 * Keeps user metadata and isolated login logs in Firestore and local storage.
 */
export async function recordUserLoginInfo(
  userId: string,
  user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    providerData?: { providerId: string }[];
  },
  profile?: Partial<UserProfile>
): Promise<void> {
  if (!userId) return;
  const nowIso = new Date().toISOString();
  const provider = user.providerData?.[0]?.providerId || 'password';

  // 1. Fast local cache update
  try {
    const cached = localStorage.getItem('krow_user_logins');
    const logs = cached ? JSON.parse(cached) : [];
    logs.unshift({
      id: 'log-' + Date.now(),
      type: 'login',
      timestamp: Date.now(),
      isoTime: nowIso,
      provider,
      email: user.email || '',
      status: 'login_successful',
    });
    localStorage.setItem('krow_user_logins', JSON.stringify(logs.slice(0, 20)));
  } catch (e) {
    // Ignore local storage error
  }

  try {
    const userDocRef = doc(db, 'users', userId);

    // 2. Update user profile document in Firestore
    await setDoc(
      userDocRef,
      {
        uid: userId,
        email: user.email || '',
        displayName: user.displayName || profile?.ownerName || '',
        photoURL: user.photoURL || '',
        shopName: profile?.shopName || 'Krōw Store',
        storeType: profile?.storeType || 'kirana',
        language: profile?.language || 'hi',
        phone: profile?.phone || '',
        lastLoginAt: nowIso,
        lastLoginProvider: provider,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    // 3. Add an audit log entry in /users/{userId}/logins/{loginId}
    const loginId = 'log-' + Date.now();
    const loginRef = doc(db, 'users', userId, 'logins', loginId);
    await setDoc(loginRef, {
      id: loginId,
      type: 'login',
      timestamp: Date.now(),
      isoTime: nowIso,
      provider,
      email: user.email || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      status: 'login_successful',
    });
  } catch (err) {
    console.warn('Could not record user login info:', err);
  }
}

/**
 * Retrieves the user's recent login audit history from Cloud Firestore
 * with fallback to local cached login history.
 */
export async function getUserLoginHistory(userId: string): Promise<UserLoginRecord[]> {
  if (!userId) return [];
  try {
    const loginsCollRef = collection(db, 'users', userId, 'logins');
    const q = query(loginsCollRef, orderBy('timestamp', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((docSnap) => docSnap.data() as UserLoginRecord);
    }
  } catch (err) {
    console.warn('Could not fetch cloud login history, reading local cache:', err);
  }

  // Fallback to local storage
  try {
    const cached = localStorage.getItem('krow_user_logins');
    if (cached) {
      return JSON.parse(cached) as UserLoginRecord[];
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Checks if the user already has data in Firestore.
 * If Firestore is completely fresh/empty, uploads the current local data using chunked batches.
 */
export async function seedInitialFirestoreDataIfEmpty(
  userId: string,
  localData: {
    profile: UserProfile;
    stockItems: StockItem[];
    customers: Customer[];
    transactions: Record<string, CustomerTransaction[]>;
    salesRecords: SaleRecord[];
  }
): Promise<boolean> {
  if (!userId) return false;

  try {
    const itemsCollRef = collection(db, 'users', userId, 'items');
    const snapshot = await getDocs(itemsCollRef);

    // If already has items in cloud, don't overwrite with local starter
    if (!snapshot.empty) {
      return false;
    }

    console.info('Firestore is fresh for user, migrating local items to cloud...');

    // Collect all operations
    type BatchOp = { ref: ReturnType<typeof doc>; data: any; merge?: boolean };
    const ops: BatchOp[] = [];

    // 1. Profile
    ops.push({
      ref: doc(db, 'users', userId),
      data: {
        shopName: localData.profile.shopName || 'Krōw Store',
        ownerName: localData.profile.ownerName || '',
        language: localData.profile.language || 'hi',
        storeType: localData.profile.storeType || 'kirana',
        phone: localData.profile.phone || '',
        email: localData.profile.email || '',
        createdAt: localData.profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      merge: true,
    });

    // 2. Stock items - enforce strict isolation by storeType
    let itemsToSeed = localData.stockItems;
    const storeType = localData.profile.storeType || 'kirana';
    if (storeType === 'stationery') {
      const hasKirana = itemsToSeed.some((it) => it.category === 'दाल व अनाज' || it.category === 'खाद्य तेल व घी');
      if (hasKirana || itemsToSeed.length === 0) {
        itemsToSeed = getAllStationeryStockItems();
      }
    } else if (storeType === 'uniform') {
      const hasKiranaOrStat = itemsToSeed.some((it) => it.category === 'दाल व अनाज' || it.category === 'पेन, पेंसिल व सुधार सामग्री');
      if (hasKiranaOrStat || itemsToSeed.length === 0) {
        itemsToSeed = INITIAL_UNIFORM_STOCK_ITEMS;
      }
    } else if (storeType === 'gift_shop') {
      const hasKiranaOrStat = itemsToSeed.some((it) => it.category === 'दाल व अनाज' || it.category === 'पेन, पेंसिल व सुधार सामग्री');
      if (hasKiranaOrStat || itemsToSeed.length === 0) {
        itemsToSeed = INITIAL_GIFT_STOCK_ITEMS;
      }
    } else if (storeType === 'kirana') {
      const hasStat = itemsToSeed.some((it) => it.category === 'पेन, पेंसिल व सुधार सामग्री' || it.category === 'कॉपियाँ, रजिस्टर व पेपर');
      if (hasStat || itemsToSeed.length === 0) {
        itemsToSeed = INITIAL_STOCK_ITEMS;
      }
    }

    for (const item of itemsToSeed) {
      ops.push({ ref: doc(db, 'users', userId, 'items', item.id), data: item });
    }

    // 3. Customers
    for (const cust of localData.customers) {
      ops.push({ ref: doc(db, 'users', userId, 'customers', cust.id), data: cust });
    }

    // 4. Transactions
    for (const custId of Object.keys(localData.transactions)) {
      for (const tx of localData.transactions[custId] || []) {
        ops.push({ ref: doc(db, 'users', userId, 'transactions', tx.id), data: tx });
      }
    }

    // 5. Sales
    for (const sale of localData.salesRecords) {
      ops.push({ ref: doc(db, 'users', userId, 'sales', sale.id), data: sale });
    }

    // Commit in chunks of 400 (Firestore max limit per batch is 500)
    const CHUNK_SIZE = 400;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const chunk = ops.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        if (op.merge) {
          batch.set(op.ref, op.data, { merge: true });
        } else {
          batch.set(op.ref, op.data);
        }
      }
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.warn('Could not auto-seed Firestore:', error);
    return false;
  }
}

/**
 * Saves multiple stock items in Firestore using fast chunked writeBatch.
 */
export async function batchSaveStockItems(userId: string, items: StockItem[]): Promise<void> {
  if (!userId || items.length === 0) return;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const itemRef = doc(db, 'users', userId, 'items', item.id);
        batch.set(itemRef, item);
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Batch save stock items error:', err);
  }
}

/**
 * Updates stock quantities in a single fast batch write.
 */
export async function batchUpdateStockQuantities(
  userId: string,
  updates: { itemId: string; currentQuantity: number; updatedAt?: string }[]
): Promise<void> {
  if (!userId || updates.length === 0) return;
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const u of chunk) {
        const itemRef = doc(db, 'users', userId, 'items', u.itemId);
        batch.set(
          itemRef,
          { currentQuantity: u.currentQuantity, updatedAt: u.updatedAt || new Date().toISOString() },
          { merge: true }
        );
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Batch update quantities error:', err);
  }
}

/**
 * Saves or updates user profile in Firestore
 */
export async function saveProfileToFirestore(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}`;
  try {
    const profileRef = doc(db, 'users', userId);
    await setDoc(profileRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Saves or updates a stock item in Firestore
 */
export async function saveStockItemToFirestore(userId: string, item: StockItem): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/items/${item.id}`;
  try {
    const itemRef = doc(db, 'users', userId, 'items', item.id);
    await setDoc(itemRef, item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a stock item from Firestore
 */
export async function deleteStockItemFromFirestore(userId: string, itemId: string): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/items/${itemId}`;
  try {
    const itemRef = doc(db, 'users', userId, 'items', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves or updates a customer in Firestore
 */
export async function saveCustomerToFirestore(userId: string, customer: Customer): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/customers/${customer.id}`;
  try {
    const custRef = doc(db, 'users', userId, 'customers', customer.id);
    await setDoc(custRef, customer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a customer from Firestore along with their transactions
 */
export async function deleteCustomerFromFirestore(userId: string, customerId: string): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/customers/${customerId}`;
  try {
    const custRef = doc(db, 'users', userId, 'customers', customerId);
    await deleteDoc(custRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves a customer transaction in Firestore
 */
export async function saveTransactionToFirestore(
  userId: string,
  transaction: CustomerTransaction
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/transactions/${transaction.id}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', transaction.id);
    await setDoc(txRef, transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Saves a sale record in Firestore
 */
export async function saveSaleRecordToFirestore(userId: string, sale: SaleRecord): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/sales/${sale.id}`;
  try {
    const saleRef = doc(db, 'users', userId, 'sales', sale.id);
    await setDoc(saleRef, sale);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Clears selected collections for a user in Firestore
 */
export async function clearUserFirestoreData(
  userId: string,
  options: {
    clearStock: boolean;
    clearCustomers: boolean;
    clearSales: boolean;
  }
): Promise<void> {
  if (!userId) return;

  try {
    if (options.clearStock) {
      const itemsSnapshot = await getDocs(collection(db, 'users', userId, 'items'));
      const batch = writeBatch(db);
      itemsSnapshot.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    if (options.clearCustomers) {
      const custsSnapshot = await getDocs(collection(db, 'users', userId, 'customers'));
      const txSnapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
      const batch = writeBatch(db);
      custsSnapshot.forEach((d) => batch.delete(d.ref));
      txSnapshot.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    if (options.clearSales) {
      const salesSnapshot = await getDocs(collection(db, 'users', userId, 'sales'));
      const batch = writeBatch(db);
      salesSnapshot.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('Error clearing user firestore data:', err);
  }
}
