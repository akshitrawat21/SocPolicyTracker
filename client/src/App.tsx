import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Policies from "@/pages/policies";
import Employees from "@/pages/employees";
import Roles from "@/pages/roles";
import Acknowledgements from "@/pages/acknowledgements";
import Alerts from "@/pages/alerts";
import Audit from "@/pages/audit";
import AppLayout from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/policies" component={Policies} />
      <Route path="/employees" component={Employees} />
      <Route path="/roles" component={Roles} />
      <Route path="/acknowledgements" component={Acknowledgements} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/audit" component={Audit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout>
          <Router />
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
