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
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex h-[52px] items-center justify-around border-t border-border bg-bg-surface md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          aria-label={item.label}
          className={({ isActive }) =>
            [
              "text-label",
              isActive ? "text-text-primary" : "text-text-muted",
            ].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
