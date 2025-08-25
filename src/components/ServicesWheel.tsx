import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import cryotherapyImg from '@/assets/cryotherapy.jpg';
import redLightTherapyImg from '@/assets/red-light-therapy.jpg';
import ivTherapyImg from '@/assets/iv-therapy.jpg';
import hyperbaricOxygenImg from '@/assets/hyperbaric-oxygen.jpg';
import saltTherapyImg from '@/assets/salt-therapy.jpg';
import wellnessSuitesImg from '@/assets/wellness-suites.jpg';

const services = [
  { 
    name: "Cryotherapy", 
    image: cryotherapyImg,
    description: "Experience the power of cold therapy for recovery and wellness",
    benefits: ["Reduce inflammation", "Boost energy", "Improve recovery"]
  },
  { 
    name: "Red Light Therapy", 
    image: redLightTherapyImg,
    description: "Harness the healing power of red light for cellular regeneration",
    benefits: ["Improve skin health", "Reduce pain", "Enhance healing"]
  },
  { 
    name: "IV Therapy", 
    image: ivTherapyImg,
    description: "Direct nutrient delivery for optimal health and vitality",
    benefits: ["Instant hydration", "Boost immunity", "Increase energy"]
  },
  { 
    name: "Hyperbaric Oxygen", 
    image: hyperbaricOxygenImg,
    description: "Enhanced oxygen therapy for accelerated healing",
    benefits: ["Faster recovery", "Improve circulation", "Boost cognitive function"]
  },
  { 
    name: "Salt Therapy", 
    image: saltTherapyImg,
    description: "Natural halotherapy for respiratory and skin wellness",
    benefits: ["Clear airways", "Improve skin", "Reduce stress"]
  },
  { 
    name: "Wellness Suites", 
    image: wellnessSuitesImg,
    description: "Private luxury spaces for personalized recovery",
    benefits: ["Complete privacy", "Customized treatments", "Premium comfort"]
  },
];

const ServicesWheel = () => {
  const [currentService, setCurrentService] = useState(0);

  const nextService = () => {
    setCurrentService((prev) => (prev + 1) % services.length);
  };

  const prevService = () => {
    setCurrentService((prev) => (prev - 1 + services.length) % services.length);
  };

  useEffect(() => {
    const interval = setInterval(nextService, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentServiceData = services[currentService];

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{ backgroundImage: `url(${currentServiceData.image})` }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevService}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-10 glass-button p-3 rounded-full hover:scale-110 transition-all duration-300"
        aria-label="Previous service"
      >
        <ChevronLeft className="w-8 h-8 text-white" />
      </button>

      <button 
        onClick={nextService}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-10 glass-button p-3 rounded-full hover:scale-110 transition-all duration-300"
        aria-label="Next service"
      >
        <ChevronRight className="w-8 h-8 text-white" />
      </button>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-8">
        {/* Service Title */}
        <h2 className="text-6xl md:text-7xl lg:text-8xl font-light text-white mb-6 animate-fade-in">
          {currentServiceData.name}
        </h2>

        {/* Service Description */}
        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mb-8 animate-fade-in">
          {currentServiceData.description}
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in">
          {currentServiceData.benefits.map((benefit, index) => (
            <span 
              key={index}
              className="glass-morphism px-4 py-2 rounded-full text-white/80 text-sm"
            >
              {benefit}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 animate-fade-in">
          <Link to="/services">
            <Button className="btn-luxury px-8 py-4 text-lg">
              Learn More
            </Button>
          </Link>
          <Link to="/book">
            <Button variant="outline" className="btn-ghost-luxury px-8 py-4 text-lg">
              Book Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Service Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {services.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentService(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentService 
                ? 'bg-white scale-125' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to service ${index + 1}`}
          />
        ))}
      </div>

      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
    </section>
  );
};

export default ServicesWheel;