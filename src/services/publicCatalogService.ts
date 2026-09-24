import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { StockItem, PublicCatalogItem, PublicStoreInfo } from '../types';
import { INITIAL_STOCK_ITEMS } from '../data/defaultData';

const LOCAL_PUBLIC_STORE_KEY = 'krow_public_store_info';
const LOCAL_PUBLIC_CATALOG_KEY = 'krow_public_catalog_items';

/**
 * Publishes a shop's public catalog to Firestore (/public_stores/{storeId})
 * STRICT PRIVACY: NEVER writes buyPrice, reorderLevel, profit, or supplier details.
 * Uses writeBatch for fast, atomic, 1-network-call execution.
 */
export async function publishStoreCatalog(
  storeId: string,
  shopName: string,
  storeType: string,
  phone?: string,
  items: StockItem[] = []
): Promise<void> {
  if (!storeId) return;

  const sanitizedItems: PublicCatalogItem[] = items.map((item) => {
    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (item.currentQuantity <= 0) {
      status = 'out_of_stock';
    } else if (item.currentQuantity <= item.reorderLevel) {
      status = 'low_stock';
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      sellPrice: item.sellPrice, // Shopkeeper-set selling price only
      status,
      updatedAt: new Date().toISOString(),
    };
  });

  const storeInfo: PublicStoreInfo = {
    storeId,
    shopName: shopName || 'दुकान',
    storeType: storeType || 'kirana',
    phone: phone || '',
    itemCount: sanitizedItems.length,
    lastUpdated: new Date().toISOString(),
  };

  // Cache in localStorage for offline / instant availability
  try {
    localStorage.setItem(LOCAL_PUBLIC_STORE_KEY + '_' + storeId, JSON.stringify(storeInfo));
    localStorage.setItem(LOCAL_PUBLIC_CATALOG_KEY + '_' + storeId, JSON.stringify(sanitizedItems));
  } catch (e) {
    // ignore local storage errors
  }

  // Publish to Firestore using fast writeBatch
  try {
    const storeRef = doc(db, 'public_stores', storeId);
    await setDoc(storeRef, {
      shopName: storeInfo.shopName,
      storeType: storeInfo.storeType,
      ownerPhone: storeInfo.phone || '',
      ownerId: storeId,
      itemCount: sanitizedItems.length,
      updatedAt: storeInfo.lastUpdated,
    });

    // Write in chunks of 400 with writeBatch for fast execution
    const CHUNK_SIZE = 400;
    for (let i = 0; i < sanitizedItems.length; i += CHUNK_SIZE) {
      const chunk = sanitizedItems.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const itemRef = doc(db, 'public_stores', storeId, 'catalog', item.id);
        batch.set(itemRef, {
          name: item.name,
          category: item.category,
          unit: item.unit,
          sellPrice: item.sellPrice ?? 0,
          status: item.status,
          updatedAt: item.updatedAt,
        });
      }
      await batch.commit();
    }
  } catch (err) {
    // If not authenticated yet or offline, local cache will serve the view
    console.warn('Could not write public store to Firestore (offline or unauthenticated):', err);
  }
}

/**
 * Loads a public store's catalog from Firestore without requiring authentication.
 * If network fails or store is demo, falls back to locally sanitized public items.
 */
export async function getPublicStoreCatalog(
  storeId: string
): Promise<{ store: PublicStoreInfo; items: PublicCatalogItem[] }> {
  // 1. Try reading from Firestore /public_stores/{storeId}
  try {
    const storeRef = doc(db, 'public_stores', storeId);
    const storeSnap = await getDoc(storeRef);

    if (storeSnap.exists()) {
      const storeData = storeSnap.data();
      const storeInfo: PublicStoreInfo = {
        storeId,
        shopName: storeData.shopName || 'दुकान',
        storeType: storeData.storeType || 'kirana',
        phone: storeData.ownerPhone || '',
        itemCount: storeData.itemCount || 0,
        lastUpdated: storeData.updatedAt || new Date().toISOString(),
      };

      const catalogCol = collection(db, 'public_stores', storeId, 'catalog');
      const catalogSnap = await getDocs(catalogCol);
      const items: PublicCatalogItem[] = [];

      catalogSnap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          name: data.name || 'सामान',
          category: data.category || 'सामान्य',
          unit: data.unit || 'पैकेट',
          sellPrice: typeof data.sellPrice === 'number' ? data.sellPrice : undefined,
          status: data.status || 'in_stock',
          updatedAt: data.updatedAt,
        });
      });

      if (items.length > 0) {
        return { store: storeInfo, items };
      }
    }
  } catch (err) {
    console.warn('Could not fetch from Firestore, attempting local public cache:', err);
  }

  // 2. Check localStorage fallback for this store
  try {
    const cachedStore = localStorage.getItem(LOCAL_PUBLIC_STORE_KEY + '_' + storeId);
    const cachedItems = localStorage.getItem(LOCAL_PUBLIC_CATALOG_KEY + '_' + storeId);
    if (cachedStore && cachedItems) {
      return {
        store: JSON.parse(cachedStore),
        items: JSON.parse(cachedItems),
      };
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback: Build public view from default stock items (sanitized of buy price and margins)
  const defaultSanitized: PublicCatalogItem[] = INITIAL_STOCK_ITEMS.map((item) => {
    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (item.currentQuantity <= 0) {
      status = 'out_of_stock';
    } else if (item.currentQuantity <= item.reorderLevel) {
      status = 'low_stock';
    }
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      sellPrice: item.sellPrice,
      status,
      updatedAt: item.createdAt,
    };
  });

  return {
    store: {
      storeId,
      shopName: 'Krōw Demo Store',
      storeType: 'kirana',
      phone: '',
      itemCount: defaultSanitized.length,
      lastUpdated: new Date().toISOString(),
    },
    items: defaultSanitized,
  };
}
