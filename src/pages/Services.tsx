import { useState } from "react";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Services = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Classes", "Suites", "Tech Therapies", "Massage Therapies", "Manual Therapies", "Other Services"];

  const services = [
    // Classes
    {
      id: 1,
      title: "Contrast Therapy",
      category: "Classes", 
      duration: "60 minutes",
      price: 40
    },
    {
      id: 2,
      title: "Breathwork",
      category: "Classes",
      duration: "60 minutes", 
      price: 40
    },
    {
      id: 3,
      title: "Yoga",
      category: "Classes",
      duration: "60 minutes",
      price: 40
    },

    // Suites
    {
      id: 4,
      title: "Members Contrast Suite Drop In",
      category: "Suites",
      duration: "60 minutes",
      price: 65
    },
    {
      id: 5,
      title: "Premium Suite",
      category: "Suites",
      variants: [
        { duration: "45 minutes", price: 240 },
        { duration: "90 minutes", price: 420 }
      ]
    },
    {
      id: 6,
      title: "Infrared Suite", 
      category: "Suites",
      variants: [
        { duration: "45 minutes", price: 190 },
        { duration: "90 minutes", price: 330 }
      ]
    },

    // Tech Therapies
    {
      id: 7,
      title: "Cryotherapy",
      category: "Tech Therapies",
      variants: [
        { duration: "3 minutes", price: 50, description: "Single session" },
        { duration: "10 sessions", price: 400, description: "Pack of 10" }
      ]
    },
    {
      id: 8,
      title: "HBOT (Hyperbaric Oxygen Therapy)",
      category: "Tech Therapies", 
      variants: [
        { duration: "60 minutes", price: 200, description: "Single session" },
        { duration: "5 sessions", price: 800, description: "Pack of 5" },
        { duration: "10 sessions", price: 1600, description: "Pack of 10" }
      ]
    },

    // Massage Therapies
    {
      id: 9,
      title: "Total Body Realignment",
      category: "Massage Therapies",
      duration: "60-90 minutes",
      price: 195,
      fromPrice: true
    },
    {
      id: 10,
      title: "Sports Massage", 
      category: "Massage Therapies",
      duration: "60-90 minutes",
      price: 185,
      fromPrice: true
    },
    {
      id: 11,
      title: "Lymphatic Drainage",
      category: "Massage Therapies", 
      duration: "60-90 minutes",
      price: 185,
      fromPrice: true
    },
    {
      id: 12,
      title: "Deep Tissue",
      category: "Massage Therapies",
      duration: "60-90 minutes", 
      price: 185,
      fromPrice: true
    },

    // Manual Therapies
    {
      id: 13,
      title: "Osteopathy Consultation",
      category: "Manual Therapies",
      duration: "60 minutes",
      price: 210
    },
    {
      id: 14,
      title: "Structural Fascia Therapy", 
      category: "Manual Therapies",
      duration: "60 minutes",
      price: 200
    },

    // Other Services
    {
      id: 15,
      title: "IV Drip",
      category: "Other Services",
      duration: "45-60 minutes",
      price: 350,
      fromPrice: true
    },
    {
      id: 16,
      title: "Vitamin Infusions",
      category: "Other Services", 
      duration: "30 minutes",
      price: 80
    }
  ];

  const filteredServices = activeCategory === "All" 
    ? services 
    : services.filter(service => service.category === activeCategory);

  return (
    <div 
      className="min-h-screen bg-cover bg-center md:bg-left md:bg-fixed bg-no-repeat relative"
      style={{
        backgroundImage: `url('/lovable-uploads/397f6034-d62e-4ad3-b98c-30070da1186a.png')`
      }}
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <div className="relative z-10">
        <Navigation />
        
        <div className="pt-20">

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
                    "transition-all duration-300 rounded-xl",
                    activeCategory === category 
                      ? "glass-button text-white" 
                      : "glass-button text-white/70 hover:text-white border-white/20"
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
              {filteredServices.map((service) => (
                <ServiceCard 
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  category={service.category}
                  className="animate-fade-in"
                  service={{
                    duration: service.duration,
                    price: service.price,
                    fromPrice: service.fromPrice,
                    variants: service.variants
                  }}
                />
              ))}
            </div>
          </div>
        </section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Services;