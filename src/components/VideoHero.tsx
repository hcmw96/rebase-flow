import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const VideoHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/lovable-uploads/bb145d7a-2d9d-4251-98b9-0b7161b6867b.png')` }}
        />
        <div className="absolute inset-0 bg-black/30 z-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-light text-white mb-8 animate-fade-in">
          <span className="block">Transform Your</span>
          <span className="block text-primary text-glow">Wellness Journey</span>
        </h1>
        
        <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Experience revolutionary wellness technology and personalized treatments at London's most innovative wellness destination.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link to="/services">
            <Button size="lg" className="btn-luxury text-lg px-10 py-6 h-auto">
              Explore Services
            </Button>
          </Link>
          
          <Link to="/auth">
            <Button 
              variant="ghost" 
              size="lg" 
              className="btn-ghost-luxury text-lg px-10 py-6 h-auto"
            >
              Sign In to Book
            </Button>
          </Link>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full animate-float opacity-60" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-accent rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-primary/60 rounded-full animate-float opacity-50" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex flex-col items-center text-white/70">
          <span className="text-sm mb-2 font-light tracking-wide">Discover More</span>
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default VideoHero;