"use client";

import Dropdown from "./Dropdown";

export type MenuAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
};

export default function MenuBarItem({
  label,
  items,
  open,
  hoverActivate,
  onOpen,
  onClose,
}: {
  label: string;
  items: MenuAction[];
  open: boolean;
  hoverActivate: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <Dropdown
      trigger={() => <span className="uppercase">{label}</span>}
      open={open}
      hoverActivate={hoverActivate}
      onOpen={onOpen}
      onClose={onClose}
    >
      {(close) => (
        <>
          {items.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={close}
                className="block px-3 py-1 text-xs font-medium uppercase text-neutral-900 hover:bg-[rgb(0,4,255)] hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close();
                  item.onClick?.();
                }}
                className="block w-full text-left px-3 py-1.5 text-xs font-medium uppercase text-neutral-900 hover:bg-[rgb(0,4,255)] hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-900"
              >
                {item.label}
              </button>
            )
          )}
        </>
      )}
    </Dropdown>
  );
}
