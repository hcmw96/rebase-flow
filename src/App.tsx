import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGate from "@/components/AuthGate";
import Landing from "./pages/Landing";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Book from "./pages/Book";
import BookService from "./pages/BookService";
import Auth from "./pages/Auth";
import Integrations from "./pages/Integrations";
import Classes from "./pages/Classes";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes */}
          <Route path="/integrations" element={
            <AuthGate>
              <Integrations />
            </AuthGate>
          } />
          <Route path="/classes" element={
            <AuthGate>
              <Classes />
            </AuthGate>
          } />
          <Route path="/book" element={
            <AuthGate>
              <Book />
            </AuthGate>
          } />
          <Route path="/book/:serviceId" element={
            <AuthGate>
              <BookService />
            </AuthGate>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
