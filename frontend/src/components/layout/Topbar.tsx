import React from "react";
import { useLocation } from "react-router-dom";

import { useUiStore } from "../../store/uiStore";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/market": "Market",
  "/search": "Search",
  "/watchlist": "Watchlist",
};

const Topbar = () => {
  const location = useLocation();
  const selectedSymbol = useUiStore((state) => state.selectedSymbol);
  const title = titleMap[location.pathname] || "JarStock";

  return (
    <header className="fixed left-0 right-0 top-0 z-10 h-[52px] border-b border-border bg-bg-surface md:pl-[60px] lg:pl-[240px]">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="text-sub">{title}</div>
        <div className="flex items-center gap-3 text-label text-text-muted">
          <span>Selected</span>
          <span className="rounded-chip border border-border px-2 py-1 text-text-primary">
            {selectedSymbol || "None"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
