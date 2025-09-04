import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoHero from "@/components/VideoHero";
import ServicesWheel from "@/components/ServicesWheel";
import EcodrivePartnership from "@/components/EcodrivePartnership";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Settings, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <VideoHero />
      
      {/* Quick Access Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-light text-foreground mb-6">
            Your Wellness <span className="text-primary">Journey</span>
          </h2>
          <p className="text-lg text-foreground/70 mb-12">
            Access all your wellness needs in one place
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="card-luxury">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-serif font-medium mb-3">Browse Classes</h3>
                <p className="text-foreground/70 mb-4">
                  Discover and book wellness classes that fit your schedule
                </p>
                <Button asChild className="w-full">
                  <Link to="/classes">
                    View Classes
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-luxury">
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-serif font-medium mb-3">Integrations</h3>
                <p className="text-foreground/70 mb-4">
                  Connect your MINDBODY account for seamless booking
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/integrations">
                    Manage Integrations
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-luxury">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-serif font-medium mb-3">Services</h3>
                <p className="text-foreground/70 mb-4">
                  Explore our full range of wellness services and treatments
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/services">
                    Browse Services
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <ServicesWheel />
      <EcodrivePartnership />
      <Footer />
    </div>
  );
};

export default Landing;