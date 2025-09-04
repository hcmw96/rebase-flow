import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BookingForm from "@/components/BookingForm";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/services");
  };

  const services = [
    { id: 1, title: "Ice Baths", price: 35, duration: "3-5 minutes" },
    { id: 2, title: "Yoga", price: 25, duration: "60 minutes" },
    { id: 3, title: "Traditional Saunas", price: 30, duration: "20-30 minutes" },
    { id: 4, title: "Hyperbaric Oxygen", price: 75, duration: "60-90 minutes" },
    { id: 5, title: "Infrared Saunas", price: 35, duration: "30-40 minutes" },
    { id: 6, title: "Cryotherapy", price: 40, duration: "2-3 minutes" },
    { id: 7, title: "Contrast Classes", price: 45, duration: "45 minutes" },
    { id: 8, title: "Vitamin Infusions", price: 85, duration: "30-45 minutes" },
    { id: 9, title: "Contrast Suites", price: 65, duration: "30-60 minutes" },
    { id: 10, title: "Lymphatic Drainage", price: 80, duration: "60 minutes" },
    { id: 11, title: "Breathwork", price: 30, duration: "45-60 minutes" },
    { id: 12, title: "Recovery Specialists", price: 95, duration: "30-60 minutes" }
  ];

  const service = services.find(s => s.id === parseInt(serviceId || "1"));

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
                Book <span className="text-primary">{service?.title || "Service"}</span>
              </h1>
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                {service ? `${service.duration} • £${service.price}` : "Service not found"}
              </p>
            </div>

            {service ? (
              <BookingForm service={service} />
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground/70 mb-6">Service not found</p>
                <Button onClick={handleBack}>Browse Services</Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default BookService;