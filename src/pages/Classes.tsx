import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SignOutButton from '@/components/SignOutButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Users, MapPin, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MbClass {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  location_id: number | null;
  total_booked: number | null;
  capacity: number | null;
  is_cancelled: boolean;
  instructor?: string;
  description?: string;
}

const Classes = () => {
  const [classes, setClasses] = useState<MbClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        // Check connection status
        const connectionResponse = await supabase.functions.invoke('mb-connected');
        setConnected(connectionResponse.data?.connected || false);

        // Fetch classes from edge function
        const classesResponse = await supabase.functions.invoke('classes-public');
        
        if (classesResponse.data?.rows) {
          setClasses(classesResponse.data.rows);
        } else if (classesResponse.error) {
          setError('Failed to load classes');
        }
      } catch (err) {
        console.error('Error loading classes:', err);
        setError('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const bookClass = async (cls: MbClass) => {
    if (!connected) {
      toast({
        title: "MINDBODY not connected",
        description: "Please connect your MINDBODY account in Integrations first",
        variant: "destructive"
      });
      return;
    }

    setError(null);
    setBookingId(cls.id);

    try {
      const response = await supabase.functions.invoke('mb-book-class', {
        body: { classId: cls.id }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast({
          title: "Class booked! 🎉",
          description: `Successfully booked ${cls.name}`,
        });
        
        // Refresh classes to show updated booking count
        const classesResponse = await supabase.functions.invoke('classes-public');
        if (classesResponse.data?.rows) {
          setClasses(classesResponse.data.rows);
        }
      } else {
        throw new Error(response.data?.error || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Booking failed';
      setError(errorMessage);
      toast({
        title: "Booking failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setBookingId(null);
    }
  };

  const refreshClasses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await supabase.functions.invoke('mb-sync-classes');
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Refresh the classes list
      const classesResponse = await supabase.functions.invoke('classes-public');
      if (classesResponse.data?.rows) {
        setClasses(classesResponse.data.rows);
      }
      
      toast({
        title: "Classes updated",
        description: "Latest class information has been loaded"
      });
    } catch (err) {
      console.error('Sync error:', err);
      toast({
        title: "Sync failed",
        description: "Failed to sync latest classes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20">
          <div className="max-w-4xl mx-auto px-4 py-20">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading classes...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-serif font-light text-foreground mb-4">
                  <span className="text-primary">Classes</span>
                </h1>
                <p className="text-lg text-foreground/70">
                  Browse and book available wellness classes
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={refreshClasses} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Refresh
                </Button>
                <SignOutButton />
              </div>
            </div>

            {/* Connection Status Alert */}
            {!connected && (
              <Alert className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect MINDBODY in{' '}
                  <a href="/integrations" className="underline font-medium">
                    Integrations
                  </a>{' '}
                  before booking classes.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Classes Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => {
                const startTime = new Date(cls.start_time);
                const endTime = new Date(cls.end_time);
                const spotsLeft = (cls.capacity || 0) - (cls.total_booked || 0);
                const isBooking = bookingId === cls.id;
                const canBook = connected && !cls.is_cancelled && spotsLeft > 0;

                return (
                  <Card key={cls.id} className="card-luxury">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg font-serif">
                          {cls.name || 'Class'}
                        </CardTitle>
                        {cls.is_cancelled ? (
                          <Badge variant="destructive">Cancelled</Badge>
                        ) : spotsLeft <= 0 ? (
                          <Badge variant="secondary">Full</Badge>
                        ) : (
                          <Badge variant="default">{spotsLeft} spots left</Badge>
                        )}
                      </div>
                      
                      {cls.description && (
                        <p className="text-sm text-muted-foreground">
                          {cls.description}
                        </p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(startTime, 'EEEE, MMMM d')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {cls.total_booked || 0}/{cls.capacity || '?'} booked
                          </span>
                        </div>

                        {cls.instructor && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Instructor:</span>
                            <span className="font-medium">{cls.instructor}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        className="w-full"
                        disabled={!canBook || isBooking}
                        onClick={() => bookClass(cls)}
                        variant={canBook ? "default" : "secondary"}
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Booking...
                          </>
                        ) : cls.is_cancelled ? (
                          'Cancelled'
                        ) : spotsLeft <= 0 ? (
                          'Class Full'
                        ) : !connected ? (
                          'Connect MINDBODY to Book'
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Book Class
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {classes.length === 0 && !loading && (
              <div className="text-center py-16">
                <Card className="max-w-md mx-auto">
                  <CardContent className="py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No classes available</h3>
                    <p className="text-muted-foreground mb-6">
                      {connected 
                        ? "There are no classes scheduled at the moment. Check back later!"
                        : "Connect your MINDBODY account to view available classes."
                      }
                    </p>
                    {!connected ? (
                      <Button asChild>
                        <a href="/integrations">Connect MINDBODY</a>
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={refreshClasses}>
                        Refresh Classes
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Classes;