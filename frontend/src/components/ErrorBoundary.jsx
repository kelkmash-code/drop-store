import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 border border-red-500 bg-red-50 text-red-900 rounded-lg m-4">
                    <h2 className="font-bold mb-2">Something went wrong.</h2>
                    <p className="mb-2">The application encountered an error while rendering this component.</p>
                    <details className="text-sm bg-white p-2 rounded border border-red-200">
                        <summary className="cursor-pointer font-semibold">Error Details (Click to show)</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </details>
                    <button
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
