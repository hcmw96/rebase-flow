import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookingCalendar from '@/components/booking/BookingCalendar';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import BookingSteps from '@/components/booking/BookingSteps';
import BookingConfirmActions from '@/components/booking/BookingConfirmActions';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User, CheckCircle, Loader2, Check } from 'lucide-react';
import { useMindbodyAvailability, AvailableItem } from '@/hooks/useMindbodyServices';
import { useAuth } from '@/contexts/AuthContext';
import { useBookService } from '@/hooks/useMindbodyBookings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { filterUpcomingSessions } from '@/lib/sessionTimes';

interface ServiceVariant {
  id: string;
  name: string;
  duration: number | null;
  price: number | null;
}

interface StoredService {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  variants?: ServiceVariant[];
  // Legacy single-variant format
  duration?: string;
  price?: string;
}

const BookService = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { isAuthenticated, login } = useAuth();
  const bookServiceMutation = useBookService();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<AvailableItem | null>(null);
  const [service, setService] = useState<StoredService | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Determine if we have multiple variants
  const hasVariants = service?.variants && service.variants.length > 1;
  
  // Dynamic steps based on variants
  const steps = useMemo(() => {
    if (hasVariants) {
      return [
        { id: 1, label: 'Type' },
        { id: 2, label: 'Date' },
        { id: 3, label: 'Time' },
        { id: 4, label: 'Confirm' },
      ];
    }
    return [
      { id: 1, label: 'Date' },
      { id: 2, label: 'Time' },
      { id: 3, label: 'Confirm' },
    ];
  }, [hasVariants]);

  // Step mapping for logic
  const dateStep = hasVariants ? 2 : 1;
  const timeStep = hasVariants ? 3 : 2;
  const confirmStep = hasVariants ? 4 : 3;

  // Load service from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('selectedService');
    if (stored) {
      const parsedService = JSON.parse(stored) as StoredService;
      setService(parsedService);
      
      // If single variant or legacy format, auto-select it
      if (parsedService.variants && parsedService.variants.length === 1) {
        setSelectedVariant(parsedService.variants[0]);
      } else if (!parsedService.variants) {
        // Legacy format - create a variant from the service
        setSelectedVariant({
          id: parsedService.id,
          name: parsedService.title,
          duration: parsedService.duration ? parseInt(parsedService.duration) : null,
          price: parsedService.price ? parseFloat(parsedService.price.replace('£', '')) : null,
        });
      }
    }
  }, [serviceId]);

  // Use selected variant ID for availability
  const activeServiceId = selectedVariant?.id || serviceId || '';

  // Date range for availability query
  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    return {
      startDate: format(selectedDate, 'yyyy-MM-dd'),
    };
  }, [selectedDate]);

  // Fetch availability for selected date
  const { data: availabilityData, isLoading: isLoadingSlots } = useMindbodyAvailability({
    sessionTypeId: activeServiceId,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
    enabled: !!activeServiceId && !!selectedDate,
  });

  const availableSlots = useMemo(() => {
    const items = filterUpcomingSessions(availabilityData?.availableItems || []);
    if (!selectedDate) return items;
    return items.filter((slot) => isSameDay(new Date(slot.startDateTime), selectedDate));
  }, [availabilityData, selectedDate]);

  const handleVariantSelect = (variant: ServiceVariant) => {
    setSelectedVariant(variant);
    // Auto-continue to date selection
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      setCurrentStep(timeStep);
    }
  };

  const handleSlotSelect = (slot: AvailableItem) => {
    setSelectedSlot(slot);
    // Auto-continue to confirmation
    setCurrentStep(confirmStep);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && hasVariants && selectedVariant) {
      setCurrentStep(2);
    } else if (currentStep === timeStep && selectedSlot) {
      setCurrentStep(confirmStep);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      await bookServiceMutation.mutateAsync({
        bookingType: 'appointment',
        sessionTypeId: selectedSlot.sessionTypeId.toString(),
        staffId: selectedSlot.staffId.toString(),
        locationId: selectedSlot.locationId,
        startDateTime: selectedSlot.startDateTime,
        serviceName: selectedVariant?.name || service?.title,
      });
      setBookingComplete(true);
      toast.success('Booking confirmed!');
    } catch (error) {
      toast.error('Failed to complete booking. Please try again.');
    }
  };

  const isBooking = bookServiceMutation.isPending;

  // Get display values for selected variant or legacy format
  const displayDuration = selectedVariant?.duration 
    ? `${selectedVariant.duration} min` 
    : service?.duration || '';
  const displayPrice = selectedVariant?.price 
    ? `£${selectedVariant.price.toFixed(2)}` 
    : service?.price || 'Contact for pricing';
  const displayTitle = selectedVariant?.name || service?.title || '';

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-12 pb-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">Service not found.</p>
                <Button onClick={() => navigate('/')} variant="outline">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (bookingComplete && selectedSlot) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-12 pb-16">
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
                    <Button onClick={() => navigate('/')}>
                      Back to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-6 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
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
                {selectedVariant && (
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {displayDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {displayDuration}
                      </span>
                    )}
                    <span className="font-medium text-foreground">{displayPrice}</span>
                  </div>
                )}
              </div>
            </div>

            <BookingSteps steps={steps} currentStep={currentStep} className="mb-8" />
          </div>

          {/* Step Content */}
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Variant Selection (only if multiple variants) */}
              {currentStep === 1 && hasVariants && (
                <motion.div
                  key="step-variant"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Select Treatment Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {service.variants?.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => handleVariantSelect(variant)}
                            className={cn(
                              'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                              selectedVariant?.id === variant.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                            )}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-foreground">
                                {variant.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                {variant.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {variant.duration} min
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-foreground">
                                {variant.price ? `£${variant.price.toFixed(2)}` : 'Contact'}
                              </span>
                              {selectedVariant?.id === variant.id && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-4 h-4 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Date Selection Step */}
              {currentStep === dateStep && (
                <motion.div
                  key="step-date"
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

              {/* Time Selection Step */}
              {currentStep === timeStep && (
                <motion.div
                  key="step-time"
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
                      
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Confirmation Step */}
              {currentStep === confirmStep && selectedSlot && (
                <motion.div
                  key="step-confirm"
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
                        <h3 className="font-semibold text-lg">{displayTitle}</h3>
                        
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
                          {displayDuration && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Duration</span>
                              <span>{displayDuration}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-muted-foreground">Price</span>
                            <span className="font-semibold text-lg">{displayPrice}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <BookingConfirmActions
                          onChangeTime={() => setCurrentStep(timeStep)}
                          onConfirm={handleConfirmBooking}
                          isAuthenticated={isAuthenticated}
                          isPending={isBooking}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookService;