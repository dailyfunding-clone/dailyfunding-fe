"use client";

import { bridge, isInWebView } from "@dailyfunding/bridge";
import Link, { type LinkProps } from "next/link";

import type { AnchorHTMLAttributes } from "react";

type AppLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    linkTitle?: string;
  };

const AppLink = ({ href, linkTitle, onClick, ...rest }: AppLinkProps) => (
  <Link
    {...rest}
    href={href}
    onClick={(e) => {
      onClick?.(e);
      if (
        !e.defaultPrevented &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey &&
        isInWebView() &&
        typeof href === "string" &&
        href.startsWith("/")
      ) {
        e.preventDefault();
        bridge.push(href, linkTitle);
      }
    }}
  />
);

export default AppLink;
