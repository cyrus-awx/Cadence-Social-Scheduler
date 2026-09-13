import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { CadenceShell } from '@/components/cadence-shell';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Billing from '@/pages/billing';
import Calendar from '@/pages/calendar';
import Dashboard from '@/pages/dashboard';
import NotFound from '@/pages/not-found';
import Pricing from '@/pages/pricing';
import {
  Redirect,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <CadenceShell>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/billing" component={Billing} />
          <Route component={NotFound} />
        </Switch>
      </CadenceShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
