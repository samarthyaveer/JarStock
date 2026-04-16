import React, { Suspense } from "react";
import {
  Navigate,
  Outlet,
  createBrowserRouter,
} from "react-router-dom";

import AppShell from "./components/layout/AppShell";
import ErrorBoundary from "./components/common/ErrorBoundary";

const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const StockDetail = React.lazy(() => import("./pages/StockDetail"));
const Market = React.lazy(() => import("./pages/Market"));
const Search = React.lazy(() => import("./pages/Search"));
const Watchlist = React.lazy(() => import("./pages/Watchlist"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const PageFallback = () => (
  <div className="p-6 text-body text-text-muted">Loading page</div>
);

const RootLayout = () => (
  <AppShell>
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  </AppShell>
);

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        {
          path: "dashboard",
          element: (
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          ),
        },
        {
          path: "stocks/:symbol",
          element: (
            <ErrorBoundary>
              <StockDetail />
            </ErrorBoundary>
          ),
        },
        {
          path: "market",
          element: (
            <ErrorBoundary>
              <Market />
            </ErrorBoundary>
          ),
        },
        {
          path: "search",
          element: (
            <ErrorBoundary>
              <Search />
            </ErrorBoundary>
          ),
        },
        {
          path: "watchlist",
          element: (
            <ErrorBoundary>
              <Watchlist />
            </ErrorBoundary>
          ),
        },
        {
          path: "*",
          element: (
            <ErrorBoundary>
              <NotFound />
            </ErrorBoundary>
          ),
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);
