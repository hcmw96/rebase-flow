import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://rebase-flow.lovable.app";

const tiers = [
  {
    name: "Base",
    image: "/images/rebase-base-membership.webp",
    overview:
      "Our Base membership is the perfect platform from which to begin your journey to optimal health. Providing value for money and a chance to try everything on offer at Rebase, this is the perfect entry level membership for those wishing to take their health seriously.",
    details: [
      "4 monthly Class Passes",
      "4 monthly Cryotherapy Sessions",
      "1 monthly HBOT Session",
      "8 monthly passes to Communal Members Suite",
      "10% off all additional treatments and bookings",
      "6 Guest Passes Annually",
    ],
  },
  {
    name: "Resident",
    image: "/images/rebase-resident-membership.webp",
    overview:
      "Our Resident membership provides access to all treatments at Rebase. Perfect for those wanting to enjoy tailored sports recovery services, dedicated wellness stewardship and concentrated access to all of our contrast services. This membership is perfect for anyone with a focus on performance.",
    details: [
      "Unlimited Cryotherapy",
      "8 monthly Class Passes",
      "3 monthly Private Suite Sessions",
      "3 monthly HBOT Sessions",
      "Unlimited access to Communal Members Suite",
      "10% off all additional treatments and bookings",
      "12 Guest Passes Annually",
    ],
    highlighted: true,
  },
  {
    name: "Ultimate",
    image: "/images/rebase-ultimate-membership.webp",
    overview:
      "The Ultimate membership unlocks the full potential of Rebase. Develop a bespoke package to suit your wellness needs and achieve elemental balance through unlimited access to our Cryo and classes, along with a robust package of private suite sessions, HBOT and recovery practitioners. This membership is for corporate athletes, performance enthusiasts and anyone looking to unlock the full potential of their genetic code.",
    details: [
      "Unlimited Access to Classes",
      "Unlimited Cryotherapy",
      "6 monthly Private Suite Sessions",
      "6 monthly HBOT Sessions",
      "Unlimited access to Communal Members Suite",
      "10% off all additional treatments and bookings",
      "18 Guest Passes Annually",
    ],
  },
];

const Membership = () => {
  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="bg-[#1a1a1a]">
      <Helmet>
        <title>Membership Plans — Rebase Recovery London</title>
        <meta name="description" content="Choose from Base, Resident or Ultimate membership tiers at Rebase Recovery. Unlock cryotherapy, HBOT, private suites, classes and more in Marylebone, London." />
        <link rel="canonical" href={`${SITE_URL}/membership`} />
        <meta property="og:title" content="Membership Plans — Rebase Recovery London" />
        <meta property="og:description" content="Elevate your recovery with Rebase membership. Unlimited cryotherapy, classes, private suites & more." />
        <meta property="og:url" content={`${SITE_URL}/membership`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
      </Helmet>
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#F9ECD9]/40 text-xs uppercase tracking-[0.3em] mb-4 font-light"
          >
            Membership
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#F9ECD9] tracking-tight mb-6"
          >
            Elevate Your Recovery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#F9ECD9]/50 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed"
          >
            Choose the membership tier that aligns with your wellness goals.
            Each level unlocks progressively greater access to our world-class
            recovery and performance services.
          </motion.p>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="pb-24 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 * idx }}
              className={`relative flex flex-col border rounded-sm p-8 sm:p-10 transition-all duration-300 ${
                tier.highlighted
                  ? "border-[#F9ECD9]/30 bg-[#F9ECD9]/[0.04]"
                  : "border-[#F9ECD9]/10 bg-white/[0.02]"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F9ECD9] text-[#1a1a1a] text-[10px] uppercase tracking-[0.2em] font-medium px-4 py-1">
                  Most Popular
                </span>
              )}

              {tier.image && (
                <div className="-mx-8 sm:-mx-10 -mt-8 sm:-mt-10 mb-6 overflow-hidden rounded-t-sm">
                  <img src={tier.image} alt={tier.name} className="w-full h-48 object-cover" />
                </div>
              )}

              <h2 className="text-2xl font-light text-[#F9ECD9] tracking-wide uppercase mb-4">
                {tier.name}
              </h2>

              <p className="text-[#F9ECD9]/40 text-sm font-light leading-relaxed mb-8">
                {tier.overview}
              </p>

              <div className="border-t border-[#F9ECD9]/10 pt-6 mb-8 flex-1">
                <p className="text-[#F9ECD9]/30 text-[10px] uppercase tracking-[0.25em] mb-4 font-medium">
                  What's Included
                </p>
                <ul className="space-y-3">
                  {tier.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-3 text-sm text-[#F9ECD9]/70 font-light"
                    >
                      <Check className="h-4 w-4 text-[#F9ECD9]/40 mt-0.5 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              <Link to="/contact">
                <Button
                  className="w-full rounded-none uppercase tracking-[0.2em] text-sm font-light h-12 bg-transparent border border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/10 hover:border-[#F9ECD9]/40 transition-all duration-300"
                  variant="outline"
                >
                  Enquire
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Membership;
