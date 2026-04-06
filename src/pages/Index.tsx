import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import WebsiteServices from "@/components/WebsiteServices";
import BookingDrawer, { BookingServiceData } from "@/components/booking/BookingDrawer";

const SITE_URL = "https://rebase-flow.lovable.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Rebase Recovery",
  "description": "London's premier wellness centre offering luxury recovery and rejuvenation experiences including contrast therapy, cryotherapy, breathwork, hyperbaric oxygen therapy and more.",
  "url": SITE_URL,
  "telephone": "+442000000000",
  "email": "reception@rebaserecovery.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Marylebone High Street",
    "addressLocality": "London",
    "addressCountry": "GB"
  },
  "image": `${SITE_URL}/og-image.jpg`,
  "priceRange": "££",
  "sameAs": [],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Wellness Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Contrast Therapy" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Cryotherapy" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Breathwork" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Hyperbaric Oxygen Therapy" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "IV Therapy" } }
    ]
  }
};

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
      <Helmet>
        <title>Rebase Recovery — London's Premier Wellness Centre</title>
        <meta name="description" content="Experience luxury wellness at Rebase Recovery. Book contrast therapy, breathwork, cryotherapy, hyperbaric oxygen and more at London's premier wellness centre in Marylebone." />
        <link rel="canonical" href={`${SITE_URL}/website`} />
        <meta property="og:title" content="Rebase Recovery — London's Premier Wellness Centre" />
        <meta property="og:description" content="Experience luxury wellness at Rebase Recovery. Book contrast therapy, breathwork, cryotherapy, and more." />
        <meta property="og:url" content={`${SITE_URL}/website`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rebase Recovery — London's Premier Wellness Centre" />
        <meta name="twitter:description" content="Experience luxury wellness at Rebase Recovery. Book contrast therapy, breathwork, cryotherapy, and more." />
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      </Helmet>
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
