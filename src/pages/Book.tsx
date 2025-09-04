import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";

const Book = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-serif font-light text-foreground mb-6">
              Book Your <span className="text-primary">Experience</span>
            </h1>
            <p className="text-lg text-foreground/70 mb-12 max-w-2xl mx-auto">
              Ready to integrate with your booking system. Choose your preferred integration method below.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="card-luxury">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-serif font-medium mb-3">Schedule</h3>
                  <p className="text-foreground/70 mb-4">
                    Flexible scheduling system ready for your calendar integration
                  </p>
                  <Button variant="outline" className="w-full">
                    Configure Calendar
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-luxury">
                <CardContent className="p-6 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-serif font-medium mb-3">Services</h3>
                  <p className="text-foreground/70 mb-4">
                    Service management system ready for your offerings
                  </p>
                  <Button variant="outline" className="w-full">
                    Manage Services
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-luxury">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-serif font-medium mb-3">Availability</h3>
                  <p className="text-foreground/70 mb-4">
                    Time slot management ready for your availability rules
                  </p>
                  <Button variant="outline" className="w-full">
                    Set Availability
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="bg-primary/10 rounded-2xl p-8">
              <h2 className="text-2xl font-serif font-medium mb-4">
                Integration Ready
              </h2>
              <p className="text-foreground/70 mb-6">
                This booking system is now clean and ready for your preferred booking platform integration.
              </p>
              <Button className="btn-luxury">
                Start Integration
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Book;