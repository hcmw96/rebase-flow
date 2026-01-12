import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: string;
  category: string;
  image: string;
}

const ServiceCard = ({
  id,
  title,
  description,
  duration,
  price,
  category,
  image,
}: ServiceCardProps) => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    // Store service data for the booking page
    localStorage.setItem('selectedService', JSON.stringify({
      id,
      title,
      description,
      duration,
      price,
      category,
      image,
    }));
    navigate(`/book/${id}`);
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <Badge className="absolute top-4 left-4 bg-background/90 text-foreground">
          {category}
        </Badge>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {description}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {duration}
            </span>
            <span className="font-semibold text-foreground">
              {price}
            </span>
          </div>
          
          <Button onClick={handleBookNow} size="sm">
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
