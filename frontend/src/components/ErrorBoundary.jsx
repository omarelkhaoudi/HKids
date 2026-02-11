import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, RefreshIcon, AlertIcon } from './Icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg border border-neutral-200 shadow-sm p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertIcon className="w-12 h-12 text-red-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
              Une erreur s'est produite
            </h1>
            
            <p className="text-neutral-600 mb-6 text-sm">
              Désolé, quelque chose d'inattendu s'est produit. Vos données sont en sécurité.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold text-red-600 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary flex items-center gap-2"
              >
                <HomeIcon className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                <span>Recharger</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

