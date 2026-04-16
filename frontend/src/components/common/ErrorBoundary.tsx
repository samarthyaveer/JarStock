import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
  stack?: string;
};

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error): void {
    console.error("UI error", error);
    this.setState({ message: error.message, stack: error.stack });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 text-body text-text-muted">
            <div>Something went wrong.</div>
            {this.state.message ? (
              <div className="mt-2 text-label">{this.state.message}</div>
            ) : null}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
