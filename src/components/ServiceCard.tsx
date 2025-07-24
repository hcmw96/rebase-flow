import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  description: string;
  benefits: string[];
  category: string;
  duration?: string;
  price?: string;
  image?: string;
  className?: string;
}

const ServiceCard = ({
  title,
  description,
  benefits,
  category,
  duration,
  price,
  image,
  className
}: ServiceCardProps) => {
  return (
    <Card className={cn("card-luxury group hover:scale-105 transition-all duration-300", className)}>
      {image && (
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {category}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-serif font-medium text-foreground group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          {price && (
            <div className="text-right">
              <div className="text-lg font-semibold text-primary">{price}</div>
              {duration && <div className="text-sm text-muted-foreground">{duration}</div>}
            </div>
          )}
        </div>
        <CardDescription className="text-foreground/70 leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Key Benefits:</h4>
            <ul className="space-y-1">
              {benefits.slice(0, 3).map((benefit, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0"></div>
                  {benefit}
                </li>
              ))}
              {benefits.length > 3 && (
                <li className="text-sm text-primary">
                  +{benefits.length - 3} more benefits
                </li>
              )}
            </ul>
          </div>
          
          <Button className="w-full btn-luxury group-hover:shadow-gold">
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;