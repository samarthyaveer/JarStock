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
    <header className="fixed left-0 right-0 top-0 z-10 h-[64px] border-b border-border bg-bg-surface backdrop-blur md:pl-[72px] lg:pl-[260px]">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="text-label text-text-muted">Now viewing</div>
          <div className="font-display text-sub md:text-heading truncate">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2 text-label">
          <span className="hidden sm:inline text-text-muted">Selected</span>
          <span className="chip rounded-chip px-2 py-1 text-text-primary font-mono">
            {selectedSymbol || "None"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
