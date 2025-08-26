import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import cryotherapyImg from '@/assets/cryotherapy.jpg';
import saltTherapyImg from '@/assets/salt-therapy.jpg';
import wellnessSuitesImg from '@/assets/wellness-suites.jpg';

const services = [
  { 
    name: "Contrast Therapy", 
    image: cryotherapyImg,
    description: "Hot and cold therapy for optimal recovery and wellness",
    benefits: ["Reduce inflammation", "Boost circulation", "Improve recovery"]
  },
  { 
    name: "Premium Suite", 
    image: wellnessSuitesImg,
    description: "Private luxury spaces for personalized recovery",
    benefits: ["Complete privacy", "Customized treatments", "Premium comfort"]
  },
  { 
    name: "Sports Massage", 
    image: saltTherapyImg,
    description: "Professional therapeutic massage for recovery and relaxation",
    benefits: ["Relieve tension", "Improve mobility", "Reduce pain"]
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

  const currentServiceData = services[currentService];

  return (
    <section className="py-20 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-black rounded-3xl p-8 md:p-12 overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 transition-all duration-1000"
            style={{ backgroundImage: `url(${currentServiceData.image})` }}
          />

          {/* Navigation Arrows */}
          <button 
            onClick={prevService}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 glass-button p-3 rounded-full hover:scale-110 transition-all duration-300"
            aria-label="Previous service"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button 
            onClick={nextService}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 glass-button p-3 rounded-full hover:scale-110 transition-all duration-300"
            aria-label="Next service"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div className="relative z-10 text-center py-12">
            {/* Service Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 animate-fade-in">
              {currentServiceData.name}
            </h2>

            {/* Service Description */}
            <p className="text-lg md:text-xl text-white/90 mb-8 animate-fade-in max-w-2xl mx-auto">
              {currentServiceData.description}
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link to="/services">
                <Button className="btn-luxury px-6 py-3">
                  Learn More
                </Button>
              </Link>
              <Link to="/book">
                <Button variant="outline" className="btn-ghost-luxury px-6 py-3">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Service Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
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
        </div>
      </div>
    </section>
  );
};

export default ServicesWheel;