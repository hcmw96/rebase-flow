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
}

const ServiceCard = ({
  id,
  title,
  category,
  image,
  className
}: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate(`/book/${id}`);
  };
  return (
    <Card className={cn("glass-card group hover:scale-105 transition-all duration-300 rounded-3xl border-white/10", className)}>
      
      <CardHeader className="pb-6">
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
        <Button className="w-full glass-button text-white rounded-xl font-medium" onClick={handleBookNow}>
          Book Now
        </Button>
      </CardContent>

    </Card>
  );
};

export default ServiceCard;