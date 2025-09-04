import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/services");
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="mb-8 inline-flex items-center text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>

            <div className="text-center mb-12">
              <h1 className="text-4xl font-serif font-light text-foreground mb-6">
                Book Service <span className="text-primary">#{serviceId}</span>
              </h1>
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                Service-specific booking system ready for integration with your scheduling platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="card-luxury">
                <CardContent className="p-8">
                  <Calendar className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="text-xl font-serif font-medium mb-3">
                    Date Selection
                  </h3>
                  <p className="text-foreground/70 mb-4">
                    Calendar integration ready for date and time selection
                  </p>
                  <Button variant="outline" className="w-full">
                    Configure Calendar
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-luxury">
                <CardContent className="p-8">
                  <Clock className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="text-xl font-serif font-medium mb-3">
                    Time Slots
                  </h3>
                  <p className="text-foreground/70 mb-4">
                    Available time slot system ready for your scheduling rules
                  </p>
                  <Button variant="outline" className="w-full">
                    Set Time Slots
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="card-luxury">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-serif font-medium mb-4">
                  Ready for Integration
                </h2>
                <p className="text-foreground/70 mb-6">
                  This service booking page is clean and ready to be connected to your preferred booking system.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={handleBack}>
                    Browse Services
                  </Button>
                  <Button className="btn-luxury">
                    Start Integration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default BookService;