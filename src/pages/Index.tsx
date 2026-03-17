import { useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import WebsiteServices from "@/components/WebsiteServices";
import BookingDrawer, { BookingServiceData } from "@/components/booking/BookingDrawer";

const Index = () => {
  const [bookingService, setBookingService] = useState<BookingServiceData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectService = useCallback((service: BookingServiceData) => {
    setBookingService(service);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto" style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}>
      <Navigation />
      <Hero />
      <WebsiteServices onSelectService={handleSelectService} />
      <Footer />
      <BookingDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        service={bookingService}
        onSwitchService={(serviceName) => {
          setDrawerOpen(false);
          setTimeout(() => {
            const el = document.getElementById('services');
            el?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }}
      />
    </div>
  );
};

export default Index;
