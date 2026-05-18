import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import * as React from "react";
import { HelmetProvider } from "react-helmet-async";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthRedirectOverlay from "./components/AuthRedirectOverlay";
import ScrollToTop from "./components/ScrollToTop";
import AppShell from "./components/AppShell";
import NotFound from "./pages/NotFound";
import CookieConsent from "./components/CookieConsent";
import Index from "./pages/Index";
import CookiePolicy from "./pages/CookiePolicy";
import Membership from "./pages/Membership";
import WebsiteAccount from "./pages/WebsiteAccount";
import MembersPage from "./pages/MembersPage";
import Contact from "./pages/Contact";
import Experiences from "./pages/Experiences";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import { fetchServices } from "@/hooks/useMindbodyServices";

const queryClient = new QueryClient();

// Prefetch services immediately on app load (no auth required)
queryClient.prefetchQuery({
  queryKey: ['mindbody-services'],
  queryFn: fetchServices,
  staleTime: 30 * 60 * 1000, // 30 minutes
});

const AuthOverlayMount = () => {
  const { isRedirecting } = useAuth();
  return isRedirecting ? <AuthRedirectOverlay /> : null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CookieConsent />
          <ScrollToTop />
          <Routes>
            <Route path="/website" element={<Index />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/account" element={<WebsiteAccount />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/" element={<AppShell />} />
            <Route path="*" element={<AppShell />} />
          </Routes>
          <AuthOverlayMount />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
