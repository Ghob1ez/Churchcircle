import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
          <div className="mb-6 rounded-full bg-red-100 p-4 text-red-600">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">Something went wrong</h1>
          <p className="mb-8 max-w-md text-neutral-600">
            The application encountered an unexpected error. This is often caused by 
            <strong> ad-blockers</strong> or <strong>privacy extensions</strong> interfering with 
            authentication services.
          </p>
          
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-neutral-200 text-left max-w-lg">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2">Error Details</h2>
            <code className="text-xs text-red-600 block bg-red-50 p-3 rounded-lg overflow-auto max-h-32">
              {this.state.error?.message || "Unknown error"}
            </code>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50"
            >
              Try Again
            </button>
          </div>
          
          <p className="mt-8 text-xs text-neutral-400">
            If the issue persists, please try disabling your ad-blocker or opening the app in an Incognito window.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
