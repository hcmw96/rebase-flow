import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';

const BookService = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center gap-4 text-muted-foreground">
                <Calendar className="h-12 w-12" />
                <Clock className="h-12 w-12" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Booking Coming Soon
                </h1>
                <p className="text-muted-foreground">
                  We're upgrading our booking system to provide you with a better experience.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/services')}
                variant="outline"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Services
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookService;
