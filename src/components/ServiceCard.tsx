import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  category: string;
  image?: string;
  className?: string;
}

const ServiceCard = ({
  title,
  category,
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
            <Badge variant="secondary" className="bg-detail/10 text-detail border-detail/20">
              {category}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-serif font-medium text-foreground group-hover:text-primary transition-colors text-center">
          {title}
        </CardTitle>
        {!image && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-detail/10 text-detail border-detail/20">
              {category}
            </Badge>
          </div>
        )}
      </CardHeader>

    </Card>
  );
};

export default ServiceCard;