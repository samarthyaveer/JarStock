import React from "react";
import { NavLink } from "react-router-dom";

import { useUiStore } from "../../store/uiStore";

const MobileNav = () => {
  const selectedSymbol = useUiStore((state) => state.selectedSymbol);
  const stockLink = selectedSymbol ? `/stocks/${selectedSymbol}` : "/dashboard";

  const items = [
    { label: "Dash", to: "/dashboard" },
    { label: "Market", to: "/market" },
    { label: "Search", to: "/search" },
    { label: "Watch", to: "/watchlist" },
    { label: "Stock", to: stockLink },
  ];

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-10 flex justify-center md:hidden">
      <div className="panel-card flex items-center gap-1 rounded-panel px-2 py-2 shadow-lg">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            aria-label={item.label}
            className={({ isActive }) =>
              [
                "pill rounded-chip px-3 py-2 text-label transition",
                isActive ? "pill-active" : "text-text-muted",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
