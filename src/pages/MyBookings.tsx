import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
  const { mbSession, isAuthenticated, login, openMindbodySignUp } = useAuth();
  const { data: bookingsData, isLoading, error } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const bookings = bookingsData?.bookings || [];
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
        bookingId,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const isCancelling = cancelMutation.isPending;

  if (!isAuthenticated) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sign in to view your bookings</p>
        <Button onClick={() => login()} className="w-full">Sign in with Mindbody</Button>
        <Button variant="outline" onClick={openMindbodySignUp} className="w-full">
          Create Mindbody account
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-foreground">Bookings</h1>
          {mbSession && (
            <p className="text-sm text-muted-foreground">
              Welcome back, {mbSession.firstName}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Unable to load your bookings.</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-sm text-muted-foreground">
                  Explore our services to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Upcoming */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcomingBookings.map((booking: any, index: number) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-foreground">{booking.serviceName}</h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(booking.startDateTime), 'EEE, MMM d')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(booking.startDateTime), 'h:mm a')}
                              </span>
                              {booking.staffName && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {booking.staffName}
                                </span>
                              )}
                            </div>
                            {booking.status.toLowerCase() !== 'cancelled' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="self-start">
                                    Cancel Booking
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel? This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
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

            {/* Past */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Past</h2>
                <div className="space-y-3">
                  {pastBookings.slice(0, 5).map((booking: any, index: number) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="opacity-60">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-sm">{booking.serviceName}</h3>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(booking.startDateTime), 'MMM d, yyyy')} · {format(new Date(booking.startDateTime), 'h:mm a')}
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
  );
};

export default MyBookings;
