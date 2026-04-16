import React from "react";

import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell = ({ children }: AppShellProps) => (
  <div className="app-shell bg-bg-primary text-text-primary">
    <div className="app-shell-bg" aria-hidden="true" />
    <div className="app-shell-content">
      <Sidebar />
      <Topbar />
      <main className="pt-[64px] md:pl-[72px] lg:pl-[260px] pb-[80px] md:pb-8">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  </div>
);

export default AppShell;
