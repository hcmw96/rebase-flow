import { useState, useCallback } from "react";
import { useResumePendingBooking } from "@/hooks/useResumePendingBooking";
import type { PendingAppointmentState } from "@/lib/bookingResume";
import { clearPendingBooking } from "@/lib/bookingResume";
import type { MindbodyClass } from "@/hooks/useMindbodyServices";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import JuneContrastPassPopup from "@/components/JuneContrastPassPopup";
import WebsiteServices from "@/components/WebsiteServices";
import BookingDrawer, { BookingServiceData } from "@/components/booking/BookingDrawer";
import SeoHead from "@/components/seo/SeoHead";
import { localBusinessSchema, seoTitle, truncateDescription } from "@/lib/seo";

const HOME_DESCRIPTION =
  "Luxury wellness in Marylebone, London: infrared sauna, cryotherapy, hyperbaric oxygen, ice bath & massage. Book recovery at Rebase Recovery.";

import { usePrefetchPopularAvailability } from "@/hooks/usePrefetchPopularAvailability";

const Index = () => {
  usePrefetchPopularAvailability();
  const [bookingService, setBookingService] = useState<BookingServiceData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resumeClassId, setResumeClassId] = useState<string | undefined>();
  const [resumeClass, setResumeClass] = useState<MindbodyClass | undefined>();
  const [resumeAppointment, setResumeAppointment] = useState<PendingAppointmentState | undefined>();

  useResumePendingBooking(
    useCallback((pending) => {
      setBookingService(pending.service);
      setResumeClassId(pending.selectedClassId);
      setResumeClass(pending.selectedClass);
      setResumeAppointment(pending.appointment);
      setDrawerOpen(true);
    }, []),
  );

  const handleSelectService = useCallback((service: BookingServiceData) => {
    setResumeClassId(undefined);
    setResumeClass(undefined);
    setResumeAppointment(undefined);
    setBookingService(service);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setResumeClassId(undefined);
    setResumeClass(undefined);
    setResumeAppointment(undefined);
    clearPendingBooking();
    // Clear after close animation so availability queries fully disable.
    window.setTimeout(() => setBookingService(null), 350);
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto" style={{ position: "fixed", inset: 0, overflowY: "auto" }}>
      <SeoHead
        title={seoTitle("Premium Wellness & Recovery Studio")}
        description={truncateDescription(HOME_DESCRIPTION)}
        path="/"
        jsonLd={localBusinessSchema()}
      />
      <JuneContrastPassPopup />
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
        resumeClassId={resumeClassId}
        resumeClass={resumeClass}
        resumeAppointment={resumeAppointment}
        onSwitchService={() => {
          setDrawerOpen(false);
          window.setTimeout(() => {
            setBookingService(null);
            document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        }}
      />
    </div>
  );
};

export default Index;
