import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard", short: "D" },
  { label: "Market", to: "/market", short: "M" },
  { label: "Search", to: "/search", short: "S" },
  { label: "Watchlist", to: "/watchlist", short: "W" },
];

const Sidebar = () => (
  <aside className="fixed left-0 top-0 hidden h-full border-r border-border bg-bg-surface md:flex md:w-[60px] md:flex-col md:items-center md:gap-4 md:py-6 lg:w-[240px] lg:items-start lg:px-6">
    <div className="hidden text-heading lg:block">JarStock</div>
    <nav className="flex w-full flex-col gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={item.label}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-card px-3 py-2 text-body",
              isActive
                ? "bg-bg-card text-text-primary"
                : "text-text-muted hover:text-text-primary",
            ].join(" ")
          }
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-chip border border-border text-label">
            {item.short}
          </span>
          <span className="hidden lg:block">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
