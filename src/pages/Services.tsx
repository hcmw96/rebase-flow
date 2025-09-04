import { useState } from "react";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Types for the UI data structures
interface ServiceItem {
  id: number;
  title: string;
  category: string;
  duration: string;
  price?: number;
  fromPrice?: boolean;
  variants?: { duration: string; price: number; description?: string; }[];
  description?: string;
}

const Services = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Classes", "Services", "Wellness"];

  // Static services data (ready for integration)
  const services: ServiceItem[] = [
    {
      id: 1,
      title: "Contrast Therapy",
      category: "Classes", 
      duration: "60 minutes",
      price: 40
    },
    {
      id: 2,
      title: "Premium Suite",
      category: "Services",
      duration: "45-90 minutes",
      variants: [
        { duration: "45 minutes", price: 240, description: "Express session" },
        { duration: "90 minutes", price: 420, description: "Extended session" }
      ]
    },
    {
      id: 3,
      title: "Sports Massage", 
      category: "Services",
      duration: "60-90 minutes",
      price: 185,
      fromPrice: true
    },
    {
      id: 4,
      title: "Meditation Class",
      category: "Classes",
      duration: "45 minutes", 
      price: 25
    },
    {
      id: 5,
      title: "Infrared Sauna",
      category: "Wellness",
      duration: "30-60 minutes",
      price: 35,
      fromPrice: true
    },
    {
      id: 6,
      title: "Cryotherapy",
      category: "Wellness", 
      duration: "3 minutes",
      price: 65
    }
  ];

  const getFilteredData = () => {
    if (activeCategory === "All") {
      return services;
    }
    return services.filter(service => service.category === activeCategory);
  };

  const filteredData = getFilteredData();

  return (
    <div 
      className="min-h-screen bg-cover bg-left bg-fixed relative"
      style={{
        backgroundImage: `url('/lovable-uploads/397f6034-d62e-4ad3-b98c-30070da1186a.png')`
      }}
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <div className="relative z-10">
        <Navigation />
        
        <div className="pt-20">
          {/* Hero Section */}
          <section className="px-4 sm:px-6 lg:px-8 mb-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-serif font-light text-white mb-6">
                Our <span className="text-primary">Services</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Discover our comprehensive range of wellness services designed to rejuvenate your body and mind.
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
                {filteredData.map((service) => (
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

              {filteredData.length === 0 && (
                <div className="text-center py-16">
                  <Card className="glass-card rounded-3xl border-white/10 max-w-md mx-auto">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-serif text-white mb-4">
                        No services found
                      </h3>
                      <p className="text-white/70 mb-6">
                        No services match the selected category.
                      </p>
                      <Button 
                        onClick={() => setActiveCategory("All")}
                        className="glass-button text-white"
                      >
                        View All Services
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </section>

          {/* Integration Ready Banner */}
          <section className="px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-4xl mx-auto">
              <Card className="glass-card rounded-3xl border-white/10">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-serif font-medium text-white mb-4">
                    Ready for Integration
                  </h2>
                  <p className="text-white/70 mb-6">
                    This services system is clean and ready to be connected to your preferred booking platform.
                  </p>
                  <Button className="glass-button text-white">
                    Configure Integration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Services;