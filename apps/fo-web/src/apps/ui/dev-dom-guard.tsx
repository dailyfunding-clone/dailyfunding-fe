"use client";

import { useEffect } from "react";

const BAD_ATTRS = "[bis_skin_checked],[href^='chrome://'],[src^='chrome://']";

const isBad = (name: string, value: unknown) =>
  name === "bis_skin_checked" ||
  (typeof value === "string" && value.startsWith("chrome://"));

const sweep = () => {
  document.querySelectorAll(BAD_ATTRS).forEach((el) => {
    el.removeAttribute("bis_skin_checked");
    el.removeAttribute("href");
    el.removeAttribute("src");
  });
};

const DevDomGuard = () => {
  useEffect(() => {
    const original = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (isBad(name, value)) return;
      return original.call(this, name, value);
    };
    sweep();
    const observer = new MutationObserver(sweep);
    observer.observe(document.documentElement, { subtree: true, attributes: true });
    return () => {
      observer.disconnect();
      Element.prototype.setAttribute = original;
    };
  }, []);

  return null;
};

export default DevDomGuard;
