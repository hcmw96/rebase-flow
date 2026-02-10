import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MindbodyProvider } from "./contexts/MindbodyContext";
import ScrollToTop from "./components/ScrollToTop";
import AppShell from "./components/AppShell";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MindbodyProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<AppShell />} />
          <Route path="*" element={<AppShell />} />
        </Routes>
      </BrowserRouter>
    </MindbodyProvider>
  </QueryClientProvider>
);

export default App;
