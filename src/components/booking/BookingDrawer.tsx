import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import despia from 'despia-native';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import BookingCalendar from '@/components/booking/BookingCalendar';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import BookingSteps from '@/components/booking/BookingSteps';
import { ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle, Loader2, Check } from 'lucide-react';
import { useMindbodyAvailability, AvailableItem } from '@/hooks/useMindbodyServices';
import { useAuth } from '@/contexts/AuthContext';
import { useMindbody } from '@/contexts/MindbodyContext';
import { useBookService } from '@/hooks/useMindbodyBookings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ServiceVariant } from '@/components/ServiceCard';

export interface BookingServiceData {
  title: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

interface BookingDrawerProps {
  open: boolean;
  onClose: () => void;
  service: BookingServiceData | null;
}

const BookingDrawer = ({ open, onClose, service }: BookingDrawerProps) => {
  const { isAuthenticated } = useAuth();
  const { mbSession, isMindbodyLinked, linkMindbody } = useMindbody();
  const bookServiceMutation = useBookService();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<AvailableItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Reset state when drawer opens with new service
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      // Reset after close animation
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setSelectedVariant(null);
        setBookingComplete(false);
      }, 300);
    }
  };

  // Auto-select single variant
  const hasVariants = service?.variants && service.variants.length > 1;

  const activeVariant = useMemo(() => {
    if (selectedVariant) return selectedVariant;
    if (service?.variants?.length === 1) return service.variants[0];
    return null;
  }, [selectedVariant, service]);

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

  const dateStep = hasVariants ? 2 : 1;
  const timeStep = hasVariants ? 3 : 2;
  const confirmStep = hasVariants ? 4 : 3;

  const activeServiceId = activeVariant?.id || '';

  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    return {
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      endDate: format(addDays(selectedDate, 1), 'yyyy-MM-dd'),
    };
  }, [selectedDate]);

  const { data: availabilityData, isLoading: isLoadingSlots } = useMindbodyAvailability({
    sessionTypeId: activeServiceId,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
    enabled: !!activeServiceId && !!selectedDate,
  });

  const availableSlots = availabilityData?.availableItems || [];

  const handleVariantSelect = (variant: ServiceVariant) => {
    setSelectedVariant(variant);
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) setCurrentStep(timeStep);
  };

  const handleSlotSelect = (slot: AvailableItem) => {
    setSelectedSlot(slot);
    setCurrentStep(confirmStep);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onClose();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmBooking = async () => {
    if (!isMindbodyLinked) {
      linkMindbody();
      return;
    }

    if (!selectedSlot || !mbSession) return;

    try {
      await bookServiceMutation.mutateAsync({
        bookingType: 'appointment',
        sessionTypeId: selectedSlot.sessionTypeId.toString(),
        staffId: selectedSlot.staffId.toString(),
        locationId: selectedSlot.locationId,
        startDateTime: selectedSlot.startDateTime,
        serviceName: activeVariant?.name || service?.title,
      });
      setBookingComplete(true);
      toast.success('Booking confirmed!');
      if (navigator.userAgent.includes('despia')) {
        despia('successhaptic://');
      }
    } catch (error) {
      toast.error('Failed to complete booking. Please try again.');
      if (navigator.userAgent.includes('despia')) {
        despia('errorhaptic://');
      }
    }
  };

  const isBooking = bookServiceMutation.isPending;

  const displayDuration = activeVariant?.duration ? `${activeVariant.duration} min` : '';
  const displayPrice = activeVariant?.price ? `£${activeVariant.price.toFixed(2)}` : 'Contact for pricing';
  const displayTitle = activeVariant?.name || service?.title || '';

  if (!service) return null;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[90vh] outline-none">
        <div className="flex flex-col max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-2 pb-3 border-b border-border/50 shrink-0">
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted/50 transition-colors press-scale-none"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">
                {bookingComplete ? 'Confirmed' : `Book ${service.title}`}
              </h2>
              {activeVariant && !bookingComplete && (
                <p className="text-xs text-muted-foreground">
                  {[displayDuration, activeVariant.price ? `£${activeVariant.price}` : null].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {bookingComplete && selectedSlot ? (
              /* ── Success ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-6"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-foreground">Booking Confirmed!</h3>
                  <p className="text-sm text-muted-foreground">Your appointment has been booked.</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-left text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{format(new Date(selectedSlot.startDateTime), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{format(new Date(selectedSlot.startDateTime), 'h:mm a')}</span>
                  </div>
                  {selectedSlot.staffName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selectedSlot.staffName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{selectedSlot.locationName}</span>
                  </div>
                </div>
                <Button onClick={onClose} className="w-full">Done</Button>
              </motion.div>
            ) : (
              <>
                {/* Steps indicator */}
                <BookingSteps steps={steps} currentStep={currentStep} className="mb-5" />

                <AnimatePresence mode="wait">
                  {/* ── Variant Selection ── */}
                  {currentStep === 1 && hasVariants && (
                    <motion.div
                      key="step-variant"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Select Type</h3>
                      {service.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantSelect(variant)}
                          className={cn(
                            'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                            selectedVariant?.id === variant.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div>
                            <div className="font-medium text-foreground">{variant.name}</div>
                            {variant.duration && (
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {variant.duration} min
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {variant.price ? `£${variant.price.toFixed(2)}` : 'Contact'}
                            </span>
                            {selectedVariant?.id === variant.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* ── Date ── */}
                  {currentStep === dateStep && (
                    <motion.div
                      key="step-date"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Select Date</h3>
                      <div className="flex justify-center">
                        <BookingCalendar selectedDate={selectedDate} onSelect={handleDateSelect} />
                      </div>
                    </motion.div>
                  )}

                  {/* ── Time ── */}
                  {currentStep === timeStep && (
                    <motion.div
                      key="step-time"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Select Time
                        {selectedDate && (
                          <span className="text-foreground ml-2 normal-case font-normal">
                            — {format(selectedDate, 'EEE, MMM d')}
                          </span>
                        )}
                      </h3>
                      <TimeSlotPicker
                        slots={availableSlots}
                        selectedSlot={selectedSlot}
                        onSelect={handleSlotSelect}
                        isLoading={isLoadingSlots}
                      />
                    </motion.div>
                  )}

                  {/* ── Confirm ── */}
                  {currentStep === confirmStep && selectedSlot && (
                    <motion.div
                      key="step-confirm"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-sm">
                        <h3 className="font-semibold text-base">{displayTitle}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{format(new Date(selectedSlot.startDateTime), 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{format(new Date(selectedSlot.startDateTime), 'h:mm a')}</span>
                          </div>
                          {selectedSlot.staffName && (
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span>{selectedSlot.staffName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{selectedSlot.locationName}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-border space-y-1">
                          {displayDuration && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Duration</span>
                              <span>{displayDuration}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price</span>
                            <span className="font-semibold">{displayPrice}</span>
                          </div>
                        </div>
                      </div>

                      {!isMindbodyLinked && (
                        <div className="bg-accent/50 rounded-lg p-3 text-xs text-muted-foreground">
                          You'll need to connect your Mindbody account to complete this booking.
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setCurrentStep(timeStep)} className="flex-1">
                          Change Time
                        </Button>
                        <Button onClick={handleConfirmBooking} disabled={isBooking} className="flex-1">
                          {isBooking ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Booking...</>
                          ) : isMindbodyLinked ? (
                            'Confirm Booking'
                          ) : (
                            'Connect Mindbody'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BookingDrawer;
