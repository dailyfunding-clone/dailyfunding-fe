let pendingPath: string | null = null;

export const stashPendingPath = (path: string) => {
  pendingPath = path;
};

export const takePendingPath = () => {
  const path = pendingPath;
  pendingPath = null;
  return path;
};
