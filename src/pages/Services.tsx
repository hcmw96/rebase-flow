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
      category: "Recovery"
    },
    {
      title: "Traditional Saunas",
      category: "Recovery"
    },
    {
      title: "Infrared Saunas",
      category: "Recovery"
    },
    {
      title: "Contrast Classes",
      category: "Movement"
    },
    {
      title: "Private Contrast Suites",
      category: "Recovery"
    },
    {
      title: "Breathwork",
      category: "Mindfulness"
    },
    {
      title: "Yoga",
      category: "Movement"
    },
    {
      title: "Hyperbaric Oxygen",
      category: "Therapy"
    },
    {
      title: "Cryotherapy",
      category: "Recovery"
    },
    {
      title: "IV Vitamin Therapy",
      category: "Therapy"
    },
    {
      title: "Lymphatic Drainage",
      category: "Therapy"
    },
    {
      title: "Recovery Specialists",
      category: "Therapy"
    }
  ];

  const filteredServices = activeCategory === "All" 
    ? services 
    : services.filter(service => service.category === activeCategory);

  return (
    <div className="min-h-screen">
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