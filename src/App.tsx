import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LandingPage from "@/components/LandingPage";
import Index from "./pages/Index";
import RequireRole from "@/components/RequireRole";
import NotFound from "./pages/NotFound";
import LoginForm from "@/components/LoginForm";
import NearestHospital from "./pages/NearestHospital";
import HospitalDashboard from "./pages/HospitalDashboard";

// Helper component to handle navigation from LandingPage
function LandingPageWithNav() {
  const navigate = useNavigate();
  return <LandingPage onGetStarted={() => navigate("/login")} />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPageWithNav />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/triage" element={<RequireRole allow="clinician"><Index /></RequireRole>} />
            <Route path="/nearest-hospital" element={<NearestHospital />} />
            <Route path="/hospital/dashboard" element={<RequireRole allow="hospital"><HospitalDashboard /></RequireRole>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
