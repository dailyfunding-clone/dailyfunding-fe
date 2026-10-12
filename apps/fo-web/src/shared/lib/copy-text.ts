export const copyText = async (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  try {
    const ok = document.execCommand("copy");
    if (!ok) throw new Error("copy failed");
  } finally {
    el.remove();
  }
};
