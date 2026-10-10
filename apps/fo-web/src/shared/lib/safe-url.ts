export const safeHttpUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? url : null;
