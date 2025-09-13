import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Cryotherapy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(/lovable-uploads/eacb5724-5ff4-4a7e-9e11-224717628e17.png)` }}
        >
          <div className="absolute inset-0 bg-background/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-foreground mb-6 animate-fade-in">
            <span className="block">Whole Body</span>
            <span className="block text-primary text-glow">Cryotherapy</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Experience the transformative power of cold therapy. Boost recovery, reduce inflammation, and enhance your wellbeing in our state-of-the-art cryotherapy chambers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/book">
              <Button size="lg" className="btn-luxury text-lg px-8 py-4">
                Book Your Session
              </Button>
            </Link>
            <Link to="/services">
              <Button 
                variant="outline" 
                size="lg" 
                className="btn-ghost-luxury text-lg px-8 py-4"
              >
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl lg:text-5xl text-center mb-16 text-foreground">
            Benefits of Cryotherapy
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 glass-card rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-primary">Enhanced Recovery</h3>
              <p className="text-foreground/80 leading-relaxed">
                Accelerate muscle recovery and reduce post-workout soreness with targeted cold therapy.
              </p>
            </div>
            
            <div className="text-center p-6 glass-card rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-primary">Reduced Inflammation</h3>
              <p className="text-foreground/80 leading-relaxed">
                Natural anti-inflammatory effects help manage chronic pain and improve joint mobility.
              </p>
            </div>
            
            <div className="text-center p-6 glass-card rounded-xl">
              <h3 className="font-serif text-2xl mb-4 text-primary">Mental Clarity</h3>
              <p className="text-foreground/80 leading-relaxed">
                Cold exposure triggers endorphin release, improving mood and mental focus.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cryotherapy;