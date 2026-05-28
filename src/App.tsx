import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Articles from "./pages/Articles.tsx";
import ArticleDetail from "./pages/ArticleDetail.tsx";
import Breakdown from "./pages/Breakdown.tsx";
import BreakdownDetail from "./pages/BreakdownDetail.tsx";
import Services from "./pages/Services.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Book from "./pages/Book.tsx";
import About from "./pages/About.tsx";
import Team from "./pages/Team.tsx";
import TeamProfile from "./pages/TeamProfile.tsx";
import Advertise from "./pages/Advertise.tsx";
import Fest from "./pages/Fest.tsx";
import Picks from "./pages/Picks.tsx";
import PicksAdmin from "./pages/PicksAdmin.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import StaffApprovals from "./pages/StaffApprovals.tsx";
import ClientPortal from "./pages/ClientPortal.tsx";
import Apply from "./pages/Apply.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import FloatingLogo from "@/components/site/FloatingLogo";
import PageTransition from "@/components/site/PageTransition";
import ScrollToTop from "@/components/site/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <FloatingLogo />
          <PageTransition>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/breakdown" element={<Breakdown />} />
              <Route path="/breakdown/:slug" element={<BreakdownDetail />} />
              <Route path="/services" element={<Services />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/book" element={<Book />} />
              <Route path="/about" element={<About />} />
              <Route path="/team" element={<Team />} />
              <Route path="/team/:slug" element={<TeamProfile />} />
              <Route path="/advertise" element={<Advertise />} />
              <Route path="/fest" element={<Fest />} />
              <Route path="/picks" element={<Picks />} />
              <Route path="/apply" element={<Apply />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/staff-code-signup" element={<Navigate to="/signup" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Private */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/:section" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route
                path="/admin/picks"
                element={
                  <ProtectedRoute requireRoles={["admin","head_admin","owner","co_ceo"]}>
                    <PicksAdmin />
                  </ProtectedRoute>
                }
              />
              <Route path="/staff-approvals" element={<ProtectedRoute><StaffApprovals /></ProtectedRoute>} />
              <Route path="/portal" element={<ClientPortal />} />
              <Route path="/portal/:tab" element={<ClientPortal />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
