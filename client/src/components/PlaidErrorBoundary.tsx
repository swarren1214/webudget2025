import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { errorLog } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically designed for Plaid Link integration
 * Catches errors in Plaid Link components and provides user-friendly fallback UI
 */
export class PlaidErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    errorLog('PlaidErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI for Plaid Link errors
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Bank Connection Error
          </h3>
          <p className="text-red-600 text-center mb-4 max-w-md">
            We're having trouble connecting to your bank. This could be due to a temporary 
            network issue or a problem with the banking service.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
            >
              Refresh Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="text-sm text-red-600 cursor-pointer">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 p-3 bg-red-100 border border-red-300 rounded text-xs text-red-800 overflow-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 * Use this when you need error boundary functionality in hooks
 */
export const usePlaidErrorHandler = () => {
  const handlePlaidError = React.useCallback((error: any) => {
    errorLog('Plaid operation failed:', error);
    
    // You could also show a toast notification here
    // toast.error('Bank connection failed. Please try again.');
  }, []);

  return { handlePlaidError };
}; 