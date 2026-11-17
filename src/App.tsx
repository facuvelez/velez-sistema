
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestOperatorProvider } from "@/contexts/GuestOperatorContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { IdleLogoutWatcher } from "@/components/IdleLogoutWatcher";
import Index from "./pages/Index";
import ClientProfilePage from "./pages/ClientProfilePage";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import OperatorDashboard from "./pages/OperatorDashboard";
import AlineadorDashboard from "./pages/AlineadorDashboard";
import SuppliersPage from "./pages/SuppliersPage";
import PriceFlowsPage from "./pages/PriceFlowsPage";
import ComparatorPage from "./pages/ComparatorPage";
import PresupuestoPage from "./pages/PresupuestoPage";
import WorkOrdersPage from "./pages/WorkOrdersPage";
import PriceCompetitionPage from "./pages/PriceCompetitionPage";
import HelpAssistantWidget from "@/components/help/HelpAssistantWidget";

import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark", "dim"]}
    >
      <AuthProvider>
        <GuestOperatorProvider>
          <IdleLogoutWatcher />
          <TooltipProvider>
          <Toaster />

          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/operator" element={
                <ProtectedRoute allowedRoles={['Operator']}>
                  <OperatorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/alineador" element={
                <ProtectedRoute allowedRoles={['Alineador']}>
                  <AlineadorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Administracion']}>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/client/:clientId" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Administracion']}>
                  <ClientProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/suppliers" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Administracion']}>
                  <SuppliersPage />
                </ProtectedRoute>
              } />
              <Route path="/price-flows" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Administracion']}>
                  <PriceFlowsPage />
                </ProtectedRoute>
              } />
              <Route path="/comparador" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Administracion']}>
                  <ComparatorPage />
                </ProtectedRoute>
              } />
              <Route path="/presupuesto" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Administracion']}>
                  <PresupuestoPage />
                </ProtectedRoute>
              } />
              <Route path="/taller" element={
                <ProtectedRoute allowedRoles={['Administrator', 'Administracion', 'Operator', 'Alineador']}>
                  <WorkOrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/competencia" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <PriceCompetitionPage />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <HelpAssistantWidget />
          </BrowserRouter>

        </TooltipProvider>
        </GuestOperatorProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
