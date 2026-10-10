export type OrderAttemptInput = {
  product_id: number;
  amount: number;
  use_points: number;
  confirm: string;
};

export type OrderAttempt = {
  key: string;
  tabId: string;
  idempotencyKey: string;
  input: OrderAttemptInput;
  investmentId?: number;
  phase: "open" | "confirming" | "ambiguous" | "done" | "failed";
  updatedAt: number;
};

export type ClaimResult =
  { role: "owner"; attempt: OrderAttempt } | { role: "follower"; attempt: OrderAttempt };

const DB_NAME = "df-invest-orders";
const STORE = "attempts";

const mem = new Map<string, OrderAttempt>();

const isActive = (a: OrderAttempt) => a.phase === "open" || a.phase === "confirming";

const merge = (existing: OrderAttempt | undefined, claim: OrderAttempt): OrderAttempt =>
  existing?.phase === "ambiguous"
    ? {
        ...claim,
        idempotencyKey: existing.idempotencyKey,
        input: existing.input,
        investmentId: existing.investmentId,
      }
    : claim;

const openDb = (factory: IDBFactory): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = factory.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

let dbCache: { factory: IDBFactory; db: Promise<IDBDatabase> } | null = null;

const db = () => {
  if (typeof indexedDB === "undefined") return null;
  if (!dbCache || dbCache.factory !== indexedDB) {
    dbCache = { factory: indexedDB, db: openDb(indexedDB) };
  }
  return dbCache.db;
};

const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const txDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

export const claimAttempt = async (
  key: string,
  claim: Omit<OrderAttempt, "key" | "updatedAt">,
): Promise<ClaimResult> => {
  const base: OrderAttempt = { ...claim, key, updatedAt: Date.now() };
  const d = await db();
  if (!d) {
    const existing = mem.get(key);
    if (existing && isActive(existing) && existing.tabId !== claim.tabId) {
      return { role: "follower", attempt: existing };
    }
    const attempt = merge(existing, base);
    mem.set(key, attempt);
    return { role: "owner", attempt };
  }
  const tx = d.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const existing = (await request(store.get(key))) as OrderAttempt | undefined;
  if (existing && isActive(existing) && existing.tabId !== claim.tabId) {
    await txDone(tx);
    return { role: "follower", attempt: existing };
  }
  const attempt = merge(existing, base);
  store.put(attempt);
  await txDone(tx);
  return { role: "owner", attempt };
};

export const getAttempt = async (key: string): Promise<OrderAttempt | undefined> => {
  const d = await db();
  if (!d) return mem.get(key);
  const tx = d.transaction(STORE, "readonly");
  const out = (await request(tx.objectStore(STORE).get(key))) as OrderAttempt | undefined;
  await txDone(tx);
  return out;
};

export const putAttempt = async (attempt: OrderAttempt) => {
  const next = { ...attempt, updatedAt: Date.now() };
  const d = await db();
  if (!d) {
    mem.set(next.key, next);
    return;
  }
  const tx = d.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(next);
  await txDone(tx);
};

export const clearAttempt = async (key: string) => {
  const d = await db();
  if (!d) {
    mem.delete(key);
    return;
  }
  const tx = d.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(key);
  await txDone(tx);
};
