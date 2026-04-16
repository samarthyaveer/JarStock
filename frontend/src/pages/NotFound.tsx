import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="panel-card rounded-panel p-4">
    <div className="font-display text-heading">Page not found</div>
    <div className="mt-2 text-body text-text-muted">
      The route does not exist.
    </div>
    <Link
      to="/dashboard"
      aria-label="Go to dashboard"
      className="pill mt-4 inline-flex rounded-chip px-3 py-2 text-body"
    >
      Back to dashboard
    </Link>
  </div>
);

export default NotFound;
