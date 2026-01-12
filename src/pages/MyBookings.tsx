import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, User, Plus, ArrowRight } from 'lucide-react';
import { useMindbody } from '@/contexts/MindbodyContext';
import { useMyBookings, useCancelBooking } from '@/hooks/useMindbodyBookings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MyBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, session } = useMindbody();
  const { data: bookingsData, isLoading, error } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const bookings = bookingsData?.bookings || [];

  // Split into upcoming and past
  const now = new Date();
  const upcomingBookings = bookings.filter((b: any) => new Date(b.startDateTime) >= now);
  const pastBookings = bookings.filter((b: any) => new Date(b.startDateTime) < now);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-primary/10 text-primary">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCancel = async (bookingId: string, bookingType: string) => {
    try {
      await cancelMutation.mutateAsync({ 
        bookingType: bookingType as 'class' | 'appointment', 
        bookingId 
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const isCancelling = cancelMutation.isPending;

  const handleLogin = () => {
    const redirectUri = `${window.location.origin}/my-bookings`;
    login(redirectUri);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center space-y-6">
                <div className="flex justify-center">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-foreground">
                    View Your Bookings
                  </h1>
                  <p className="text-muted-foreground">
                    Log in with your Mindbody account to view and manage your appointments.
                  </p>
                </div>
                
                <Button onClick={handleLogin} className="w-full">
                  Login with Mindbody
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  My Bookings
                </h1>
                {session && (
                  <p className="text-muted-foreground">
                    Welcome back, {session.firstName}
                  </p>
                )}
              </div>
              <Button onClick={() => navigate('/services')}>
                <Plus className="h-4 w-4 mr-2" />
                Book New
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-1/3" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Unable to load your bookings.</p>
                  <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center space-y-4">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground">
                      You haven't made any bookings. Explore our services to get started.
                    </p>
                  </div>
                  <Button onClick={() => navigate('/services')}>
                    Browse Services
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
                    <div className="space-y-4">
                      {upcomingBookings.map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg">
                                      {booking.serviceName}
                                    </h3>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      {format(new Date(booking.startDateTime), 'EEEE, MMMM d, yyyy')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      {format(new Date(booking.startDateTime), 'h:mm a')}
                                    </div>
                                    {booking.staffName && (
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {booking.staffName}
                                      </div>
                                    )}
                                    {booking.locationName && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {booking.locationName}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {booking.status.toLowerCase() !== 'cancelled' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Cancel
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to cancel this booking? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleCancel(booking.id, booking.bookingType)}
                                          disabled={isCancelling}
                                        >
                                          {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Past</h2>
                    <div className="space-y-4">
                      {pastBookings.slice(0, 5).map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="opacity-70">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h3 className="font-medium">{booking.serviceName}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(booking.startDateTime), 'MMMM d, yyyy')} at {format(new Date(booking.startDateTime), 'h:mm a')}
                                  </p>
                                </div>
                                {getStatusBadge(booking.status)}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyBookings;
