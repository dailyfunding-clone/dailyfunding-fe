const waiters: (() => void)[] = [];

export const pinGate = {
  open: false,
  setOpen(next: boolean) {
    this.open = next;
    if (!next) {
      waiters.splice(0).forEach((resolve) => resolve());
    }
  },
  wait: () =>
    new Promise<void>((resolve) => {
      if (!pinGate.open) {
        resolve();
        return;
      }
      waiters.push(resolve);
    }),
};
