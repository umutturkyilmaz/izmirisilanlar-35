import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background-50">
          <div className="max-w-md text-center">
            <i className="ri-error-warning-line text-4xl text-red-500 mb-3 block" />
            <h1 className="font-heading text-xl font-bold text-foreground-950 mb-2">Bir şeyler ters gitti</h1>
            <p className="text-sm text-foreground-600 mb-4">
              Sayfa yüklenirken hata oluştu. Yenilemeyi deneyin.
            </p>
            {this.state.message && (
              <p className="text-xs text-foreground-400 mb-4 break-all">{this.state.message}</p>
            )}
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold"
            >
              Ana sayfaya dön
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
