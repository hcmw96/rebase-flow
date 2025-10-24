import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ServiceCardProps {
  id: number;
  title: string;
  category: string;
  image?: string;
  className?: string;
  service?: {
    duration?: string;
    price?: number;
    fromPrice?: boolean;
    sessionTypeId?: string | number; // 👈 novo campo
    variants?: Array<{
      duration: string;
      price: number;
      description?: string;
    }>;
  };
}

const ServiceCard = ({ id, title, category, image, className, service }: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    // 🔹 Salva as informações no localStorage
    localStorage.setItem(
      "selectedService",
      JSON.stringify({
        id,
        title,
        price: service?.price,
        duration: service?.duration,
        category,
        sessionTypeId: service?.sessionTypeId,
      }),
    );

    // 🔹 Navega para a página de booking
    navigate(`/book/${id}`);
  };

  const renderPricing = () => {
    if (!service) return null;

    if (service.variants && service.variants.length > 0) {
      return (
        <div className="space-y-3 mb-4">
          {service.variants.map((variant: any, index: number) => (
            <div key={index} className="glass-morphism rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-white font-medium text-sm">{variant.description || variant.name}</span>
                <span className="text-white font-semibold">£{variant.price}</span>
              </div>
              <Button 
                className="w-full glass-button text-white rounded-lg font-medium text-sm py-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  localStorage.setItem(
                    "selectedService",
                    JSON.stringify({
                      id: variant.id,
                      title: variant.name || title,
                      price: variant.price,
                      duration: variant.duration,
                      category,
                      sessionTypeId: variant.sessionTypeId,
                    }),
                  );
                  navigate(`/book/${variant.id}`);
                }}
              >
                Book Now
              </Button>
            </div>
          ))}
        </div>
      );
    }

    if (service.fromPrice) {
      return (
        <div className="text-center mb-4">
          <div className="text-sm text-white/70 mb-1">{service.duration}</div>
          <div className="text-lg font-medium text-white">from £{service.price}</div>
        </div>
      );
    }

    return (
      <div className="text-center mb-4">
        <div className="text-sm text-white/70 mb-1">{service.duration}</div>
        <div className="text-lg font-medium text-white">£{service.price}</div>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "glass-card group hover:scale-105 transition-all duration-300 rounded-3xl border-white/10",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-serif font-medium text-foreground group-hover:text-primary transition-colors text-center">
          {title}
        </CardTitle>
        <div className="flex justify-center">
          <Badge variant="secondary" className="bg-detail/10 text-detail border-detail/20">
            {category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {renderPricing()}
        {(!service?.variants || service.variants.length === 0) && (
          <Button className="w-full glass-button text-white rounded-xl font-medium" onClick={handleBookNow}>
            Book Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
