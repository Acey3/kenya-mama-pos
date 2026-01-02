import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'mama-duka-offline';
const DB_VERSION = 1;

interface PendingSync {
  id: string;
  type: 'sale' | 'stock' | 'customer';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
}

interface OfflineDB {
  pendingSync: {
    key: string;
    value: PendingSync;
    indexes: { 'by-type': string; 'by-timestamp': number };
  };
  cachedProducts: {
    key: string;
    value: {
      id: string;
      name: string;
      price: number;
      stock: number;
      category: string;
      lastUpdated: number;
    };
  };
  cachedSales: {
    key: string;
    value: {
      id: string;
      amount: number;
      items: unknown[];
      paymentMethod: string;
      createdAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function getOfflineDb(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Pending sync store for offline actions
      if (!db.objectStoreNames.contains('pendingSync')) {
        const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
        syncStore.createIndex('by-type', 'type');
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Cached products for offline access
      if (!db.objectStoreNames.contains('cachedProducts')) {
        db.createObjectStore('cachedProducts', { keyPath: 'id' });
      }

      // Cached sales for offline access
      if (!db.objectStoreNames.contains('cachedSales')) {
        db.createObjectStore('cachedSales', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// Add item to pending sync queue
export async function addPendingSync(item: Omit<PendingSync, 'id' | 'timestamp'>): Promise<void> {
  const db = await getOfflineDb();
  const pendingItem: PendingSync = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  await db.put('pendingSync', pendingItem);
}

// Get all pending sync items
export async function getPendingSync(): Promise<PendingSync[]> {
  const db = await getOfflineDb();
  return db.getAll('pendingSync');
}

// Remove synced item
export async function removePendingSync(id: string): Promise<void> {
  const db = await getOfflineDb();
  await db.delete('pendingSync', id);
}

// Cache products for offline access
export async function cacheProducts(products: OfflineDB['cachedProducts']['value'][]): Promise<void> {
  const db = await getOfflineDb();
  const tx = db.transaction('cachedProducts', 'readwrite');
  await Promise.all([
    ...products.map(product => tx.store.put(product)),
    tx.done,
  ]);
}

// Get cached products
export async function getCachedProducts(): Promise<OfflineDB['cachedProducts']['value'][]> {
  const db = await getOfflineDb();
  return db.getAll('cachedProducts');
}

// Cache sales
export async function cacheSales(sales: OfflineDB['cachedSales']['value'][]): Promise<void> {
  const db = await getOfflineDb();
  const tx = db.transaction('cachedSales', 'readwrite');
  await Promise.all([
    ...sales.map(sale => tx.store.put(sale)),
    tx.done,
  ]);
}

// Get cached sales
export async function getCachedSales(): Promise<OfflineDB['cachedSales']['value'][]> {
  const db = await getOfflineDb();
  return db.getAll('cachedSales');
}

// Get pending sync count
export async function getPendingSyncCount(): Promise<number> {
  const db = await getOfflineDb();
  return db.count('pendingSync');
}
