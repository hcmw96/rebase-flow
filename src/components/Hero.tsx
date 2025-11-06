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
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-foreground mb-6 animate-fade-in">
          <span className="block">Elevate</span>
          <span className="block text-primary text-glow">Your Wellness</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Experience a novel approach to lasting wellbeing at Rebase, London's premier home of social wellness.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link to="/book">
            <Button size="lg" className="btn-luxury text-lg px-8 py-4">
              Book Your Experience
            </Button>
          </Link>
          <Link to="/services">
            <Button 
              variant="outline" 
              size="lg" 
              className="btn-ghost-luxury text-lg px-8 py-4"
            >
              Explore Services
            </Button>
          </Link>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/60 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

    </section>
  );
};

export default Hero;