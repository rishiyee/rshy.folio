"use client";

import { useEffect, useState } from "react";
import Dropdown from "./Dropdown";
import { SOCIAL_LINKS } from "@/lib/config";

type SocialKey = "behance" | "dribbble" | "linkedin" | "instagram" | "email";

function safeSocialUrl(value: string) {
  if (!value) return "#";
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  return "#";
}

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="flex h-4 w-4 shrink-0 items-center justify-center border border-current text-[9px] font-semibold leading-none sm:h-[18px] sm:w-[18px]"
    >
      P
    </span>
  );
}

export default function LogoMenu({
  onShutdown,
  onOpenAbout,
  open,
  hoverActivate,
  onOpen,
  onClose,
}: {
  onShutdown: () => void;
  onOpenAbout: () => void;
  open: boolean;
  hoverActivate: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>({
    behance: SOCIAL_LINKS.behance,
    dribbble: SOCIAL_LINKS.dribbble,
    linkedin: SOCIAL_LINKS.linkedin,
    instagram: SOCIAL_LINKS.instagram,
    email: SOCIAL_LINKS.email,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/about.md", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load about.md");
        return response.text();
      })
      .then((markdown) => {
        setSocialLinks((current) => {
          const next = { ...current };
          for (const line of markdown.split(/\r?\n/)) {
            const match = line.match(/^-\s+([^:]+):\s*(.*)$/);
            const key = match?.[1].trim().toLowerCase() as SocialKey | undefined;
            if (key && key in next) next[key] = match?.[2].trim() ?? "";
          }
          return next;
        });
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
        }
      });
    return () => controller.abort();
  }, []);

  const links: { label: string; href?: string; onClick?: () => void }[] = [
    { label: "Behance", href: safeSocialUrl(socialLinks.behance) },
    { label: "Dribbble", href: safeSocialUrl(socialLinks.dribbble) },
    { label: "LinkedIn", href: safeSocialUrl(socialLinks.linkedin) },
    { label: "Instagram", href: safeSocialUrl(socialLinks.instagram) },
    { label: "Email", href: safeSocialUrl(socialLinks.email) },
  ];

  return (
    <Dropdown
      trigger={() => <LogoMark />}
      open={open}
      hoverActivate={hoverActivate}
      onOpen={onOpen}
      onClose={onClose}
      triggerClassName={open ? "" : "bg-gradient-to-r from-sky-400 to-blue-700"}
    >
      {(close) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onOpenAbout();
            }}
            className="block w-full text-left px-3 py-1 text-xs font-medium uppercase text-neutral-900 hover:bg-[rgb(0,4,255)] hover:text-white transition-colors"
          >
            About
          </button>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={close}
              className="block px-3 py-1 text-xs font-medium uppercase text-neutral-900 hover:bg-[rgb(0,4,255)] hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onShutdown();
            }}
            className="block w-full text-left px-3 py-1 text-xs font-medium uppercase text-neutral-900 hover:bg-[rgb(0,4,255)] hover:text-white transition-colors"
          >
            Shutdown
          </button>
        </>
      )}
    </Dropdown>
  );
}
