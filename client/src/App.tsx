import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ClientsList from "@/pages/clients/index";
import ClientDetail from "@/pages/clients/detail";
import ClientForm from "@/pages/clients/form";
import Services from "@/pages/services";
import Agreements from "@/pages/agreements";
import Reports from "@/pages/reports";
import Insights from "@/pages/insights";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clients" component={ClientsList} />
      <Route path="/clients/new" component={ClientForm} />
      <Route path="/clients/:id" component={ClientDetail} />
      <Route path="/clients/:id/edit" component={ClientForm} />
      <Route path="/services" component={Services} />
      <Route path="/agreements" component={Agreements} />
      <Route path="/reports" component={Reports} />
      <Route path="/insights" component={Insights} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <PublicRoutes />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between p-4 border-b bg-card">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="text-sm text-muted-foreground">
                Infiniti Software Solutions
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6 bg-background">
              <AuthenticatedRoutes />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <AuthenticatedApp />
      </QueryClientProvider>
    </TooltipProvider>
  );
}

export default App;