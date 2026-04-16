import React from "react";

import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell = ({ children }: AppShellProps) => (
  <div className="min-h-screen bg-bg-primary text-text-primary">
    <Sidebar />
    <Topbar />
    <main className="pt-[52px] md:pl-[60px] lg:pl-[240px] pb-[64px] md:pb-6">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {children}
      </div>
    </main>
    <MobileNav />
  </div>
);

export default AppShell;
