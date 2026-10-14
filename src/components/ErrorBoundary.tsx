import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  hasError: boolean;
}

/** Last-resort fallback so an unexpected render error never leaves a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="container main">
        <section className="status-view status-view--error" role="alert" data-testid="app-error">
          <span className="status-view__icon" aria-hidden="true">
            !
          </span>
          <h1 className="status-view__title">Something went wrong</h1>
          <p className="status-view__message">An unexpected error occurred. Please reload the page.</p>
          <div className="status-view__actions">
            <button type="button" className="button button--primary" onClick={() => window.location.assign('/')}>
              Reload ShopNest
            </button>
          </div>
        </section>
      </main>
    );
  }
}
