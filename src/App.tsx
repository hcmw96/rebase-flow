import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { MindbodyProvider } from "./contexts/MindbodyContext";
import ScrollToTop from "./components/ScrollToTop";
import AppShell from "./components/AppShell";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { fetchServices } from "@/hooks/useMindbodyServices";

const queryClient = new QueryClient();

// Prefetch services immediately on app load (no auth required)
queryClient.prefetchQuery({
  queryKey: ['mindbody-services'],
  queryFn: fetchServices,
  staleTime: 5 * 60 * 1000,
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MindbodyProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/website" element={<Index />} />
            <Route path="/" element={<AppShell />} />
            <Route path="*" element={<AppShell />} />
          </Routes>
        </BrowserRouter>
      </MindbodyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
