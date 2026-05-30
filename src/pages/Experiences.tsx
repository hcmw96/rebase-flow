import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { experienceSlug } from "@/lib/experienceSlugs";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import ExperienceDrawer from "@/components/ExperienceDrawer";
import SeoHead from "@/components/seo/SeoHead";
import { COMMUNAL_CONTRAST_DESCRIPTION } from "@/config/serviceConfig";
import {
  absoluteUrl,
  breadcrumbSchema,
  itemListServicesSchema,
  seoTitle,
  truncateDescription,
} from "@/lib/seo";

const experiences = [
  {
    name: "Communal Contrast",
    image: "/images/rebase-members-suite.jpg",
    description: COMMUNAL_CONTRAST_DESCRIPTION,
  },
  {
    name: "Signature Classes",
    image: "/images/rebase-class-contrast-immersion.jpg",
    description:
      "From Yoga Flow + Heat & Ice to Stretch & Sauna, Contrast Immersion, Yoga and Mat Pilates — our signature class programme is designed to complement your recovery journey and build lasting resilience.",
  },
  {
    name: "Private Suites",
    image: "/images/rebase-infrared-suite.jpg",
    description:
      "Choose from our Infrared Suite with detoxifying heat and ice bath, or our Premium Suite with Finnish sauna and cold plunge — a restorative escape in complete privacy.",
  },
  {
    name: "Hyperbaric Oxygen",
    image: "/images/rebase-hbot-treatment.webp",
    description:
      "Breathe pure oxygen in a pressurised chamber to accelerate healing, reduce inflammation and enhance cognitive function. A cornerstone therapy for elite athletes and longevity enthusiasts alike.",
  },
  {
    name: "Cryotherapy",
    image: "/images/rebase-cryo.webp",
    description:
      "Step into sub-zero temperatures for whole-body cold therapy that reduces inflammation, boosts endorphins and accelerates muscle recovery. A three-minute session with lasting benefits.",
  },
  {
    name: "Massage Therapy",
    image: "/images/rebase-massage.jpg",
    description:
      "Our expert therapists offer deep tissue, sports massage, Brazilian lymphatic drainage, assisted stretching, reflexology, four-hand massage and bespoke facial treatments including Holistic Face Sculpting and Divine Facial Healing.",
  },
  {
    name: "IV Drips",
    image: "/images/rebase-iv-drip.jpg",
    description:
      "Vitamin-rich IV infusions tailored to your wellness goals, NAD+ cellular regeneration therapy, and comprehensive blood testing — all administered by qualified practitioners in a relaxing clinical setting.",
  },
  {
    name: "Regen and Manual Therapies",
    image: "/images/rebase-osteopathy.jpg",
    description:
      "Expert osteopathy and manual therapy to restore movement, correct alignment and relieve chronic pain. Our practitioners take a holistic approach to musculoskeletal health and long-term recovery.",
  },
];

const EXPERIENCES_DESCRIPTION =
  "Book cryotherapy, hyperbaric oxygen, infrared suites, ice bath, massage and IV drips at Rebase Recovery — premium wellness in Marylebone, London.";

const Experiences = () => {
  const location = useLocation();
  const [selectedExperience, setSelectedExperience] = useState<typeof experiences[0] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleExplore = (exp: typeof experiences[0]) => {
    setSelectedExperience(exp);
    setDrawerOpen(true);
  };

  useEffect(() => {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!hash) return;
    const match = experiences.find((exp) => experienceSlug(exp.name) === hash);
    if (match) {
      setSelectedExperience(match);
      setDrawerOpen(true);
    }
  }, [location.hash]);

  return (
    <div
      style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
      className="bg-[#1a1a1a]"
    >
      <SeoHead
        title={seoTitle("Wellness Treatments & Experiences")}
        description={truncateDescription(EXPERIENCES_DESCRIPTION)}
        path="/experiences"
        ogImage={absoluteUrl("/images/rebase-cryo.webp")}
        jsonLd={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Experiences", path: "/experiences" },
          ]),
          itemListServicesSchema(
            "/experiences",
            "Rebase Recovery Experiences",
            experiences.map((exp) => ({
              name: exp.name,
              description: exp.description,
              image: absoluteUrl(exp.image),
            })),
          ),
        ]}
      />
      <Navigation />
      <main id="main-content">

      {/* Hero */}
      <section className="pt-32 pb-16 px-5 sm:px-8" aria-labelledby="experiences-heading">
        <div className="max-w-[1200px] mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#F9ECD9]/40 text-xs uppercase tracking-[0.3em] mb-4 font-light"
          >
            Experiences
          </motion.p>
          <motion.h1
            id="experiences-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#F9ECD9] tracking-tight mb-6"
          >
            Our Treatments
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#F9ECD9]/50 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed"
          >
            A curated collection of recovery, performance and wellness
            treatments designed to help you feel, move and perform at your best.
          </motion.p>
        </div>
      </section>

      {/* Cards */}
      <section className="pb-24 px-5 sm:px-8" aria-label="Treatment categories">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {experiences.map((exp, idx) => (
            <motion.div
              key={exp.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * idx }}
              className="relative flex flex-col border border-[#F9ECD9]/10 bg-white/[0.02] rounded-sm overflow-hidden"
            >
              <div className="overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.name}
                  className="w-full h-56 object-cover"
                  loading="lazy"
                />
              </div>

              <div className="p-8 sm:p-10 flex flex-col flex-1">
                <h2 className="text-xl font-light text-[#F9ECD9] tracking-wide uppercase mb-4">
                  {exp.name}
                </h2>
                <p className="text-[#F9ECD9]/40 text-sm font-light leading-relaxed mb-8 flex-1">
                  {exp.description}
                </p>
                <Button
                  onClick={() => handleExplore(exp)}
                  aria-label={`Explore ${exp.name}`}
                  className="w-full rounded-none uppercase tracking-[0.2em] text-sm font-light h-12 bg-transparent border border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/10 hover:border-[#F9ECD9]/40 transition-all duration-300"
                  variant="outline"
                >
                  Explore
                  <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      </main>
      <Footer />

      <ExperienceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        experience={selectedExperience}
      />
    </div>
  );
};

export default Experiences;
