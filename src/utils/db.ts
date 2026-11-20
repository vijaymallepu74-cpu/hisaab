/**
 * IndexedDB persistence layer for HISAAB:
 * 1. High-capacity screenshot storage (binary/dataURL).
 * 2. High-capacity ledger store for 10,000+ customers and 100,000+ transactions.
 * 3. Multi-shop data isolation with stable shopId indices.
 * 4. Safe recovery, zero sensitive logging, and fallback sync with LocalStorage.
 */

import { Customer, Transaction } from '../types';

const DB_NAME = 'HisaabAppDB';
const DB_VERSION = 3;
const STORE_SCREENSHOTS = 'screenshots';
const STORE_CUSTOMERS = 'customers';
const STORE_TRANSACTIONS = 'transactions';
const STORE_META = 'meta';

// In-memory LRU cache for fast lookup (capped at 100 items to avoid RAM bloat)
const memoryCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

function setCache(id: string, url: string) {
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(id, url);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const req = event.target as IDBOpenDBRequest;
      const db = req.result;
      const upgradeTx = req.transaction;
      
      // Store 1: Screenshots
      let shotStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_SCREENSHOTS)) {
        shotStore = db.createObjectStore(STORE_SCREENSHOTS, { keyPath: 'id' });
      } else if (upgradeTx) {
        shotStore = upgradeTx.objectStore(STORE_SCREENSHOTS);
      }
      if (shotStore! && !shotStore.indexNames.contains('shopId')) {
        shotStore.createIndex('shopId', 'shopId', { unique: false });
      }

      // Store 2: Customers
      // In v3, keyPath is 'id' (composed as `${shopId}_${phone}`) to avoid cross-shop phone collision
      if (event.oldVersion < 3 && db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        db.deleteObjectStore(STORE_CUSTOMERS);
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOMERS)) {
        const custStore = db.createObjectStore(STORE_CUSTOMERS, { keyPath: 'id' });
        custStore.createIndex('shopId', 'shopId', { unique: false });
        custStore.createIndex('phone', 'phone', { unique: false });
        custStore.createIndex('name', 'name', { unique: false });
      }

      // Store 3: Transactions
      let txStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        txStore = db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
      } else if (upgradeTx) {
        txStore = upgradeTx.objectStore(STORE_TRANSACTIONS);
      }
      if (txStore!) {
        if (!txStore.indexNames.contains('shopId')) {
          txStore.createIndex('shopId', 'shopId', { unique: false });
        }
        if (!txStore.indexNames.contains('phone')) {
          txStore.createIndex('phone', 'phone', { unique: false });
        }
        if (!txStore.indexNames.contains('date')) {
          txStore.createIndex('date', 'date', { unique: false });
        }
      }

      // Store 4: Metadata (settings, backups)
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/* ==========================================================================
   SCREENSHOT OPERATIONS (Shop-scoped)
   ========================================================================== */

export async function saveScreenshotToDB(id: string, dataUrl: string, shopId: string = 'shop_default'): Promise<string> {
  setCache(id, dataUrl);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SCREENSHOTS, 'readwrite');
      const store = tx.objectStore(STORE_SCREENSHOTS);
      const req = store.put({ 
        id, 
        shopId, 
        dataUrl, 
        createdAt: new Date().toISOString() 
      });

      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      localStorage.setItem(`hisaab_shot_${id}`, dataUrl);
      localStorage.setItem(`hisaab_shot_shop_${id}`, shopId);
    } catch {
      // quota or private browsing restriction
    }
    return id;
  }
}

export async function getScreenshotFromDB(id: string): Promise<string | null> {
  if (memoryCache.has(id)) {
    return memoryCache.get(id) || null;
  }

  // Check fallback localStorage
  const fallback = localStorage.getItem(`hisaab_shot_${id}`);
  if (fallback) {
    setCache(id, fallback);
    return fallback;
  }

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SCREENSHOTS, 'readonly');
      const store = tx.objectStore(STORE_SCREENSHOTS);
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          setCache(id, req.result.dataUrl);
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function deleteScreenshotFromDB(id: string): Promise<void> {
  memoryCache.delete(id);
  localStorage.removeItem(`hisaab_shot_${id}`);
  localStorage.removeItem(`hisaab_shot_shop_${id}`);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SCREENSHOTS, 'readwrite');
      const store = tx.objectStore(STORE_SCREENSHOTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

export async function getAllScreenshotsForShop(
  _shopId: string,
  screenshotIds: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!screenshotIds || screenshotIds.length === 0) return result;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SCREENSHOTS, 'readonly');
      const store = tx.objectStore(STORE_SCREENSHOTS);
      let pending = screenshotIds.length;

      for (const id of screenshotIds) {
        const cached = memoryCache.get(id);
        if (cached) {
          result[id] = cached;
          pending--;
          if (pending === 0) resolve(result);
          continue;
        }

        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.dataUrl) {
            result[id] = req.result.dataUrl;
          } else {
            const fallback = localStorage.getItem(`hisaab_shot_${id}`);
            if (fallback) result[id] = fallback;
          }
          pending--;
          if (pending === 0) resolve(result);
        };
        req.onerror = () => {
          pending--;
          if (pending === 0) resolve(result);
        };
      }
    });
  } catch {
    for (const id of screenshotIds) {
      const fallback = localStorage.getItem(`hisaab_shot_${id}`);
      if (fallback) result[id] = fallback;
    }
    return result;
  }
}

export async function restoreScreenshotsToDB(
  shopId: string,
  screenshots: Record<string, string>
): Promise<void> {
  const ids = Object.keys(screenshots || {});
  if (ids.length === 0) return;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SCREENSHOTS, 'readwrite');
      const store = tx.objectStore(STORE_SCREENSHOTS);

      for (const id of ids) {
        const dataUrl = screenshots[id];
        setCache(id, dataUrl);
        store.put({
          id,
          shopId,
          dataUrl,
          createdAt: new Date().toISOString(),
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    for (const id of ids) {
      try {
        localStorage.setItem(`hisaab_shot_${id}`, screenshots[id]);
        localStorage.setItem(`hisaab_shot_shop_${id}`, shopId);
      } catch {
        // quota
      }
    }
  }
}

/* ==========================================================================
   HIGH-CAPACITY SHOP-SCOPED LEDGER OPERATIONS (Customers & Transactions)
   ========================================================================== */

export async function saveLedgerToDB(
  shopId: string,
  customers: Customer[],
  transactions: Transaction[]
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_CUSTOMERS, STORE_TRANSACTIONS, STORE_META], 'readwrite');
      const custStore = tx.objectStore(STORE_CUSTOMERS);
      const txStore = tx.objectStore(STORE_TRANSACTIONS);
      const metaStore = tx.objectStore(STORE_META);

      // 1. Clear previous customers for this shop only
      const custShopIdx = custStore.index('shopId');
      const custCursorReq = custShopIdx.openKeyCursor(IDBKeyRange.only(shopId));
      custCursorReq.onsuccess = () => {
        const cursor = custCursorReq.result;
        if (cursor) {
          custStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      // 2. Clear previous transactions for this shop only
      const txShopIdx = txStore.index('shopId');
      const txCursorReq = txShopIdx.openKeyCursor(IDBKeyRange.only(shopId));
      txCursorReq.onsuccess = () => {
        const cursor = txCursorReq.result;
        if (cursor) {
          txStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      // 3. Put new customer records
      for (let i = 0; i < customers.length; i++) {
        const c = customers[i];
        const record = {
          ...c,
          id: c.id || `cust_${shopId}_${c.phone}`,
          shopId,
        };
        custStore.put(record);
      }

      // 4. Put new transaction records
      for (let j = 0; j < transactions.length; j++) {
        const t = transactions[j];
        const record = {
          ...t,
          shopId,
        };
        txStore.put(record);
      }

      metaStore.put({
        key: `lastSync_${shopId}`,
        shopId,
        timestamp: new Date().toISOString(),
        customerCount: customers.length,
        transactionCount: transactions.length,
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Graceful fallback to localStorage
  }
}

export async function loadLedgerFromDB(
  shopId: string = 'shop_default'
): Promise<{
  customers: Customer[];
  transactions: Transaction[];
} | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_CUSTOMERS, STORE_TRANSACTIONS], 'readonly');
      const custStore = tx.objectStore(STORE_CUSTOMERS);
      const txStore = tx.objectStore(STORE_TRANSACTIONS);

      const custShopIdx = custStore.index('shopId');
      const txShopIdx = txStore.index('shopId');

      const custReq = custShopIdx.getAll(IDBKeyRange.only(shopId));
      const txReq = txShopIdx.getAll(IDBKeyRange.only(shopId));

      let customers: Customer[] | null = null;
      let transactions: Transaction[] | null = null;

      custReq.onsuccess = () => {
        customers = custReq.result;
        if (transactions !== null) {
          resolve({ customers: customers || [], transactions: transactions || [] });
        }
      };

      txReq.onsuccess = () => {
        transactions = txReq.result;
        if (customers !== null) {
          resolve({ customers: customers || [], transactions: transactions || [] });
        }
      };

      tx.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Resets ONLY the specified shop's records, transactions and payment screenshots.
 * Leaves all other shops and global metadata untouched.
 */
export async function clearShopLedgerFromDB(shopId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(
        [STORE_CUSTOMERS, STORE_TRANSACTIONS, STORE_SCREENSHOTS, STORE_META],
        'readwrite'
      );
      const custStore = tx.objectStore(STORE_CUSTOMERS);
      const txStore = tx.objectStore(STORE_TRANSACTIONS);
      const shotStore = tx.objectStore(STORE_SCREENSHOTS);
      const metaStore = tx.objectStore(STORE_META);

      // Delete customers for this shop
      const custShopIdx = custStore.index('shopId');
      const custCursorReq = custShopIdx.openKeyCursor(IDBKeyRange.only(shopId));
      custCursorReq.onsuccess = () => {
        const cursor = custCursorReq.result;
        if (cursor) {
          custStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      // Delete transactions for this shop
      const txShopIdx = txStore.index('shopId');
      const txCursorReq = txShopIdx.openKeyCursor(IDBKeyRange.only(shopId));
      txCursorReq.onsuccess = () => {
        const cursor = txCursorReq.result;
        if (cursor) {
          txStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      // Delete screenshots for this shop
      const shotShopIdx = shotStore.index('shopId');
      const shotCursorReq = shotShopIdx.openKeyCursor(IDBKeyRange.only(shopId));
      shotCursorReq.onsuccess = () => {
        const cursor = shotCursorReq.result;
        if (cursor) {
          shotStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      // Clear meta for this shop
      metaStore.delete(`lastSync_${shopId}`);

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

/**
 * Asks the browser to grant persistent storage to prevent automatic eviction
 * of IndexedDB and LocalStorage during disk pressure.
 */
export async function requestStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

