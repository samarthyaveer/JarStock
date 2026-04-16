import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Market", to: "/market" },
  { label: "Search", to: "/search" },
  { label: "Watchlist", to: "/watchlist" },
];

const Sidebar = () => (
  <aside className="fixed left-0 top-0 hidden h-full border-r border-border bg-bg-surface backdrop-blur md:flex md:w-[72px] md:flex-col md:items-center md:gap-4 md:py-6 lg:w-[260px] lg:items-start lg:px-6">
    <div className="hidden font-display text-heading lg:block">JarStock</div>
    <nav className="flex w-full flex-col gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={item.label}
          className={({ isActive }) =>
            [
              "list-item flex items-center rounded-card px-3 py-3 text-body",
              isActive
                ? "list-item-active"
                : "text-text-muted hover:text-text-primary",
            ].join(" ")
          }
        >
          <span className="hidden lg:block font-display text-sub">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
