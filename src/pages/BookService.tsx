import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BookingCalendar from '@/components/booking/BookingCalendar';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import BookingSteps from '@/components/booking/BookingSteps';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, User, CheckCircle, Loader2 } from 'lucide-react';
import { useMindbodyAvailability, AvailableItem } from '@/hooks/useMindbodyServices';
import { useMindbody } from '@/contexts/MindbodyContext';
import { useBookService } from '@/hooks/useMindbodyBookings';
import { toast } from 'sonner';

interface StoredService {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: string;
  category: string;
  image: string;
}

const steps = [
  { id: 1, label: 'Date' },
  { id: 2, label: 'Time' },
  { id: 3, label: 'Confirm' },
];

const BookService = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { session, isAuthenticated, login } = useMindbody();
  const bookServiceMutation = useBookService();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<AvailableItem | null>(null);
  const [service, setService] = useState<StoredService | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Load service from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('selectedService');
    if (stored) {
      setService(JSON.parse(stored));
    }
  }, [serviceId]);

  // Date range for availability query
  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    return {
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      endDate: format(addDays(selectedDate, 1), 'yyyy-MM-dd'),
    };
  }, [selectedDate]);

  // Fetch availability for selected date
  const { data: availabilityData, isLoading: isLoadingSlots } = useMindbodyAvailability({
    sessionTypeId: serviceId || '',
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
    enabled: !!serviceId && !!selectedDate,
  });

  const availableSlots = availabilityData?.availableItems || [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      setCurrentStep(2);
    }
  };

  const handleSlotSelect = (slot: AvailableItem) => {
    setSelectedSlot(slot);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/services');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && selectedSlot) {
      setCurrentStep(3);
    }
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      // Store booking intent and redirect to login
      localStorage.setItem('bookingIntent', JSON.stringify({
        serviceId,
        selectedDate: selectedDate?.toISOString(),
        selectedSlot,
      }));
      const redirectUri = `${window.location.origin}/book/${serviceId}`;
      login(redirectUri);
      return;
    }

    if (!selectedSlot || !session) return;

    try {
      await bookServiceMutation.mutateAsync({
        bookingType: 'appointment',
        sessionTypeId: selectedSlot.sessionTypeId.toString(),
        staffId: selectedSlot.staffId.toString(),
        locationId: selectedSlot.locationId,
        startDateTime: selectedSlot.startDateTime,
        serviceName: service?.title,
      });
      setBookingComplete(true);
      toast.success('Booking confirmed!');
    } catch (error) {
      toast.error('Failed to complete booking. Please try again.');
    }
  };

  const isBooking = bookServiceMutation.isPending;

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">Service not found.</p>
                <Button onClick={() => navigate('/services')} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Services
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (bookingComplete && selectedSlot) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="max-w-md w-full">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                      Booking Confirmed!
                    </h1>
                    <p className="text-muted-foreground">
                      Your appointment has been booked successfully.
                    </p>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(selectedSlot.startDateTime), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(selectedSlot.startDateTime), 'h:mm a')}</span>
                    </div>
                    {selectedSlot.staffName && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedSlot.staffName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSlot.locationName}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => navigate('/my-bookings')}>
                      View My Bookings
                    </Button>
                    <Button onClick={() => navigate('/services')} variant="outline">
                      Book Another Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
          <div className="max-w-3xl mx-auto mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Back to Services' : 'Back'}
            </Button>

            <div className="flex items-start gap-6 mb-8">
              <img
                src={service.image}
                alt={service.title}
                className="w-24 h-24 rounded-lg object-cover hidden sm:block"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Book {service.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {service.duration}
                  </span>
                  <span className="font-medium text-foreground">{service.price}</span>
                </div>
              </div>
            </div>

            <BookingSteps steps={steps} currentStep={currentStep} className="mb-8" />
          </div>

          {/* Step Content */}
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Select a Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <BookingCalendar
                          selectedDate={selectedDate}
                          onSelect={handleDateSelect}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Select a Time
                        {selectedDate && (
                          <span className="text-muted-foreground font-normal text-base ml-2">
                            — {format(selectedDate, 'EEEE, MMMM d')}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeSlotPicker
                        slots={availableSlots}
                        selectedSlot={selectedSlot}
                        onSelect={handleSlotSelect}
                        isLoading={isLoadingSlots}
                      />
                      
                      {selectedSlot && (
                        <div className="mt-6 flex justify-end">
                          <Button onClick={handleNext}>
                            Continue
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {currentStep === 3 && selectedSlot && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Confirm Your Booking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Booking Summary */}
                      <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
                        <h3 className="font-semibold text-lg">{service.title}</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-medium">
                                {format(new Date(selectedSlot.startDateTime), 'EEEE, MMMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Time</p>
                              <p className="font-medium">
                                {format(new Date(selectedSlot.startDateTime), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                          
                          {selectedSlot.staffName && (
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">Staff</p>
                                <p className="font-medium">{selectedSlot.staffName}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p className="font-medium">{selectedSlot.locationName}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Duration</span>
                            <span>{service.duration}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-muted-foreground">Price</span>
                            <span className="font-semibold text-lg">{service.price}</span>
                          </div>
                        </div>
                      </div>

                      {/* Login Notice */}
                      {!isAuthenticated && (
                        <div className="bg-accent/50 rounded-lg p-4 text-sm">
                          <p className="text-muted-foreground">
                            You'll need to log in with your Mindbody account to complete this booking.
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(2)}
                          className="sm:flex-1"
                        >
                          Change Time
                        </Button>
                        <Button
                          onClick={handleConfirmBooking}
                          disabled={isBooking}
                          className="sm:flex-1"
                        >
                          {isBooking ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Booking...
                            </>
                          ) : isAuthenticated ? (
                            'Confirm Booking'
                          ) : (
                            'Login & Confirm'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookService;
