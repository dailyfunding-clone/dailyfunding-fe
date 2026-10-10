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

export const ATTEMPT_STALE_MS = 120_000;

const mem = new Map<string, OrderAttempt>();
const LS_PREFIX = "df-invest-order:";

const readFallback = (key: string): OrderAttempt | undefined => {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as OrderAttempt;
      mem.set(key, parsed);
      return parsed;
    }
  } catch {
    /* storage unavailable */
  }
  return mem.get(key);
};

const writeFallback = (attempt: OrderAttempt) => {
  mem.set(attempt.key, attempt);
  try {
    localStorage.setItem(LS_PREFIX + attempt.key, JSON.stringify(attempt));
  } catch {
    /* storage unavailable */
  }
};

const deleteFallback = (key: string) => {
  mem.delete(key);
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    /* storage unavailable */
  }
};

type LockLike = {
  request: (name: string, fn: () => unknown) => Promise<unknown>;
};

const withLock = <T>(name: string, fn: () => T | Promise<T>): Promise<T> => {
  const locks =
    typeof navigator !== "undefined" ? (navigator as { locks?: LockLike }).locks : undefined;
  return locks ? (locks.request(`df-order-lock:${name}`, fn) as Promise<T>) : Promise.resolve(fn());
};

const isActive = (a: OrderAttempt) => a.phase === "open" || a.phase === "confirming";

const isStale = (a: OrderAttempt) => Date.now() - a.updatedAt > ATTEMPT_STALE_MS;

const prior = (a: OrderAttempt | undefined): OrderAttempt | undefined =>
  a && isActive(a) ? { ...a, phase: "ambiguous" } : a;

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
    const opened = openDb(indexedDB);
    dbCache = { factory: indexedDB, db: opened };
    opened.catch(() => {
      if (dbCache?.db === opened) dbCache = null;
    });
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
    return withLock(key, () => {
      const existing = readFallback(key);
      if (existing && isActive(existing) && !isStale(existing)) {
        return { role: "follower", attempt: existing } as ClaimResult;
      }
      const attempt = merge(prior(existing), base);
      writeFallback(attempt);
      return { role: "owner", attempt } as ClaimResult;
    });
  }
  const tx = d.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const existing = (await request(store.get(key))) as OrderAttempt | undefined;
  if (existing && isActive(existing) && !isStale(existing)) {
    await txDone(tx);
    return { role: "follower", attempt: existing };
  }
  const attempt = merge(prior(existing), base);
  store.put(attempt);
  await txDone(tx);
  return { role: "owner", attempt };
};

export const getAttempt = async (key: string): Promise<OrderAttempt | undefined> => {
  const d = await db();
  if (!d) return readFallback(key);
  const tx = d.transaction(STORE, "readonly");
  const out = (await request(tx.objectStore(STORE).get(key))) as OrderAttempt | undefined;
  await txDone(tx);
  return out;
};

export const putAttempt = async (attempt: OrderAttempt) => {
  const next = { ...attempt, updatedAt: Date.now() };
  const d = await db();
  if (!d) {
    await withLock(attempt.key, async () => {
      writeFallback(next);
    });
    return;
  }
  const tx = d.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(next);
  await txDone(tx);
};

export const clearAttempt = async (key: string) => {
  const d = await db();
  if (!d) {
    await withLock(key, async () => {
      deleteFallback(key);
    });
    return;
  }
  const tx = d.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(key);
  await txDone(tx);
};
