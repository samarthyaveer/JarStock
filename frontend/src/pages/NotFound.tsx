import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="rounded-panel border border-border bg-bg-card p-4">
    <div className="text-heading">Page not found</div>
    <div className="mt-2 text-body text-text-muted">
      The route does not exist.
    </div>
    <Link
      to="/dashboard"
      aria-label="Go to dashboard"
      className="mt-4 inline-flex rounded-card border border-border px-3 py-2 text-body"
    >
      Back to dashboard
    </Link>
  </div>
);

export default NotFound;
