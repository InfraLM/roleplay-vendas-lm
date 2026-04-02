import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { SystemConfigProvider } from "@/hooks/useSystemConfig";
import ProtectedRoute from "@/components/ProtectedRoute";
import RemixGate from "@/components/RemixGate";
import { PageTooltipProvider } from "@/components/onboarding/PageTooltipProvider";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import RoleplaySelection from "./pages/RoleplaySelection";
import RoleplayChat from "./pages/RoleplayChat";
import RoleplayResults from "./pages/RoleplayResults";
import { Navigate } from "react-router-dom";
import AdminCenarios from "./pages/AdminCenarios";
import AdminEquipe from "./pages/AdminEquipe";
import AdminRelatorios from "./pages/AdminRelatorios";
import AdminConfiguracoes from "./pages/AdminConfiguracoes";
import AdminPremios from "./pages/AdminPremios";
import Analytics from "./pages/Analytics";
import Vouchers from "./pages/Vouchers";
import PrizeCatalog from "./pages/PrizeCatalog";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Ninja from "./pages/Ninja";
// CreateOrganization removed - org is auto-assigned on signup

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000,        // 30 min cache garbage collection
      retry: 1,                       // One retry attempt
      refetchOnWindowFocus: false,   // Don't refetch on window focus
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SystemConfigProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RemixGate>
                <PageTooltipProvider>
                  <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/setup" element={<Setup />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/create-organization" element={<Navigate to="/dashboard" replace />} />
              {/* Protected App routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/roleplay" element={
                <ProtectedRoute>
                  <RoleplaySelection />
                </ProtectedRoute>
              } />
              <Route path="/roleplay/:id" element={
                <ProtectedRoute>
                  <RoleplayChat />
                </ProtectedRoute>
              } />
              <Route path="/roleplay/:id/results" element={
                <ProtectedRoute>
                  <RoleplayResults />
                </ProtectedRoute>
              } />
              
              {/* Protected Admin routes */}
              <Route path="/admin" element={<Navigate to="/admin/equipe" replace />} />
              <Route path="/admin/cenarios" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCenarios />
                </ProtectedRoute>
              } />
              <Route path="/admin/equipe" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminEquipe />
                </ProtectedRoute>
              } />
              <Route path="/admin/relatorios" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminRelatorios />
                </ProtectedRoute>
              } />
              <Route path="/admin/configuracoes" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminConfiguracoes />
                </ProtectedRoute>
              } />
              <Route path="/admin/premios" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPremios />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/vouchers" element={
                <ProtectedRoute>
                  <Vouchers />
                </ProtectedRoute>
              } />
              <Route path="/prizes" element={
                <ProtectedRoute>
                  <PrizeCatalog />
                </ProtectedRoute>
              } />
              <Route path="/ninja" element={
                <ProtectedRoute>
                  <Ninja />
                </ProtectedRoute>
              } />
              
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTooltipProvider>
              </RemixGate>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </SystemConfigProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
