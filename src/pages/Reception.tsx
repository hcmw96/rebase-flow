import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CalendarDays, Users, CreditCard, ChevronLeft } from 'lucide-react';

const Reception = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Reception Portal</CardTitle>
              <CardDescription>
                The reception system is being upgraded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-4 text-muted-foreground">
                <CalendarDays className="h-10 w-10" />
                <Users className="h-10 w-10" />
                <CreditCard className="h-10 w-10" />
              </div>
              
              <p className="text-center text-muted-foreground">
                We're implementing a new booking and management system. Please check back soon.
              </p>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Reception;
