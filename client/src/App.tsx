import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ClientsList from "@/pages/clients/index";
import ClientDetail from "@/pages/clients/detail";
import ClientForm from "@/pages/clients/form";
import Services from "@/pages/services";
import Agreements from "@/pages/agreements";
import Reports from "@/pages/reports";
import Insights from "@/pages/insights";
import UsersPage from "./pages/users";
import InvoiceManagement from "./pages/invoice-management";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

function AuthenticatedRoutes() {
  const style = {
    "--sidebar-width": "16.25rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="text-sm text-muted-foreground">
                Infiniti Software Solutions
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/clients" component={ClientsList} />
              <Route path="/clients/new" component={ClientForm} />
              <Route path="/clients/:id" component={ClientDetail} />
              <Route path="/clients/:id/edit" component={ClientForm} />
              <Route path="/services" component={Services} />
              <Route path="/agreements" component={Agreements} />
              <Route path="/reports" component={Reports} />
              <Route path="/insights" component={Insights} />
              <Route path="/users" component={UsersPage} />
              <Route path="/invoice-management" component={InvoiceManagement} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  // Check if user is logged in using sessionStorage
  const [isLoggedIn, setIsLoggedIn] = useState(
    sessionStorage.getItem("isLoggedIn") === "true"
  );

  // Listen for storage changes (in case of login from another tab)
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(sessionStorage.getItem("isLoggedIn") === "true");
    };

    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  if (isLoggedIn) {
    return <AuthenticatedRoutes />;
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </TooltipProvider>
  );
}

export default App;