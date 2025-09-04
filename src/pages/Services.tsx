import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ServiceItem {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: number;
  benefits: string[];
}

const Services = () => {
  const navigate = useNavigate();
  
  const services: ServiceItem[] = [
    {
      id: 1,
      title: "ICE BATHS",
      description: "Therapeutic cold water immersion for enhanced recovery and mental resilience",
      duration: "3-5 minutes",
      price: 35,
      benefits: ["Reduced inflammation", "Enhanced recovery", "Improved circulation", "Mental resilience"]
    },
    {
      id: 2,
      title: "YOGA",
      description: "Mindful movement and breath work for flexibility and inner balance",
      duration: "60 minutes",
      price: 25,
      benefits: ["Increased flexibility", "Stress reduction", "Mind-body connection", "Enhanced strength"]
    },
    {
      id: 3,
      title: "TRADITIONAL SAUNAS",
      description: "Classic dry heat therapy for deep relaxation and detoxification",
      duration: "20-30 minutes",
      price: 30,
      benefits: ["Deep detoxification", "Muscle relaxation", "Improved cardiovascular health", "Stress relief"]
    },
    {
      id: 4,
      title: "HYPERBARIC OXYGEN",
      description: "Pressurized oxygen therapy for enhanced healing and performance",
      duration: "60-90 minutes",
      price: 75,
      benefits: ["Enhanced healing", "Increased oxygen levels", "Improved cognitive function", "Anti-aging benefits"]
    },
    {
      id: 5,
      title: "INFRARED SAUNAS",
      description: "Gentle heat therapy using infrared technology for deep tissue warming",
      duration: "30-40 minutes",
      price: 35,
      benefits: ["Deep tissue warming", "Pain relief", "Improved circulation", "Skin health"]
    },
    {
      id: 6,
      title: "CRYOTHERAPY",
      description: "Whole body cooling therapy for rapid recovery and rejuvenation",
      duration: "2-3 minutes",
      price: 40,
      benefits: ["Rapid recovery", "Increased energy", "Reduced muscle soreness", "Boosted metabolism"]
    },
    {
      id: 7,
      title: "CONTRAST CLASSES",
      description: "Alternating hot and cold therapy sessions in guided group settings",
      duration: "45 minutes",
      price: 45,
      benefits: ["Enhanced circulation", "Community support", "Guided instruction", "Optimal timing"]
    },
    {
      id: 8,
      title: "VITAMIN INFUSIONS",
      description: "Customized IV vitamin therapy for optimal nutrient absorption",
      duration: "30-45 minutes",
      price: 85,
      benefits: ["Direct nutrient delivery", "Enhanced immunity", "Increased energy", "Customized formulations"]
    },
    {
      id: 9,
      title: "CONTRAST SUITES",
      description: "Private hot and cold therapy suites for personalized contrast therapy",
      duration: "30-60 minutes",
      price: 65,
      benefits: ["Private setting", "Flexible timing", "Personalized experience", "Enhanced privacy"]
    },
    {
      id: 10,
      title: "LYMPHATIC DRAINAGE",
      description: "Gentle massage therapy to promote lymphatic system function",
      duration: "60 minutes",
      price: 80,
      benefits: ["Detoxification support", "Reduced swelling", "Improved immunity", "Relaxation"]
    },
    {
      id: 11,
      title: "BREATHWORK",
      description: "Guided breathing techniques for stress reduction and mental clarity",
      duration: "45-60 minutes",
      price: 30,
      benefits: ["Stress reduction", "Mental clarity", "Emotional balance", "Increased focus"]
    },
    {
      id: 12,
      title: "RECOVERY SPECIALISTS",
      description: "One-on-one consultation with certified recovery specialists",
      duration: "30-60 minutes",
      price: 95,
      benefits: ["Personalized guidance", "Expert assessment", "Customized protocols", "Ongoing support"]
    }
  ];

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
                Discover our comprehensive range of wellness and recovery services, 
                designed to optimize your health and performance.
              </p>
            </div>
          </section>

          {/* Services Accordion */}
          <section className="px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-4">
                  <Accordion type="single" collapsible className="space-y-4">
                    {services.slice(0, 6).map((service) => (
                      <AccordionItem key={service.id} value={`service-${service.id}`} className="glass-card border-white/10 rounded-xl px-6">
                        <AccordionTrigger className="text-left hover:no-underline py-6">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-lg font-light text-white tracking-wide">
                              {service.title}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-white/70 leading-relaxed">
                              {service.description}
                            </p>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-white/60">{service.duration}</span>
                              <span className="text-white font-medium">£{service.price}</span>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-white">Benefits:</h4>
                              <div className="grid grid-cols-2 gap-1 text-xs text-white/60">
                                {service.benefits.map((benefit, index) => (
                                  <span key={index}>• {benefit}</span>
                                ))}
                              </div>
                            </div>
                            <Button 
                              className="w-full mt-4 glass-button text-white"
                              onClick={() => navigate(`/book/${service.id}`)}
                            >
                              Book Now
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <Accordion type="single" collapsible className="space-y-4">
                    {services.slice(6, 12).map((service) => (
                      <AccordionItem key={service.id} value={`service-${service.id}`} className="glass-card border-white/10 rounded-xl px-6">
                        <AccordionTrigger className="text-left hover:no-underline py-6">
                          <div className="flex justify-between items-center w-full">
                            <span className="text-lg font-light text-white tracking-wide">
                              {service.title}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-white/70 leading-relaxed">
                              {service.description}
                            </p>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-white/60">{service.duration}</span>
                              <span className="text-white font-medium">£{service.price}</span>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-white">Benefits:</h4>
                              <div className="grid grid-cols-2 gap-1 text-xs text-white/60">
                                {service.benefits.map((benefit, index) => (
                                  <span key={index}>• {benefit}</span>
                                ))}
                              </div>
                            </div>
                            <Button 
                              className="w-full mt-4 glass-button text-white"
                              onClick={() => navigate(`/book/${service.id}`)}
                            >
                              Book Now
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </section>

          {/* Integration Ready Banner */}
          <section className="px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-4xl mx-auto">
              <Card className="glass-card rounded-3xl border-white/10">
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-serif font-medium text-white mb-4">
                    Ready for Integration
                  </h2>
                  <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                    Our services platform is designed to integrate seamlessly with your existing booking 
                    and management systems. Get started with configuration today.
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