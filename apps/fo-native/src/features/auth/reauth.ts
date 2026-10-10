const REAUTH_TIMEOUT_MS = 60_000;

let pending: ((token: string | null) => void) | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let cached: { token: string; expiresAt: number; generation: number } | null = null;

export const resolveReauth = (token: string | null) => {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  pending?.(token);
  pending = null;
};

export const beginReauth = () =>
  new Promise<string | null>((resolve) => {
    resolveReauth(null);
    pending = resolve;
    pendingTimeout = setTimeout(() => resolveReauth(null), REAUTH_TIMEOUT_MS);
  });

export const clearReauth = () => {
  cached = null;
  resolveReauth(null);
};

export const cacheReauth = (token: string, expiresInSec: number, at: number) => {
  cached = { token, expiresAt: Date.now() + expiresInSec * 1000 - 10_000, generation: at };
};

export const takeFreshReauth = (at: number) => {
  if (!cached || cached.expiresAt <= Date.now() || cached.generation !== at) return null;
  const { token } = cached;
  cached = null;
  return token;
};
