"use client";

import { Component, type ReactNode } from "react";

/**
 * MEDIUM 3 from AUDIT.md: Error boundary for client components.
 * Prevents Mapbox/QR/postcard crashes from taking down the entire page.
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log to monitoring (Sentry in phase 2)
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 text-center">
            <p className="text-navy font-medium">
              Something didn&apos;t load correctly.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-sm underline text-grey-text"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
