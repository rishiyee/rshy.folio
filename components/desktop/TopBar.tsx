"use client";

import { useEffect, useState } from "react";
import LogoMenu from "./LogoMenu";
import MenuBarItem from "./MenuBarItem";
import Clock from "./Clock";

export default function TopBar({
  onOpenWindow,
  onOpenAbout,
  onReportBug,
  onShutdown,
  onChangeBackground,
  theme,
  onToggleTheme,
}: {
  onOpenWindow: (id: "works" | "terminal") => void;
  onOpenAbout: () => void;
  onReportBug: () => void;
  onShutdown: () => void;
  onChangeBackground: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  function openMenu(id: string) {
    setActiveMenu(id);
  }
  function closeMenu(id: string) {
    setActiveMenu((cur) => (cur === id ? null : cur));
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "f" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      toggleFullscreen();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function shareTo(network: "facebook" | "twitter") {
    if (typeof window === "undefined") return;
    const url = encodeURIComponent(window.location.href);
    const shareUrl =
      network === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
        : `https://twitter.com/intent/tweet?url=${url}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed top-0 inset-x-0 h-9 z-[10000] flex items-stretch justify-between bg-background border-b border-line text-foreground">
      <div className="flex min-w-0 flex-1 items-stretch">
        <LogoMenu
          onShutdown={onShutdown}
          onOpenAbout={onOpenAbout}
          open={activeMenu === "logo"}
          hoverActivate={activeMenu !== null}
          onOpen={() => openMenu("logo")}
          onClose={() => closeMenu("logo")}
        />
        <div className="w-px bg-line my-1.5" />
        <MenuBarItem
          label="File"
          items={[
            { label: "Share on FB", onClick: () => shareTo("facebook") },
            { label: "Share on Twitter", onClick: () => shareTo("twitter") },
            { label: "Close Window", onClick: () => window.close() },
          ]}
          open={activeMenu === "file"}
          hoverActivate={activeMenu !== null}
          onOpen={() => openMenu("file")}
          onClose={() => closeMenu("file")}
        />
        <MenuBarItem
          label="Go"
          items={[
            { label: "Works", onClick: () => onOpenWindow("works") },
            { label: "Terminal", onClick: () => onOpenWindow("terminal") },
          ]}
          open={activeMenu === "go"}
          hoverActivate={activeMenu !== null}
          onOpen={() => openMenu("go")}
          onClose={() => closeMenu("go")}
        />
        <MenuBarItem
          label="View"
          items={[
            {
              label: isFullscreen ? "Exit Full Screen" : "Enter Full Screen",
              onClick: toggleFullscreen,
            },
            { label: "Change Background", onClick: onChangeBackground },
            {
              label: theme === "dark" ? "Use Light Mode" : "Use Dark Mode",
              onClick: onToggleTheme,
            },
          ]}
          open={activeMenu === "view"}
          hoverActivate={activeMenu !== null}
          onOpen={() => openMenu("view")}
          onClose={() => closeMenu("view")}
        />
        <MenuBarItem
          label="Help"
          items={[{ label: "Report a Bug", onClick: onReportBug }]}
          open={activeMenu === "help"}
          hoverActivate={activeMenu !== null}
          onOpen={() => openMenu("help")}
          onClose={() => closeMenu("help")}
        />
      </div>

      <div className="flex shrink-0 items-center px-2 sm:px-4 h-full">
        <Clock />
      </div>
    </div>
  );
}
