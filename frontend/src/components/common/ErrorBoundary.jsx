import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { BRAND, BRAND_DARK, FONT_DISPLAY, FONT_BODY } from "../../constants/theme";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unexpected error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 text-slate-800"
          style={{ fontFamily: FONT_BODY }}
        >
          <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <AlertTriangle size={32} strokeWidth={2.2} />
            </div>

            <h1
              className="text-2xl font-bold text-slate-900 mb-2"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Something went wrong
            </h1>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              An unexpected application error occurred while rendering this view. You can try refreshing the page or returning to the dashboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all shadow-sm hover:shadow cursor-pointer"
                style={{ background: BRAND }}
                onMouseEnter={(e) => (e.currentTarget.style.background = BRAND_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BRAND)}
              >
                <RotateCcw size={16} />
                Refresh Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                <Home size={16} />
                Go to Dashboard
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs font-mono text-red-600 overflow-x-auto">
                <summary className="cursor-pointer font-bold text-slate-700 mb-1">
                  Error Details (Developer Mode)
                </summary>
                <div className="whitespace-pre-wrap">{this.state.error.toString()}</div>
                {this.state.errorInfo && (
                  <div className="mt-2 text-slate-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
