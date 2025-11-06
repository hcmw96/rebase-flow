import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroVideo from "@/assets/herobase.mp4";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-12 tracking-wider uppercase animate-fade-in">
          Elevate Your Wellness
        </h1>
        
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button 
            variant="outline" 
            size="lg" 
            className="glass-button text-white text-base px-12 py-6 border-white/30 hover:bg-white/10 uppercase tracking-widest"
            onClick={() => {
              document.getElementById('most-popular')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Book Now
          </Button>
        </div>
      </div>

    </section>
  );
};

export default Hero;