const POOL_LIMIT = 3;

const entries = new Map<string, number>();
const scrollSnapshots = new Map<string, number>();
const listeners = new Set<() => void>();
let version = 0;

const notify = () => {
  version += 1;
  for (const listener of listeners) listener();
};

export const webViewPool = {
  limit: POOL_LIMIT,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  version: () => version,
  touch: (key: string) => {
    entries.delete(key);
    entries.set(key, Date.now());
    notify();
  },
  release: (key: string) => {
    if (entries.delete(key)) notify();
  },
  mounted: (key: string) => {
    const keys = [...entries.keys()];
    const index = keys.indexOf(key);
    return index >= 0 && index >= keys.length - POOL_LIMIT;
  },
  saveScroll: (key: string, y: number) => {
    scrollSnapshots.set(key, y);
  },
  snapshot: (key: string) => scrollSnapshots.get(key) ?? 0,
};
