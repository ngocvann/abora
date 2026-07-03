import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './routes/AppRouter';
import { FacebookChatWidget } from './components/chat/FacebookChatWidget';

class WidgetErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Widget Error Boundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
        <WidgetErrorBoundary>
          <FacebookChatWidget />
        </WidgetErrorBoundary>
        <Toaster 
          position="top-center" 
          containerStyle={{
            top: 75,
          }}
          toastOptions={{
            style: {
              background: 'rgba(24, 24, 27, 0.85)',
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '13px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '99px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)',
            },
            success: {
              icon: null,
            },
            error: {
              icon: null,
            }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
