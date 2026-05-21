import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://rebase-flow.lovable.app";

const faqs: { q: string; a: string }[] = [
  {
    q: "Do I need to be a member to use the facility?",
    a: "Both membership and single-use passes are offered. Memberships (monthly, 6-month, or 12-month) provide the best value; single-use passes are available for non-members.",
  },
  {
    q: "How do I book an appointment?",
    a: "Via the website, mobile app, or by calling directly. Advance booking is recommended, especially weekends. Walk-ins accepted subject to availability.",
  },
  {
    q: "What are your hours of operation?",
    a: "Mon–Fri: 7am–9pm. Sat–Sun: 8am–8pm.",
  },
  {
    q: "Do I need to bring anything? What should I wear?",
    a: "Bring a swimsuit for ice baths and sauna (also available to purchase at reception). Light, loose clothing for other treatments. Robes, slippers, and all PPE for Cryotherapy are provided.",
  },
  {
    q: "Do you have changing rooms and showers?",
    a: "Yes — male and female changing rooms with showers, lockers, swimsuit drying facilities, and hair dryers.",
  },
  {
    q: "Which services does Rebase offer?",
    a: "A comprehensive range including ice baths, saunas (traditional & infrared), contrast classes, breathwork, yoga, HBOT, cryotherapy, vitamin infusions, lymphatic drainage, and various recovery specialists.",
  },
  {
    q: "Are walk-in appointments accepted?",
    a: "Yes, subject to availability. Advance booking is recommended.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Minimum 24 hours' notice required to cancel or reschedule. Cancellations within that window may incur a fee.",
  },
  {
    q: "Are there age restrictions for certain services?",
    a: "Some services have age restrictions for safety reasons. Check with the team or service descriptions for specifics.",
  },
  {
    q: "Does Rebase offer gift certificates or vouchers?",
    a: "Yes — customisable gift options are available. Contact us directly to purchase.",
  },
  {
    q: "Can I purchase wellness products at Rebase?",
    a: "Yes, a curated selection of premium wellness products is available in-venue.",
  },
  {
    q: "Can I request a specific professional for my treatment?",
    a: "Requests are accommodated where possible, subject to availability. Specify your preference when booking.",
  },
  {
    q: "What is your Health and Safety policy?",
    a: "All treatments are administered by trained professionals to the highest standards. Clients are encouraged to discuss any health concerns with the team before booking.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const FAQ = () => {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="bg-background">
      <Helmet>
        <title>FAQ — Rebase Recovery London</title>
        <meta
          name="description"
          content="Frequently asked questions about Rebase Recovery — memberships, bookings, hours, services, cancellation policy and more."
        />
        <link rel="canonical" href={`${SITE_URL}/faq`} />
        <meta property="og:title" content="FAQ — Rebase Recovery London" />
        <meta
          property="og:description"
          content="Answers to common questions about Rebase Recovery's wellness services, memberships and bookings."
        />
        <meta property="og:url" content={`${SITE_URL}/faq`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <header className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-light text-foreground tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-foreground/70 text-base sm:text-lg leading-relaxed">
            Everything you need to know about visiting Rebase. Can't find your answer?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Get in touch
            </a>
            .
          </p>
        </header>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-foreground/10 rounded-lg px-5 bg-card/50"
            >
              <AccordionTrigger className="text-left text-base sm:text-lg font-medium text-foreground hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/75 text-sm sm:text-base leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
