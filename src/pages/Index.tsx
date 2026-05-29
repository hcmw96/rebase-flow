import { useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import WebsiteServices from "@/components/WebsiteServices";
import BookingDrawer, { BookingServiceData } from "@/components/booking/BookingDrawer";
import SeoHead from "@/components/seo/SeoHead";
import { localBusinessSchema, seoTitle, truncateDescription } from "@/lib/seo";

const HOME_DESCRIPTION =
  "Luxury wellness in Marylebone, London: infrared sauna, cryotherapy, hyperbaric oxygen, ice bath & massage. Book recovery at Rebase Recovery.";

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
    <div className="min-h-screen overflow-y-auto" style={{ position: "fixed", inset: 0, overflowY: "auto" }}>
      <SeoHead
        title={seoTitle("Premium Wellness & Recovery Studio")}
        description={truncateDescription(HOME_DESCRIPTION)}
        path="/website"
        jsonLd={localBusinessSchema()}
      />
      <Navigation />
      <main id="main-content">
        <Hero />
        <WebsiteServices onSelectService={handleSelectService} />
      </main>
      <Footer />
      <BookingDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        service={bookingService}
        onSwitchService={() => {
          setDrawerOpen(false);
          setTimeout(() => {
            document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        }}
      />
    </div>
  );
};

export default Index;
