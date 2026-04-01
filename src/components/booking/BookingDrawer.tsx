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
import UpsellSuggestions, { serviceInfo } from '@/components/booking/UpsellSuggestions';
import { ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle, Loader2, Check, Mail } from 'lucide-react';
import { useMindbodyAvailability, AvailableItem } from '@/hooks/useMindbodyServices';
import { useAuth } from '@/contexts/AuthContext';
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
  contactOnly?: boolean;
}

interface BookingDrawerProps {
  open: boolean;
  onClose: () => void;
  service: BookingServiceData | null;
  onSwitchService?: (serviceName: string) => void;
}

const ContactReceptionMessage = ({ serviceName }: { serviceName: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center space-y-5 py-6"
  >
    <div className="flex justify-center">
      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
        <Mail className="h-8 w-8 text-foreground/70" />
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">Contact Reception</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        To book <span className="font-medium text-foreground">{serviceName}</span>, please contact reception.
      </p>
    </div>
    <a
      href="mailto:reception@rebaserecovery.com"
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-colors hover:bg-primary/90"
    >
      <Mail className="h-4 w-4" />
      reception@rebaserecovery.com
    </a>
  </motion.div>
);

const BookingDrawer = ({ open, onClose, service, onSwitchService }: BookingDrawerProps) => {
  const { mbSession, isAuthenticated } = useAuth();
  const bookServiceMutation = useBookService();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<AvailableItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [addedUpsells, setAddedUpsells] = useState<string[]>([]);

  // Reset state when drawer opens with new service
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setSelectedVariant(null);
        setBookingComplete(false);
        setAddedUpsells([]);
      }, 300);
    }
  };

  // Check if this entire service is contact-only
  const isFullContactOnly = service?.contactOnly === true;

  // Auto-select single variant
  const hasVariants = service?.variants && service.variants.length > 1;

  const activeVariant = useMemo(() => {
    if (selectedVariant) return selectedVariant;
    if (service?.variants?.length === 1) return service.variants[0];
    return null;
  }, [selectedVariant, service]);

  // Check if the selected variant is contact-only
  const isVariantContactOnly = activeVariant?.contactOnly === true;
  const showContactMessage = isFullContactOnly || isVariantContactOnly;

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
    enabled: !!activeServiceId && !!selectedDate && !showContactMessage,
  });

  const availableSlots = availabilityData?.availableItems || [];

  const handleToggleUpsell = (serviceName: string) => {
    setAddedUpsells(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleVariantSelect = (variant: ServiceVariant) => {
    setSelectedVariant(variant);
    // If variant is contact-only, don't advance to date step
    if (variant.contactOnly) return;
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
    // If variant is contact-only, go back to variant selection
    if (isVariantContactOnly && hasVariants) {
      setSelectedVariant(null);
      setCurrentStep(1);
      return;
    }
    if (currentStep === 1) {
      onClose();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmBooking = async () => {
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

  const showHeroImage = !bookingComplete && !showContactMessage;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-none border-none outline-none" hideHandle>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Hero Image Section */}
          {showHeroImage && (
            <div className="relative shrink-0 h-[55vh]">
              <img
                src={service.image}
                alt={service.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

              {/* Back & Close buttons overlaid on image */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                <button
                  onClick={handleBack}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Service info overlaid at bottom of image */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h2 className="text-xl font-semibold text-foreground">
                  {hasVariants ? service.title : `Book ${service.title}`}
                </h2>
                {activeVariant && !hasVariants && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {[displayDuration, activeVariant.price ? `£${activeVariant.price}` : null].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Non-image header for success/contact states */}
          {!showHeroImage && (
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/50 shrink-0" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate">
                  {bookingComplete ? 'Confirmed' : service.title}
                </h2>
              </div>
            </div>
          )}

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Contact-only: full service */}
            {isFullContactOnly && !hasVariants ? (
              <ContactReceptionMessage serviceName={service.title} />
            ) : showContactMessage && isVariantContactOnly ? (
              <ContactReceptionMessage serviceName={activeVariant?.name || service.title} />
            ) : bookingComplete && selectedSlot ? (
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
                {addedUpsells.length > 0 && onSwitchService ? (
                  <UpsellSuggestions
                    currentServiceTitle={service?.title || ''}
                    onSelectUpsell={onSwitchService}
                    addedServices={addedUpsells}
                    successMode
                  />
                ) : onSwitchService ? (
                  <UpsellSuggestions
                    currentServiceTitle={service?.title || ''}
                    onSelectUpsell={handleToggleUpsell}
                    addedServices={addedUpsells}
                  />
                ) : null}
              </motion.div>
            ) : (
              <>
                {/* Steps indicator */}
                {!showContactMessage && (
                  <BookingSteps steps={steps} currentStep={currentStep} className="mb-5" />
                )}

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
                              {variant.contactOnly && (variant.price === 0 || variant.price === null)
                                ? 'Free — Contact'
                                : variant.price ? `£${variant.price.toFixed(2)}` : 'Contact'}
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
                  {currentStep === dateStep && !showContactMessage && (
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
                  {currentStep === timeStep && !showContactMessage && (
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
                  {currentStep === confirmStep && selectedSlot && !showContactMessage && (
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

                      {addedUpsells.length > 0 && (
                        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your add-ons</p>
                          {addedUpsells.map(name => (
                            <div key={name} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{name}</span>
                              <button
                                onClick={() => handleToggleUpsell(name)}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

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

                      <UpsellSuggestions
                        currentServiceTitle={service?.title || ''}
                        onSelectUpsell={handleToggleUpsell}
                        addedServices={addedUpsells}
                      />
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
