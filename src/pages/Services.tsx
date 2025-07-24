import { useState } from "react";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Services = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Recovery", "Movement", "Mindfulness", "Therapy"];

  const services = [
    {
      title: "Ice Baths",
      description: "Unlock the amazing benefits of cold water immersion in a safe, controlled environment.",
      benefits: ["Reduced inflammation", "Long lasting dopamine release", "Antidepressant effects", "Improved mood", "Fat loss", "Mental resilience"],
      category: "Recovery",
      duration: "1-5 min",
      price: "From £25"
    },
    {
      title: "Traditional Saunas",
      description: "Relax in our bespoke Finnish saunas heated to 85-95°C for maximum therapeutic benefit.",
      benefits: ["Lower blood pressure", "Reduces inflammation", "Burns calories", "Improves mood", "Better sleep", "Heart health"],
      category: "Recovery",
      duration: "10-15 min",
      price: "From £30"
    },
    {
      title: "Infrared Saunas",
      description: "Full spectrum infrared sauna experience at 70-80°C for deeper, longer therapeutic sessions.",
      benefits: ["Eliminates toxins", "Weight loss", "Improved sleep", "Boosts nitric oxide", "Skin purification", "Pain reduction"],
      category: "Recovery",
      duration: "20-30 min",
      price: "From £35"
    },
    {
      title: "Contrast Classes",
      description: "Unique classes combining sauna, ice baths, yoga and breathwork for complete wellness.",
      benefits: ["Sleep optimization", "Stress relief", "Enhanced focus", "Complete recovery", "Social wellness"],
      category: "Movement",
      duration: "60 min",
      price: "From £65"
    },
    {
      title: "Private Contrast Suites",
      description: "Luxury private suites with traditional or infrared sauna and ice bath, with concierge service.",
      benefits: ["Privacy", "Personalized experience", "Concierge service", "Extended sessions", "Add-on treatments"],
      category: "Recovery",
      duration: "60+ min",
      price: "From £120"
    },
    {
      title: "Breathwork",
      description: "Experience unique breathwork classes tailored to your everyday needs and wellness goals.",
      benefits: ["Reduces stress", "Improves sleep", "Increases energy", "Improves mood", "Releases toxins", "Pain relief"],
      category: "Mindfulness",
      duration: "45 min",
      price: "From £35"
    },
    {
      title: "Yoga",
      description: "Ancient practice connecting breath to movement for incredible mental and physical benefits.",
      benefits: ["Improved flexibility", "Stress relief", "Better posture", "Mind-body connection", "Strength building"],
      category: "Movement",
      duration: "60 min",
      price: "From £40"
    },
    {
      title: "Hyperbaric Oxygen",
      description: "State-of-the-art four-person chamber increasing oxygen delivery for accelerated recovery.",
      benefits: ["Increased blood flow", "Decreased inflammation", "Accelerated recovery", "Cellular rejuvenation", "Anti-aging"],
      category: "Therapy",
      duration: "60 min",
      price: "From £80"
    },
    {
      title: "Cryotherapy",
      description: "Whole-body cryotherapy chamber reaching -110°C for ultimate cold therapy benefits.",
      benefits: ["Endorphin boost", "Reduces inflammation", "Antidepressant", "Reduces anxiety", "Weight loss", "Muscle recovery"],
      category: "Recovery",
      duration: "3 min",
      price: "From £45"
    },
    {
      title: "IV Vitamin Therapy",
      description: "Boost your wellbeing, immune system and energy levels through targeted vitamin infusions.",
      benefits: ["Immune support", "Energy boost", "Hydration", "Nutrient absorption", "Recovery support"],
      category: "Therapy",
      duration: "30-45 min",
      price: "From £95"
    },
    {
      title: "Lymphatic Drainage",
      description: "Specialist treatments to boost your immune system and fight off bacteria and infections.",
      benefits: ["Immune boost", "Detoxification", "Reduced swelling", "Improved circulation", "Wellness support"],
      category: "Therapy",
      duration: "60 min",
      price: "From £85"
    },
    {
      title: "Recovery Specialists",
      description: "Wide range of specialist treatments including osteopathy, massage, acupuncture and more.",
      benefits: ["Expert care", "Targeted treatment", "Pain relief", "Performance enhancement", "Injury prevention"],
      category: "Therapy",
      duration: "60 min",
      price: "From £90"
    }
  ];

  const filteredServices = activeCategory === "All" 
    ? services 
    : services.filter(service => service.category === activeCategory);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        {/* Header */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-6xl font-serif font-light text-foreground mb-6">
              Our <span className="text-primary text-glow">Services</span>
            </h1>
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto mb-12">
              Explore our comprehensive menu of rejuvenating services designed to help you find balance, 
              relaxation, and lasting wellbeing through cutting-edge wellness modalities.
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "transition-all duration-300",
                    activeCategory === category 
                      ? "btn-luxury" 
                      : "btn-ghost-luxury"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service, index) => (
                <ServiceCard 
                  key={index} 
                  {...service}
                  className="animate-fade-in"
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Services;