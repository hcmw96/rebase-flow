import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const featuredServices = [
    {
      title: "Contrast Therapy",
      description: "Experience the powerful combination of heat and cold therapy in our luxury private suites.",
      benefits: ["Reduced inflammation", "Improved circulation", "Enhanced recovery", "Stress relief"],
      category: "Recovery",
      duration: "60 min",
      price: "From £120"
    },
    {
      title: "Cryotherapy",
      description: "Whole-body cryotherapy at -110°C for ultimate recovery and wellness benefits.",
      benefits: ["Boost endorphins", "Reduce inflammation", "Antidepressant effects", "Muscle recovery"],
      category: "Recovery",
      duration: "3 min",
      price: "From £45"
    },
    {
      title: "Breathwork Classes",
      description: "Learn conscious breathing techniques to enhance your physical and mental wellbeing.",
      benefits: ["Reduces stress", "Improves sleep", "Increases energy", "Releases toxins"],
      category: "Mindfulness",
      duration: "45 min",
      price: "From £35"
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      
      {/* Featured Services */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-light text-foreground mb-4">
              Featured <span className="text-primary">Experiences</span>
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Discover our most popular wellness treatments designed to elevate your physical and mental wellbeing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredServices.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/services">
              <Button size="lg" className="btn-luxury">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-serif font-light text-foreground">
                London's Premier <span className="text-primary">Wellness Destination</span>
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed">
                At Rebase Recovery, we offer a comprehensive approach to wellness through cutting-edge recovery modalities, 
                ancient practices, and expert guidance. Our state-of-the-art facility provides a sanctuary for those seeking 
                to optimize their health and wellbeing.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">12+</div>
                  <div className="text-sm text-foreground/60">Treatment Types</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">5000+</div>
                  <div className="text-sm text-foreground/60">Happy Clients</div>
                </div>
              </div>
              <Link to="/about">
                <Button variant="outline" className="btn-ghost-luxury">
                  Learn More About Us
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="card-luxury p-8 text-center">
                <h3 className="text-2xl font-serif font-medium text-foreground mb-4">
                  Book Your Experience
                </h3>
                <p className="text-foreground/70 mb-6">
                  Ready to begin your wellness journey? Book your first session with our expert team.
                </p>
                <Link to="/book">
                  <Button className="w-full btn-luxury">
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
