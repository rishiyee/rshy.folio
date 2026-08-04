"use client";

import Dropdown from "./Dropdown";
import { SOCIAL_LINKS } from "@/lib/config";

function LogoMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/vonnue-logo.svg" alt="" className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
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
  const links: { label: string; href?: string; onClick?: () => void }[] = [
    { label: "Behance", href: SOCIAL_LINKS.behance || "#" },
    { label: "Dribbble", href: SOCIAL_LINKS.dribbble || "#" },
    { label: "LinkedIn", href: SOCIAL_LINKS.linkedin || "#" },
    { label: "Instagram", href: SOCIAL_LINKS.instagram || "#" },
    { label: "Email", href: SOCIAL_LINKS.email || "#" },
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
