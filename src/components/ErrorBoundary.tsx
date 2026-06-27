import { Component } from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#232B2B' }}>
          <h1 style={{ color: '#217A8D' }}>Syrian Energy Project Tracker</h1>
          <p>The app could not load. Please refresh the page.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 16, borderRadius: 8 }}>{this.state.message}</pre>
        </main>
      );
    }

    return this.props.children;
  }
}
