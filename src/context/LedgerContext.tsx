import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Customer, Transaction, CustomerSummary, OverallSummary, ImportPayload, AppSettings, ShopProfile, Language } from '../types';
import { getEffectiveToday, getDaysDiff } from '../utils/date';
import { normalizePhone, isValidIndianPhone } from '../utils/format';
import { 
  deleteScreenshotFromDB, 
  saveLedgerToDB, 
  loadLedgerFromDB, 
  clearShopLedgerFromDB,
  getAllScreenshotsForShop,
  restoreScreenshotsToDB,
  requestStoragePersistence
} from '../utils/db';
import { 
  encryptVaultData, 
  decryptVaultData, 
  EncryptedVaultEnvelope, 
  VaultPayloadData 
} from '../utils/crypto';

const SETTINGS_KEY = 'hisaab_settings_v1';
const LEGACY_STORAGE_KEY = 'hisaab_store_v1';
const getShopStorageKey = (shopId: string) => `hisaab_store_${shopId}_v1`;

interface LedgerContextType {
  activeShopId: string;
  shops: ShopProfile[];
  shopName: string;
  upiId: string;
  language: Language;
  effectiveToday: string;
  customers: Customer[];
  transactions: Transaction[];
  customerSummaries: CustomerSummary[];
  overallSummary: OverallSummary;
  getCustomerByPhone: (phone: string) => CustomerSummary | undefined;
  addCustomer: (name: string, phone: string) => { success: boolean; error?: string };
  addTransaction: (tx: {
    phone: string;
    type: 'credit' | 'payment';
    amount: number;
    date: string;
    note?: string;
    screenshotId?: string;
  }) => { success: boolean; error?: string; transaction?: Transaction };
  updateTransaction: (id: string, updates: {
    amount?: number;
    date?: string;
    note?: string;
  }) => { success: boolean; error?: string };
  deleteTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  importJsonData: (jsonStr: string) => { success: boolean; error?: string; summary?: { shop: string; customers: number; entries: number } };
  setShopName: (name: string) => void;
  setUpiId: (upi: string) => void;
  setLanguage: (lang: Language) => void;
  loadSampleDataset: () => void;
  clearAllData: () => void;
  switchShop: (shopId: string) => void;
  createShop: (name: string, upiId?: string) => string;
  exportEncryptedBackup: (password: string) => Promise<string>;
  previewEncryptedBackup: (fileContent: string, password: string) => Promise<VaultPayloadData & { totalOutstanding: number }>;
  restoreEncryptedBackup: (decryptedData: VaultPayloadData) => Promise<void>;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

const DEFAULT_SHOP_ID = 'shop_default';
const DEFAULT_SHOP: ShopProfile = {
  id: DEFAULT_SHOP_ID,
  name: 'Lakshmi Provision Store',
  upiId: 'exampleupi@hdjcbank',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read effective today (observes ?today=YYYY-MM-DD)
  const effectiveToday = useMemo(() => getEffectiveToday(), []);

  // Settings & Shop Profiles
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // If legacy format had shopName directly
          let shopList: ShopProfile[] = Array.isArray(parsed.shops) ? parsed.shops : [];
          let activeId = parsed.activeShopId || DEFAULT_SHOP_ID;

          if (shopList.length === 0) {
            shopList = [{
              id: DEFAULT_SHOP_ID,
              name: parsed.shopName || 'Lakshmi Provision Store',
              upiId: parsed.upiId || 'exampleupi@hdjcbank',
              createdAt: new Date().toISOString(),
            }];
            activeId = DEFAULT_SHOP_ID;
          }

          const validLang: Language = (parsed.language === 'te' || parsed.language === 'hi') ? parsed.language : 'en';

          return {
            activeShopId: activeId,
            shops: shopList,
            language: validLang,
          };
        }
      }
    } catch {
      // Safe fallback on corrupted storage
    }

    return {
      activeShopId: DEFAULT_SHOP_ID,
      shops: [DEFAULT_SHOP],
      language: 'en',
    };
  });

  const activeShopId = settings.activeShopId;
  const shops = settings.shops;

  const activeShop = useMemo(() => {
    return shops.find((s) => s.id === activeShopId) || shops[0] || DEFAULT_SHOP;
  }, [shops, activeShopId]);

  // Legacy data migration: migrate 'hisaab_store_v1' to 'hisaab_store_shop_default_v1'
  useEffect(() => {
    try {
      const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyData && !localStorage.getItem(getShopStorageKey(DEFAULT_SHOP_ID))) {
        localStorage.setItem(getShopStorageKey(DEFAULT_SHOP_ID), legacyData);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      // ignore
    }

    // Auto-request persistent browser storage for durability against OS/browser eviction
    requestStoragePersistence().catch(() => {});
  }, []);

  // Customers & Transactions State for the active shop
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(getShopStorageKey(activeShopId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.customers)) {
          return parsed.customers;
        }
      }
    } catch {
      // safe fallback
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(getShopStorageKey(activeShopId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.transactions)) {
          return parsed.transactions;
        }
      }
    } catch {
      // safe fallback
    }
    return [];
  });

  // Track currently active shop ID in a ref to prevent race conditions during shop switching
  const currentShopIdRef = useRef<string>(activeShopId);
  currentShopIdRef.current = activeShopId;

  // When switching shops, load that shop's data from LocalStorage or IndexedDB
  const handleShopSwitchLoad = useCallback((newShopId: string) => {
    currentShopIdRef.current = newShopId;
    let loadedFromLocal = false;
    try {
      const saved = localStorage.getItem(getShopStorageKey(newShopId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.customers) && Array.isArray(parsed.transactions)) {
          setCustomers(parsed.customers);
          setTransactions(parsed.transactions);
          loadedFromLocal = true;
        }
      }
    } catch {
      // fallback to IndexedDB
    }

    if (!loadedFromLocal) {
      loadLedgerFromDB(newShopId).then((data) => {
        if (currentShopIdRef.current === newShopId) {
          if (data && (data.customers.length > 0 || data.transactions.length > 0)) {
            setCustomers(data.customers);
            setTransactions(data.transactions);
          } else {
            setCustomers([]);
            setTransactions([]);
          }
        }
      });
    }
  }, []);

  // Synchronize with IndexedDB on mount if localStorage was empty
  useEffect(() => {
    let isMounted = true;
    if (customers.length === 0 && transactions.length === 0) {
      loadLedgerFromDB(activeShopId).then((data) => {
        if (isMounted && data && data.customers.length > 0) {
          setCustomers(data.customers);
          setTransactions(data.transactions);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeShopId]);

  // Dual-tier shop-isolated persistence:
  // Saves to `hisaab_store_${activeShopId}_v1` immediately and to IndexedDB asynchronously.
  useEffect(() => {
    const shopId = activeShopId;
    try {
      const payload = {
        version: 1,
        shopId,
        savedAt: new Date().toISOString(),
        customers,
        transactions,
      };
      localStorage.setItem(getShopStorageKey(shopId), JSON.stringify(payload));
    } catch {
      // Storage quota or restriction
    }

    // High-capacity IndexedDB asynchronous backup
    saveLedgerToDB(shopId, customers, transactions).catch(() => {
      // Silently catch persistence failures without logging sensitive data
    });
  }, [customers, transactions, activeShopId]);

  // Save settings changes
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Storage quota or restriction
    }
  }, [settings]);

  // Derived summaries calculation engine - OPTIMIZED SINGLE-PASS O(T + C)
  const { customerSummaries, overallSummary, customerSummariesMap } = useMemo(() => {
    let totalCredit = 0;
    let totalPayment = 0;
    let totalOutstanding = 0;
    let customersWithBalanceCount = 0;

    // 1. Single-pass O(T) grouping of transactions by customer phone
    const txByPhone = new Map<string, Transaction[]>();
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      let list = txByPhone.get(t.phone);
      if (!list) {
        list = [];
        txByPhone.set(t.phone, list);
      }
      list.push(t);
    }

    const summariesMap = new Map<string, CustomerSummary>();

    // 2. Single-pass O(C) customer summaries calculation
    const summaries: CustomerSummary[] = new Array(customers.length);

    for (let cIdx = 0; cIdx < customers.length; cIdx++) {
      const c = customers[cIdx];
      const custTxs = txByPhone.get(c.phone) || [];

      // Sort newest first only for this customer's own entries
      if (custTxs.length > 1) {
        custTxs.sort((a, b) => {
          const dateCmp = b.date.localeCompare(a.date);
          if (dateCmp !== 0) return dateCmp;
          return b.id.localeCompare(a.id);
        });
      }

      let cCredit = 0;
      let cPayment = 0;
      let lastPayDate: string | undefined;
      let lastCredDate: string | undefined;

      for (let tIdx = 0; tIdx < custTxs.length; tIdx++) {
        const t = custTxs[tIdx];
        if (t.type === 'credit') {
          cCredit += t.amount;
          if (!lastCredDate || t.date > lastCredDate) {
            lastCredDate = t.date;
          }
        } else if (t.type === 'payment') {
          cPayment += t.amount;
          if (!lastPayDate || t.date > lastPayDate) {
            lastPayDate = t.date;
          }
        }
      }

      // Customer Balance = Sum of credits - Sum of payments
      const balance = Math.round(cCredit - cPayment);
      totalCredit += cCredit;
      totalPayment += cPayment;
      totalOutstanding += balance;

      if (balance > 0) {
        customersWithBalanceCount++;
      }

      const daysSinceLastPayment = lastPayDate
        ? getDaysDiff(lastPayDate, effectiveToday)
        : undefined;

      const daysSinceLastCredit = lastCredDate
        ? getDaysDiff(lastCredDate, effectiveToday)
        : undefined;

      const summary: CustomerSummary = {
        ...c,
        balance,
        totalCredit: Math.round(cCredit),
        totalPayment: Math.round(cPayment),
        lastPaymentDate: lastPayDate,
        lastCreditDate: lastCredDate,
        daysSinceLastPayment,
        daysSinceLastCredit,
        transactions: custTxs,
      };

      summaries[cIdx] = summary;
      summariesMap.set(c.phone, summary);
    }

    // Determine top defaulter (highest positive balance)
    let topDefaulter: CustomerSummary | undefined;
    let highestBalance = 0;

    for (let sIdx = 0; sIdx < summaries.length; sIdx++) {
      const summary = summaries[sIdx];
      if (summary.balance > highestBalance) {
        highestBalance = summary.balance;
        topDefaulter = summary;
      }
    }

    const overall: OverallSummary = {
      totalOutstanding: Math.round(totalOutstanding),
      totalCustomers: customers.length,
      customersWithBalance: customersWithBalanceCount,
      topDefaulter,
      totalCredit: Math.round(totalCredit),
      totalPayment: Math.round(totalPayment),
    };

    return {
      customerSummaries: summaries,
      overallSummary: overall,
      customerSummariesMap: summariesMap,
    };
  }, [customers, transactions, effectiveToday]);

  const getCustomerByPhone = useCallback(
    (phone: string) => {
      const clean = normalizePhone(phone);
      return customerSummariesMap.get(clean);
    },
    [customerSummariesMap]
  );

  const addCustomer = useCallback(
    (name: string, rawPhone: string) => {
      const trimmedName = name.trim();
      const cleanPhone = normalizePhone(rawPhone);

      if (!trimmedName) {
        return { success: false, error: 'Customer name is required' };
      }
      if (!isValidIndianPhone(cleanPhone)) {
        return { success: false, error: 'Phone number must be a valid 10-digit Indian mobile number' };
      }
      if (customers.some((c) => c.phone === cleanPhone)) {
        return { success: false, error: `Customer with phone ${cleanPhone} already exists` };
      }

      const newCustomer: Customer = {
        id: `cust_${activeShopId}_${cleanPhone}`,
        shopId: activeShopId,
        name: trimmedName,
        phone: cleanPhone,
        createdAt: new Date().toISOString(),
      };

      setCustomers((prev) => [...prev, newCustomer]);
      return { success: true };
    },
    [customers, activeShopId]
  );

  const addTransaction = useCallback(
    (tx: {
      phone: string;
      type: 'credit' | 'payment';
      amount: number;
      date: string;
      note?: string;
      screenshotId?: string;
    }) => {
      const cleanPhone = normalizePhone(tx.phone);
      const customer = customers.find((c) => c.phone === cleanPhone);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      const amountVal = Math.round(Number(tx.amount));
      if (isNaN(amountVal) || amountVal <= 0) {
        return { success: false, error: 'Amount must be greater than zero' };
      }

      if (!tx.date || !/^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
        return { success: false, error: 'Invalid date format' };
      }

      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        shopId: activeShopId,
        phone: cleanPhone,
        type: tx.type,
        amount: amountVal,
        date: tx.date,
        note: tx.note?.trim() || (tx.type === 'credit' ? 'Credit' : 'Payment'),
        screenshotId: tx.type === 'payment' ? tx.screenshotId : undefined,
      };

      setTransactions((prev) => [newTx, ...prev]);
      return { success: true, transaction: newTx };
    },
    [customers, activeShopId]
  );

  const updateTransaction = useCallback(
    (id: string, updates: { amount?: number; date?: string; note?: string }) => {
      let found = false;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            found = true;
            return {
              ...t,
              amount: updates.amount !== undefined ? Math.round(Number(updates.amount)) : t.amount,
              date: updates.date !== undefined ? updates.date : t.date,
              note: updates.note !== undefined ? updates.note.trim() : t.note,
            };
          }
          return t;
        })
      );

      if (!found) {
        return { success: false, error: 'Transaction not found' };
      }
      return { success: true };
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) {
      return { success: false, error: 'Transaction not found' };
    }

    if (tx.screenshotId) {
      await deleteScreenshotFromDB(tx.screenshotId);
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    return { success: true };
  }, [transactions]);

  /**
   * JSON Import complying strictly with Section 11 & Multi-Shop Isolation:
   * If dataset specifies a shop name, creates/switches to that isolated shop profile,
   * completely segregating records from any previous shop.
   */
  const importJsonData = useCallback((jsonStr: string) => {
    if (!jsonStr || !jsonStr.trim()) {
      return { success: false, error: 'Please paste valid JSON into the import box.' };
    }

    let parsed: ImportPayload;
    try {
      parsed = JSON.parse(jsonStr.trim());
    } catch (e: any) {
      return { success: false, error: `Invalid JSON syntax: ${e.message}` };
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return { success: false, error: 'JSON root must be an object with customers and entries.' };
    }

    if (!Array.isArray(parsed.customers)) {
      return { success: false, error: 'JSON missing required "customers" array.' };
    }

    if (!Array.isArray(parsed.entries)) {
      return { success: false, error: 'JSON missing required "entries" array.' };
    }

    // Determine target shop
    let targetShopId = activeShopId;
    let targetShopName = activeShop.name;

    if (parsed.shop && typeof parsed.shop === 'string' && parsed.shop.trim()) {
      targetShopName = parsed.shop.trim();
      // Check if matching shop already exists in list
      const existingShop = shops.find(
        (s) => s.name.toLowerCase() === targetShopName.toLowerCase()
      );
      if (existingShop) {
        targetShopId = existingShop.id;
      } else {
        // Generate new stable shop ID
        const slug = targetShopName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        targetShopId = `shop_${slug || 'store'}_${Date.now().toString(36)}`;
        const newShopProfile: ShopProfile = {
          id: targetShopId,
          name: targetShopName,
          upiId: 'exampleupi@hdjcbank',
          createdAt: new Date().toISOString(),
        };
        setSettings((prev) => ({
          ...prev,
          activeShopId: targetShopId,
          shops: [...prev.shops, newShopProfile],
        }));
      }
    }

    // Ensure activeShopId matches targetShopId
    if (settings.activeShopId !== targetShopId) {
      setSettings((prev) => ({
        ...prev,
        activeShopId: targetShopId,
      }));
    }

    // Validate customers
    const validatedCustomers: Customer[] = [];
    const seenPhones = new Set<string>();

    for (let i = 0; i < parsed.customers.length; i++) {
      const c = parsed.customers[i];
      if (!c.name || typeof c.name !== 'string' || !c.name.trim()) {
        return { success: false, error: `Customer at index ${i} is missing a valid name.` };
      }
      const phone = normalizePhone(c.phone);
      if (!isValidIndianPhone(phone)) {
        return { success: false, error: `Customer "${c.name}" has invalid 10-digit phone number: ${c.phone}` };
      }
      if (seenPhones.has(phone)) {
        return { success: false, error: `Duplicate phone number in customers list: ${phone}` };
      }
      seenPhones.add(phone);
      validatedCustomers.push({
        id: `cust_${targetShopId}_${phone}`,
        shopId: targetShopId,
        name: c.name.trim(),
        phone,
        createdAt: new Date().toISOString(),
      });
    }

    // Validate entries
    const validatedEntries: Transaction[] = [];
    for (let i = 0; i < parsed.entries.length; i++) {
      const e = parsed.entries[i];
      const phone = normalizePhone(e.phone);
      if (!seenPhones.has(phone)) {
        return {
          success: false,
          error: `Entry at index ${i} references unknown customer phone: ${e.phone}`,
        };
      }

      const typeStr = String(e.type).toLowerCase().trim();
      if (typeStr !== 'credit' && typeStr !== 'payment') {
        return {
          success: false,
          error: `Entry at index ${i} has invalid type "${e.type}". Expected "credit" or "payment".`,
        };
      }

      const amountVal = Math.round(Number(e.amount));
      if (isNaN(amountVal) || amountVal <= 0) {
        return {
          success: false,
          error: `Entry at index ${i} has invalid amount "${e.amount}". Must be positive integer.`,
        };
      }

      if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date).trim())) {
        return {
          success: false,
          error: `Entry at index ${i} has invalid date format "${e.date}". Expected YYYY-MM-DD.`,
        };
      }

      validatedEntries.push({
        id: `tx_import_${i + 1}_${phone}_${Date.now()}`,
        shopId: targetShopId,
        phone,
        type: typeStr as 'credit' | 'payment',
        amount: amountVal,
        date: String(e.date).trim(),
        note: e.note ? String(e.note).trim() : (typeStr === 'credit' ? 'Credit' : 'Payment'),
      });
    }

    // Populate dataset strictly for this shop
    setCustomers(validatedCustomers);
    setTransactions(validatedEntries);

    // Save synchronously to this shop's local key
    try {
      localStorage.setItem(
        getShopStorageKey(targetShopId),
        JSON.stringify({
          version: 1,
          shopId: targetShopId,
          savedAt: new Date().toISOString(),
          customers: validatedCustomers,
          transactions: validatedEntries,
        })
      );
    } catch {
      // ignore
    }

    // High-capacity IndexedDB async save
    saveLedgerToDB(targetShopId, validatedCustomers, validatedEntries).catch(() => {});

    return {
      success: true,
      summary: {
        shop: targetShopName,
        customers: validatedCustomers.length,
        entries: validatedEntries.length,
      },
    };
  }, [activeShopId, activeShop.name, shops, settings.activeShopId]);

  const setShopName = useCallback((name: string) => {
    const trimmed = name.trim() || 'My Shop';
    setSettings((prev) => ({
      ...prev,
      shops: prev.shops.map((s) => (s.id === prev.activeShopId ? { ...s, name: trimmed } : s)),
    }));
  }, []);

  const setUpiId = useCallback((upi: string) => {
    const trimmed = upi.trim();
    setSettings((prev) => ({
      ...prev,
      shops: prev.shops.map((s) => (s.id === prev.activeShopId ? { ...s, upiId: trimmed } : s)),
    }));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
  }, []);

  /**
   * Resets ONLY the active shop's records, transactions and payment screenshots.
   * Other shops and browser site data are completely preserved.
   */
  const clearAllData = useCallback(() => {
    const currentId = activeShopId;
    setCustomers([]);
    setTransactions([]);
    try {
      localStorage.removeItem(getShopStorageKey(currentId));
    } catch {
      // ignore
    }
    clearShopLedgerFromDB(currentId).catch(() => {});
  }, [activeShopId]);

  const switchShop = useCallback((targetShopId: string) => {
    if (targetShopId === activeShopId) return;
    const target = shops.find((s) => s.id === targetShopId);
    if (!target) return;

    setSettings((prev) => ({
      ...prev,
      activeShopId: targetShopId,
    }));

    handleShopSwitchLoad(targetShopId);
  }, [activeShopId, shops, handleShopSwitchLoad]);

  const createShop = useCallback((name: string, upiId?: string): string => {
    const trimmed = name.trim() || 'New Shop';
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const newId = `shop_${slug || 'store'}_${Date.now().toString(36)}`;
    const newProfile: ShopProfile = {
      id: newId,
      name: trimmed,
      upiId: upiId?.trim() || 'exampleupi@hdjcbank',
      createdAt: new Date().toISOString(),
    };

    setSettings((prev) => ({
      ...prev,
      activeShopId: newId,
      shops: [...prev.shops, newProfile],
    }));

    // Initialize clean state for new shop
    setCustomers([]);
    setTransactions([]);
    currentShopIdRef.current = newId;

    return newId;
  }, []);

  // Quick load sample dataset
  const loadSampleDataset = useCallback(async () => {
    try {
      const response = await fetch('/sample-data.json');
      if (response.ok) {
        const text = await response.text();
        importJsonData(text);
      }
    } catch {
      // safe fallback
    }
  }, [importJsonData]);

  /**
   * Stage 2: Encrypted Backup & Restore Vault
   */
  const exportEncryptedBackup = useCallback(async (password: string): Promise<string> => {
    const shotIds = Array.from(new Set(
      transactions
        .map(t => t.screenshotId)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    ));

    const screenshots = await getAllScreenshotsForShop(activeShopId, shotIds);

    const payload: VaultPayloadData = {
      shop: {
        id: activeShop.id,
        name: activeShop.name,
        upiId: activeShop.upiId,
        createdAt: activeShop.createdAt,
      },
      customers,
      transactions,
      screenshots,
      exportedAt: new Date().toISOString(),
    };

    const envelope = await encryptVaultData(payload, password);
    return JSON.stringify(envelope, null, 2);
  }, [activeShop, activeShopId, customers, transactions]);

  const previewEncryptedBackup = useCallback(async (
    fileContent: string,
    password: string
  ): Promise<VaultPayloadData & { totalOutstanding: number }> => {
    let envelope: EncryptedVaultEnvelope;
    try {
      envelope = JSON.parse(fileContent);
    } catch {
      throw new Error('Selected file is not valid JSON. Please provide a valid .hisaab file.');
    }

    const decrypted = await decryptVaultData(envelope, password);

    // Calculate preview balance accurately
    let totalOut = 0;
    const custCredits = new Map<string, number>();
    const custPayments = new Map<string, number>();

    for (let i = 0; i < decrypted.transactions.length; i++) {
      const t = decrypted.transactions[i];
      if (t.type === 'credit') {
        custCredits.set(t.phone, (custCredits.get(t.phone) || 0) + Number(t.amount));
      } else if (t.type === 'payment') {
        custPayments.set(t.phone, (custPayments.get(t.phone) || 0) + Number(t.amount));
      }
    }

    for (let j = 0; j < decrypted.customers.length; j++) {
      const c = decrypted.customers[j];
      const bal = (custCredits.get(c.phone) || 0) - (custPayments.get(c.phone) || 0);
      if (bal > 0) totalOut += bal;
    }

    return {
      ...decrypted,
      totalOutstanding: Math.round(totalOut),
    };
  }, []);

  const restoreEncryptedBackup = useCallback(async (
    decryptedData: VaultPayloadData
  ): Promise<void> => {
    const currentId = activeShopId;

    // 1. Update shop name & upiId
    setSettings((prev) => ({
      ...prev,
      shops: prev.shops.map((s) =>
        s.id === currentId
          ? {
              ...s,
              name: decryptedData.shop?.name || s.name,
              upiId: decryptedData.shop?.upiId !== undefined ? decryptedData.shop.upiId : s.upiId,
            }
          : s
      ),
    }));

    // 2. Map customers and transactions to current shopId
    const restoredCustomers: Customer[] = decryptedData.customers.map((c) => ({
      ...c,
      shopId: currentId,
    }));

    const restoredTransactions: Transaction[] = decryptedData.transactions.map((t) => ({
      ...t,
      shopId: currentId,
    }));

    // 3. Restore screenshots in IndexedDB
    if (decryptedData.screenshots && Object.keys(decryptedData.screenshots).length > 0) {
      await restoreScreenshotsToDB(currentId, decryptedData.screenshots);
    }

    // 4. Update memory state
    setCustomers(restoredCustomers);
    setTransactions(restoredTransactions);

    // 5. Synchronously save to LocalStorage
    try {
      localStorage.setItem(
        getShopStorageKey(currentId),
        JSON.stringify({
          version: 1,
          shopId: currentId,
          savedAt: new Date().toISOString(),
          customers: restoredCustomers,
          transactions: restoredTransactions,
        })
      );
    } catch {
      // ignore
    }

    // 6. Save to IndexedDB
    await saveLedgerToDB(currentId, restoredCustomers, restoredTransactions);
  }, [activeShopId]);

  return (
    <LedgerContext.Provider
      value={{
        activeShopId,
        shops,
        shopName: activeShop.name,
        upiId: activeShop.upiId || '',
        language: settings.language,
        effectiveToday,
        customers,
        transactions,
        customerSummaries,
        overallSummary,
        getCustomerByPhone,
        addCustomer,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importJsonData,
        setShopName,
        setUpiId,
        setLanguage,
        loadSampleDataset,
        clearAllData,
        switchShop,
        createShop,
        exportEncryptedBackup,
        previewEncryptedBackup,
        restoreEncryptedBackup,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
};
