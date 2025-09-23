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
    variants?: Array<{
      duration: string;
      price: number;
      description?: string;
    }>;
  };
}

const ServiceCard = ({
  id,
  title,
  category,
  image,
  className,
  service
}: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
  const clientId = "f660fd3e-a0d6-4f66-878c-871c9860e565"; // pegue no Mindbody Developer Portal
  const redirectUri = encodeURIComponent("https://rebase.echo.london/services"); // precisa estar registrado no OAuth client
  const scope = encodeURIComponent("email profile openid offline_access Mindbody.Api.Public.v6");
  const nonce = "randomStringSeguro123"; // gere dinamicamente de preferência
  const subscriberId = "f660fd3e-a0d6-4f66-878c-871c9860e565"; // fornecido pela Mindbody

  const authUrl = `https://signin.mindbodyonline.com/connect/authorize?response_mode=form_post&response_type=code%20id_token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&subscriberId=${subscriberId}&nonce=${nonce}`;

  // redireciona o usuário para a tela de login do Mindbody
  window.location.href = authUrl;
};

  const renderPricing = () => {
    if (!service) return null;

    if (service.variants && service.variants.length > 0) {
      return (
        <div className="space-y-2 mb-4">
          {service.variants.map((variant, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-white/70">
                {variant.description ? `${variant.description}` : variant.duration}
              </span>
              <span className="text-white font-medium">£{variant.price}</span>
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
    <Card className={cn("glass-card group hover:scale-105 transition-all duration-300 rounded-3xl border-white/10", className)}>
      
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
        <Button className="w-full glass-button text-white rounded-xl font-medium" onClick={handleBookNow}>
          Book Now
        </Button>
      </CardContent>

    </Card>
  );
};

export default ServiceCard;