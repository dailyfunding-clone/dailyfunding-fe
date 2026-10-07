let pending: ((token: string | null) => void) | null = null;
let cached: { token: string; expiresAt: number } | null = null;

export const beginReauth = () =>
  new Promise<string | null>((resolve) => {
    pending?.(null);
    pending = resolve;
  });

export const resolveReauth = (token: string | null) => {
  pending?.(token);
  pending = null;
};

export const cacheReauth = (token: string, expiresInSec: number) => {
  cached = { token, expiresAt: Date.now() + expiresInSec * 1000 - 10_000 };
};

export const takeFreshReauth = () => {
  if (!cached || cached.expiresAt <= Date.now()) return null;
  const { token } = cached;
  cached = null;
  return token;
};
