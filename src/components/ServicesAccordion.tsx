import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  benefits?: string[];
  contactText: string;
}

const leftColumnServices: ServiceItem[] = [
  {
    id: "ice-baths",
    title: "ICE BATHS",
    description: "Cold water immersion therapy that reduces inflammation, accelerates muscle recovery, and boosts your immune system. Our ice baths are maintained at optimal temperatures for maximum benefit.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "traditional-saunas",
    title: "TRADITIONAL SAUNAS",
    description: "Experience the time-honoured practice of Finnish sauna bathing. Our traditional saunas provide deep heat therapy to relax muscles, improve circulation, and promote detoxification.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "infrared-saunas",
    title: "INFRARED SAUNAS",
    description: "Infrared light penetrates deeper into tissue than traditional heat, providing therapeutic benefits at lower temperatures. Perfect for those who prefer a gentler sauna experience.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "contrast-classes",
    title: "CONTRAST CLASSES",
    description: "Guided group sessions alternating between hot and cold therapy. Our expert instructors lead you through the optimal timing and techniques for maximum recovery benefits.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "contrast-suites",
    title: "CONTRAST SUITES",
    description: "Private suites featuring both ice bath and sauna facilities. Perfect for those who prefer a personal space to enjoy their contrast therapy session at their own pace.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "breathwork",
    title: "BREATHWORK",
    description: "Structured breathing techniques designed to reduce stress, increase energy, and enhance mental clarity. Our sessions combine ancient practices with modern understanding of respiratory science.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  }
];

const rightColumnServices: ServiceItem[] = [
  {
    id: "yoga",
    title: "YOGA",
    description: "Restore balance and flexibility with our yoga sessions designed to complement your recovery journey. Various styles available from gentle restorative to dynamic vinyasa.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "hyperbaric-oxygen",
    title: "HYPERBARIC OXYGEN",
    description: "Breathe pure oxygen in a pressurised chamber to accelerate healing, reduce inflammation, and enhance cognitive function. Used by elite athletes worldwide for faster recovery.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "cryotherapy",
    title: "CRYOTHERAPY",
    description: "Whole-body cryotherapy exposes you to extremely cold temperatures for a short duration, triggering powerful anti-inflammatory responses and endorphin release.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "vitamin-infusions",
    title: "VITAMIN INFUSIONS",
    description: "IV therapy delivers essential vitamins and minerals directly into your bloodstream for optimal absorption. Customised blends available for energy, immunity, and recovery.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "lymphatic-drainage",
    title: "LYMPHATIC DRAINAGE",
    description: "The lymphatic system is often overlooked in modern medicine but it plays such a key role in our immune system, fighting off bacteria and infections. Give your immune system the ultimate boost and book in to see one of our specialist practitioners.",
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  },
  {
    id: "recovery-specialists",
    title: "RECOVERY SPECIALISTS",
    description: "We offer a wide range of recovery and sports specialists available at Rebase including:",
    benefits: [
      "Chiropractor",
      "Osteopath",
      "Lymphatic massage",
      "Reflexology",
      "Sports massage",
      "Deep Tissue massage",
      "Acupuncture",
      "Nutrition",
      "Assisted stretching"
    ],
    contactText: "For more information and booking enquiries contact us at reception@rebaserecovery.com"
  }
];

interface AccordionItemProps {
  item: ServiceItem;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem = ({ item, isOpen, onToggle }: AccordionItemProps) => {
  return (
    <div className="border-b border-white/20">
      <button
        onClick={onToggle}
        className={`w-full py-6 flex items-center justify-between text-left transition-all ${
          isOpen ? "border border-white/40 px-4 -mx-4" : ""
        }`}
      >
        <span className="text-white text-lg md:text-xl font-light tracking-[0.2em]">
          {item.title}
        </span>
        {isOpen ? (
          <Minus className="text-white w-5 h-5 flex-shrink-0" />
        ) : (
          <Plus className="text-white w-5 h-5 flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-8 space-y-4">
              <p className="text-white/80 text-sm md:text-base leading-relaxed">
                {item.description}
              </p>
              {item.benefits && (
                <ul className="space-y-1">
                  {item.benefits.map((benefit, index) => (
                    <li key={index} className="text-white/80 text-sm md:text-base">
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-white/60 text-sm">
                {item.contactText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ServicesAccordion = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section 
      className="relative py-10 md:py-14 px-4 sm:px-6 lg:px-8 mx-4 sm:mx-6 lg:mx-8 rounded-2xl overflow-hidden"
      style={{
        backgroundImage: 'url(/images/wood-texture.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60 rounded-2xl" />
      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-0">
          {/* Left Column */}
          <div>
            {leftColumnServices.map((service) => (
              <AccordionItem
                key={service.id}
                item={service}
                isOpen={openItems[service.id] || false}
                onToggle={() => toggleItem(service.id)}
              />
            ))}
          </div>
          
          {/* Right Column */}
          <div>
            {rightColumnServices.map((service) => (
              <AccordionItem
                key={service.id}
                item={service}
                isOpen={openItems[service.id] || false}
                onToggle={() => toggleItem(service.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesAccordion;
