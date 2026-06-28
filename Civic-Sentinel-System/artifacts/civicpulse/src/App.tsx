// src/App.tsx — Updated with light theme default + map route
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Report from "@/pages/report";
import Track from "@/pages/track";
import Authority from "@/pages/authority";
import Admin from "@/pages/admin";
import Community from "@/pages/community";
import MapView from "@/pages/map-view";
import Analytics from "@/pages/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, retry: 1 },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/"          component={Dashboard}  />
        <Route path="/report"    component={Report}     />
        <Route path="/track/:id" component={Track}      />
        <Route path="/authority" component={Authority}  />
        <Route path="/admin"     component={Admin}      />
        <Route path="/community" component={Community}  />
        <Route path="/map"       component={MapView}    />
        <Route path="/analytics" component={Analytics}  />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="civicpulse-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
