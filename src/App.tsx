import { ErrorBoundary } from 'react-error-boundary';
import Layout from '@/components/Layout';
import { Home } from '@/pages';

/**
 * Error fallback component for the error boundary
 */
function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          An unexpected error occurred while loading the application.
        </p>
        <details className="text-left mb-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="btn-primary w-full"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Main application component
 */
export default function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to console in development
        console.error('Application error:', error, errorInfo);

        // In production, you might want to send this to an error reporting service
        // Example: sendErrorToService(error, errorInfo);
      }}
      onReset={() => {
        // Optionally clear any state or reload the page
        window.location.reload();
      }}
    >
      <Layout>
        <Home />
      </Layout>
    </ErrorBoundary>
  );
}