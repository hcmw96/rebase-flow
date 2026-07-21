import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
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
import ClassScheduleFlow from '@/components/booking/ClassScheduleFlow';
import BookingConfirmActions from '@/components/booking/BookingConfirmActions';
import BookingConfirmationSuccess, {
  type BookingConfirmationPayment,
} from '@/components/booking/BookingConfirmationSuccess';
import { ChevronLeft, Calendar, Clock, MapPin, User, Loader2, Check, Mail } from 'lucide-react';
import { useMindbodyAvailability, AvailableItem, MindbodyClass } from '@/hooks/useMindbodyServices';
import { useAuth } from '@/contexts/AuthContext';
import { useBookService } from '@/hooks/useMindbodyBookings';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { filterUpcomingSessions, formatMindbodyDate, formatMindbodyTime, localCalendarDayKey } from '@/lib/sessionTimes';
import { bookingHorizonDateRange, bookingHorizonEndDate } from '@/lib/bookingHorizon';
import { ServiceVariant } from '@/components/ServiceCard';
import { priceOverrides, resolveDisplayName } from '@/config/serviceConfig';
import { buildSlotBookingIdempotencyKey } from '@/lib/bookingIdempotency';
import { classifyBookingError } from '@/lib/bookingErrors';
import { BookingMutationError } from '@/lib/bookingMutationError';
import { mindbodyClientAccountUrl } from '@/lib/mindbodyAuth';
import {
  clearSessionNeedsPaymentCard,
  markSessionNeedsPaymentCard,
} from '@/lib/paymentCardSetupStorage';
import {
  clearMindbodyCheckoutHandoff,
  mindbodyAppointmentBookAndPayUrl,
  openMindbodyBookAndPay,
  stashMindbodyCheckoutHandoff,
} from '@/lib/mindbodyCheckoutUrls';
import { clearPendingBooking, stashPendingBooking, type PendingAppointmentState } from '@/lib/bookingResume';
import { ImageHeroCaption, ImageTextScrim } from '@/components/ImageTextScrim';
import { stripHtml } from '@/lib/htmlText';

export interface BookingServiceData {
  title: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
  contactOnly?: boolean;
  classDescriptionIds?: number[];
}

interface BookingDrawerProps {
  open: boolean;
  onClose: () => void;
  service: BookingServiceData | null;
  onSwitchService?: (serviceName: string) => void;
  resumeClassId?: string;
  resumeClass?: MindbodyClass;
  resumeAppointment?: PendingAppointmentState;
  /** After Mindbody pay handoff — open My Bookings. */
  onViewBookings?: () => void;
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

const BookingDrawer = ({
  open,
  onClose,
  service,
  onSwitchService,
  resumeClassId,
  resumeClass,
  resumeAppointment,
  onViewBookings,
}: BookingDrawerProps) => {
  const { isAuthenticated, login, logout, refreshMbSession, mbSession } = useAuth();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingErrorRequiresSignIn, setBookingErrorRequiresSignIn] = useState(false);
  const [bookingOutcomeUncertain, setBookingOutcomeUncertain] = useState(false);
  const [needsCardOnFile, setNeedsCardOnFile] = useState(false);
  const [cardSetupRetryHint, setCardSetupRetryHint] = useState<string | null>(null);
  const [mindbodyCheckoutOpened, setMindbodyCheckoutOpened] = useState(false);
  const [mindbodyCheckoutChecking, setMindbodyCheckoutChecking] = useState(false);
  const [needsMindbodyPay, setNeedsMindbodyPay] = useState(false);
  const accountUrl = mindbodyClientAccountUrl();
  const bookServiceMutation = useBookService();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<AvailableItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [confirmedPayment, setConfirmedPayment] = useState<BookingConfirmationPayment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const restoredAppointmentRef = useRef<string | null>(null);
  const bookingInFlightRef = useRef(false);
  const wasOpenRef = useRef(false);
  const [flowEpoch, setFlowEpoch] = useState(0);

  const resetBookingUi = useCallback((opts?: { keepInFlight?: boolean }) => {
    setCurrentStep(1);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setSelectedVariant(null);
    setBookingComplete(false);
    setConfirmedPayment(null);
    setIsSubmitting(false);
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
    setNeedsCardOnFile(false);
    setCardSetupRetryHint(null);
    setMindbodyCheckoutOpened(false);
    setMindbodyCheckoutChecking(false);
    setNeedsMindbodyPay(false);
    restoredAppointmentRef.current = null;
    if (!opts?.keepInFlight) {
      bookingInFlightRef.current = false;
    }
  }, []);

  // Clear stale "Booking confirmed" when reopening. On close, defer wipe so the
  // success screen doesn't flash back to the form mid-animation.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      resetBookingUi({ keepInFlight: bookServiceMutation.isPending });
      setFlowEpoch((n) => n + 1);
      wasOpenRef.current = true;
      return;
    }
    if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
      const t = window.setTimeout(() => {
        resetBookingUi({ keepInFlight: bookServiceMutation.isPending });
      }, 320);
      return () => window.clearTimeout(t);
    }
  }, [open, resetBookingUi, bookServiceMutation.isPending]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  useEffect(() => {
    if (!open && !bookServiceMutation.isPending) {
      bookingInFlightRef.current = false;
    }
  }, [open, bookServiceMutation.isPending]);

  // Check if this is a class booking
  const isClassBooking = !!(service?.classDescriptionIds?.length);

  const serviceDisplayName = service?.title ? resolveDisplayName(service.title) : '';

  // Check if this entire service is contact-only
  const isFullContactOnly = service?.contactOnly === true;

  // Auto-select single variant
  const hasVariants = service?.variants && service.variants.length > 1;

  const activeVariant = useMemo(() => {
    if (selectedVariant) return selectedVariant;
    if (service?.variants?.length === 1) return service.variants[0];
    return null;
  }, [selectedVariant, service]);

  const buildPendingAppointment = useCallback((): PendingAppointmentState | undefined => {
    if (isClassBooking || !service) return undefined;
    return {
      currentStep,
      selectedVariantId: activeVariant?.id,
      selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      selectedSlot: selectedSlot ?? undefined,
    };
  }, [isClassBooking, service, currentStep, activeVariant?.id, selectedDate, selectedSlot]);

  const stashBookingProgress = useCallback(() => {
    if (!service) return;
    if (isClassBooking) {
      stashPendingBooking(service);
      return;
    }
    stashPendingBooking(service, { appointment: buildPendingAppointment() });
  }, [service, isClassBooking, buildPendingAppointment]);

  useEffect(() => {
    if (!open || !resumeAppointment || isClassBooking || !service) return;
    const key = JSON.stringify(resumeAppointment);
    if (restoredAppointmentRef.current === key) return;
    restoredAppointmentRef.current = key;

    if (resumeAppointment.selectedVariantId && service.variants?.length) {
      const variant = service.variants.find((v) => v.id === resumeAppointment.selectedVariantId);
      if (variant) setSelectedVariant(variant);
    }
    if (resumeAppointment.selectedDate) {
      const [y, m, d] = resumeAppointment.selectedDate.split('-').map(Number);
      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        setSelectedDate(new Date(y, m - 1, d));
      }
    }
    if (resumeAppointment.selectedSlot) {
      setSelectedSlot(resumeAppointment.selectedSlot);
    }
    setCurrentStep(resumeAppointment.currentStep);
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
  }, [open, resumeAppointment, isClassBooking, service]);

  const startSignInForBooking = () => {
    stashBookingProgress();
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
    logout();
    login({ clearSession: true });
  };

  const startCreateAccountForBooking = () => {
    stashBookingProgress();
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
    logout();
    login({ clearSession: true });
  };

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

  // Light calendar payload (date keys only) — Premium Suite slots alone are ~1.3MB / 90 days.
  const monthRange = useMemo(() => bookingHorizonDateRange(), []);
  const selectedDayKey = selectedDate ? localCalendarDayKey(selectedDate) : '';

  const { data: daysAvailabilityData, isLoading: isLoadingDays, isError: isDaysError } =
    useMindbodyAvailability({
      sessionTypeId: activeServiceId,
      startDate: monthRange.startDate,
      endDate: monthRange.endDate,
      view: 'days',
      enabled: open && !!activeServiceId && !showContactMessage && !isClassBooking,
    });

  const { data: daySlotsData, isLoading: isLoadingDaySlots } = useMindbodyAvailability({
    sessionTypeId: activeServiceId,
    startDate: selectedDayKey,
    endDate: selectedDayKey,
    view: 'slots',
    enabled:
      open &&
      !!activeServiceId &&
      !!selectedDayKey &&
      !showContactMessage &&
      !isClassBooking,
  });

  const availableSlots = useMemo(() => {
    return filterUpcomingSessions(daySlotsData?.availableItems || []);
  }, [daySlotsData]);

  const isLoadingSlots = isLoadingDaySlots && !!selectedDate;

  const availableDates = useMemo(() => {
    const keys = daysAvailabilityData?.availableDays || [];
    return keys.map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d);
    });
  }, [daysAvailabilityData]);

  const handleUpsellSelect = (serviceName: string) => {
    if (onSwitchService) onSwitchService(serviceName);
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

  const idempotencyKey = useMemo(() => {
    if (!selectedSlot || !mbSession?.sessionId) return undefined;
    return buildSlotBookingIdempotencyKey({
      sessionId: mbSession.sessionId,
      bookingType: 'appointment',
      sessionTypeId: selectedSlot.sessionTypeId.toString(),
      staffId: selectedSlot.staffId.toString(),
      startDateTime: selectedSlot.startDateTime,
    });
  }, [selectedSlot, mbSession?.sessionId]);

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

  useEffect(() => {
    if (isAuthenticated) {
      setBookingError(null);
      setBookingErrorRequiresSignIn(false);
      setBookingOutcomeUncertain(false);
    }
  }, [isAuthenticated]);

  const appointmentListPriceGbp = useMemo(() => {
    if (activeVariant?.price != null) return activeVariant.price;
    if (serviceDisplayName && priceOverrides[serviceDisplayName] !== undefined) {
      return priceOverrides[serviceDisplayName];
    }
    return null;
  }, [activeVariant?.price, serviceDisplayName]);

  const appointmentCheckoutSummary = useMemo(() => {
    return {
      priceGbp: appointmentListPriceGbp ?? 0,
      ...(needsCardOnFile
        ? { needsCardOnFile: true as const, accountUrl }
        : {}),
    };
  }, [appointmentListPriceGbp, needsCardOnFile, accountUrl]);

  const mindbodyAppointmentCheckoutUrl = useMemo(() => {
    if (!selectedSlot?.sessionTypeId) return null;
    return mindbodyAppointmentBookAndPayUrl({
      sessionTypeId: selectedSlot.sessionTypeId,
      startDateTime: selectedSlot.startDateTime,
      locationId: selectedSlot.locationId,
    });
  }, [selectedSlot]);

  const openMindbodyAppointmentCheckout = () => {
    if (!selectedSlot || !mindbodyAppointmentCheckoutUrl) return;
    setNeedsMindbodyPay(true);
    setNeedsCardOnFile(false);
    setCardSetupRetryHint(null);
    stashMindbodyCheckoutHandoff({
      kind: 'appointment',
      serviceName: activeVariant?.name || service?.title || 'Appointment',
      startDateTime: selectedSlot.startDateTime,
      checkoutUrl: mindbodyAppointmentCheckoutUrl,
    });
    setMindbodyCheckoutOpened(true);
    setBookingError(null);
    openMindbodyBookAndPay(mindbodyAppointmentCheckoutUrl);
  };

  const finishMindbodyAppointmentCheckout = async () => {
    setMindbodyCheckoutChecking(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      clearMindbodyCheckoutHandoff();
      clearPendingBooking();
      if (onViewBookings) onViewBookings();
      else onClose();
    } finally {
      setMindbodyCheckoutChecking(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || bookingComplete || bookingInFlightRef.current || bookServiceMutation.isPending) {
      return;
    }
    if (!isAuthenticated) {
      startSignInForBooking();
      return;
    }

    const activeSession = await refreshMbSession();
    if (!activeSession?.sessionId) {
      setBookingError('Your sign-in expired. Please sign in again.');
      setBookingErrorRequiresSignIn(true);
      return;
    }

    bookingInFlightRef.current = true;
    setIsSubmitting(true);
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
    setCardSetupRetryHint(null);
    if (!needsCardOnFile) {
      setNeedsCardOnFile(false);
    }

    try {
      const result = await bookServiceMutation.mutateAsync({
        bookingType: 'appointment',
        sessionTypeId: selectedSlot.sessionTypeId.toString(),
        staffId: selectedSlot.staffId.toString(),
        staffName: selectedSlot.staffName,
        locationId: selectedSlot.locationId,
        locationName: selectedSlot.locationName,
        startDateTime: selectedSlot.startDateTime,
        endDateTime: selectedSlot.endDateTime,
        serviceName: activeVariant?.name || service?.title,
        idempotencyKey,
      });
      clearPendingBooking();
      const listPriceGbp = appointmentListPriceGbp;
      const paid = result.payment;
      setConfirmedPayment({
        method: paid?.method ?? 'stored_card',
        amountGbp: paid?.amountGbp ?? listPriceGbp,
        listPriceGbp: paid?.listPriceGbp ?? listPriceGbp,
        passName: null,
      });
      setBookingComplete(true);
      setNeedsCardOnFile(false);
      setNeedsMindbodyPay(false);
      clearSessionNeedsPaymentCard();
      if (navigator.userAgent.includes('despia')) {
        despia('successhaptic://');
      }
    } catch (error: unknown) {
      bookingInFlightRef.current = false;
      setIsSubmitting(false);
      if (error instanceof BookingMutationError) {
        if (
          error.flags.noStoredCard ||
          error.flags.cardDeclined ||
          error.flags.storedCardUnavailable ||
          (error.flags.siteScopeIssue && error.flags.paymentRequired)
        ) {
          // Roaming / new clients often can't charge StoredCard — open Mindbody pay
          // for this session type rather than dead-ending on "add card".
          if (mindbodyAppointmentCheckoutUrl) {
            openMindbodyAppointmentCheckout();
            return;
          }
          if (mbSession?.sessionId) {
            markSessionNeedsPaymentCard(mbSession.sessionId);
          }
          setNeedsCardOnFile(true);
          setBookingError(null);
          setBookingErrorRequiresSignIn(false);
          setBookingOutcomeUncertain(false);
          if (needsCardOnFile) {
            setCardSetupRetryHint(
              "We still couldn't find a card on your account. Add one in Mindbody, then tap continue again.",
            );
          }
          return;
        }
        setNeedsCardOnFile(false);
        setCardSetupRetryHint(null);
        clearSessionNeedsPaymentCard();
        setBookingError(error.message);
        setBookingErrorRequiresSignIn(Boolean(error.flags.requiresLogin));
        setBookingOutcomeUncertain(Boolean(error.flags.bookingOutcomeUncertain));
        return;
      }
      const classified = classifyBookingError(
        error instanceof Error ? error.message : undefined,
      );
      setBookingError(classified.message);
      setBookingErrorRequiresSignIn(classified.kind === 'session_expired');
      setBookingOutcomeUncertain(false);
      if (classified.kind === 'slot_taken') {
        queryClient.invalidateQueries({ queryKey: ['mindbody-availability'] });
        setSelectedSlot(null);
        setCurrentStep(timeStep);
      }

      if (navigator.userAgent.includes('despia')) {
        despia('errorhaptic://');
      }
    }
  };


  const isBooking = bookServiceMutation.isPending || isSubmitting;

  const displayDuration = activeVariant?.duration ? `${activeVariant.duration} min` : '';
  const displayPrice = activeVariant?.price
    ? `£${activeVariant.price.toFixed(2)}`
    : (serviceDisplayName && priceOverrides[serviceDisplayName] !== undefined
        ? `£${priceOverrides[serviceDisplayName].toFixed(2)}`
        : 'Contact for pricing');
  const displayTitle = resolveDisplayName(activeVariant?.name || service?.title || '');

  if (!service) return null;

  const showHeroImage = !bookingComplete && !showContactMessage;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} handleOnly>
      <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-none border-none outline-none" hideHandle>
        <div className="flex flex-col h-full min-h-0">
          {/* Hero Image Section */}
          {showHeroImage && (
            <div className={cn(
              'relative shrink-0',
              isClassBooking ? 'h-[22vh] sm:h-[30vh]' : 'h-[28vh] sm:h-[35vh]',
            )}>
              <img
                src={service.image}
                alt={serviceDisplayName}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <ImageTextScrim tone="app" />

              {/* Back & Close buttons overlaid on image */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10" style={{ paddingTop: 'max(1rem, var(--safe-area-top, env(safe-area-inset-top, 0px)))' }}>
                <button
                  onClick={handleBack}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={() => {
                    if (navigator.userAgent.includes('despia')) despia('lighthaptic://');
                    onClose();
                  }}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Service info overlaid at bottom of image */}
              <ImageHeroCaption tone="app" className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-tight">
                  {hasVariants ? serviceDisplayName : `Book ${serviceDisplayName}`}
                </h2>
                {activeVariant && !hasVariants && !isClassBooking && (
                  <p className="text-sm text-foreground/80 mt-0.5">
                    {[displayDuration, activeVariant.price ? `£${activeVariant.price}` : null].filter(Boolean).join(' · ')}
                  </p>
                )}
                {isClassBooking && displayPrice && (
                  <p className="text-sm text-foreground/80 mt-0.5">{displayPrice}</p>
                )}
              </ImageHeroCaption>
            </div>
          )}

          {/* Non-image header for success/contact states */}
          {!showHeroImage && (
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/50 shrink-0" style={{ paddingTop: 'max(1rem, var(--safe-area-top, env(safe-area-inset-top, 0px)))' }}>
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate">
                  {bookingComplete ? 'Confirmed' : serviceDisplayName}
                </h2>
              </div>
            </div>
          )}

          {/* Body — single scroll container (nested overflow breaks iOS Safari) */}
          <div
            data-vaul-no-drag
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-4 py-3 sm:py-4"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Class booking flow */}
            {open && isClassBooking ? (
              <ClassScheduleFlow
                key={`${service.classDescriptionIds!.join('-')}-${flowEpoch}`}
                classDescriptionIds={service.classDescriptionIds!}
                className={serviceDisplayName}
                onClose={onClose}
                resumeClassId={resumeClassId}
                resumeClass={resumeClass}
                bookingService={service}
                onViewBookings={onViewBookings}
              />
            ) : isFullContactOnly && !hasVariants ? (
              <ContactReceptionMessage serviceName={serviceDisplayName} />
            ) : showContactMessage && isVariantContactOnly ? (
              <ContactReceptionMessage serviceName={resolveDisplayName(activeVariant?.name || service.title)} />
            ) : bookingComplete && selectedSlot ? (
              <BookingConfirmationSuccess
                details={{
                  serviceName: activeVariant?.name || service?.title || 'Booking',
                  startDateTime: selectedSlot.startDateTime,
                  endDateTime: selectedSlot.endDateTime,
                  staffName: selectedSlot.staffName,
                  locationName: selectedSlot.locationName,
                }}
                payment={confirmedPayment}
                durationMinutes={activeVariant?.duration}
                onDone={() => {
                  resetBookingUi();
                  clearPendingBooking();
                  onClose();
                }}
              >
                {onSwitchService && (
                  <UpsellSuggestions
                    currentServiceTitle={service?.title || ''}
                    onSelectUpsell={handleUpsellSelect}
                    referenceEndDateTime={selectedSlot?.endDateTime ?? null}
                  />
                )}
              </BookingConfirmationSuccess>
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
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="font-medium text-foreground">{variant.name}</div>
                            {variant.description && (
                              <div className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                {stripHtml(variant.description)}
                              </div>
                            )}
                            {variant.isPack && variant.packSessionCount ? (
                              <div className="text-xs text-muted-foreground mt-1">
                                {variant.packSessionCount} sessions
                              </div>
                            ) : variant.duration ? (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {variant.duration} min
                              </div>
                            ) : null}
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
                        <BookingCalendar
                          selectedDate={selectedDate}
                          onSelect={handleDateSelect}
                          availableDates={availableDates}
                          isLoading={isLoadingDays}
                          toDate={bookingHorizonEndDate()}
                        />
                        {isDaysError && !isLoadingDays && (
                          <p className="mt-3 text-sm text-amber-200/90 text-center">
                            Couldn&apos;t load availability. Close and try again, or email
                            reception@rebaserecovery.com.
                          </p>
                        )}
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
                            <span>{formatMindbodyDate(selectedSlot.startDateTime)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{formatMindbodyTime(selectedSlot.startDateTime)}</span>
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

                      <BookingConfirmActions
                        onChangeTime={() => {
                          setBookingError(null);
                          setBookingErrorRequiresSignIn(false);
                          setBookingOutcomeUncertain(false);
                          setNeedsCardOnFile(false);
                          setCardSetupRetryHint(null);
                          setMindbodyCheckoutOpened(false);
                          setNeedsMindbodyPay(false);
                          setCurrentStep(timeStep);
                        }}
                        onConfirm={
                          !isAuthenticated || bookingErrorRequiresSignIn
                            ? startSignInForBooking
                            : handleConfirmBooking
                        }
                        isAuthenticated={isAuthenticated}
                        isPending={isBooking}
                        bookingError={bookingError}
                        bookingErrorRequiresSignIn={bookingErrorRequiresSignIn}
                        bookingOutcomeUncertain={bookingOutcomeUncertain}
                        onCreateAccount={startCreateAccountForBooking}
                        checkoutSummary={appointmentCheckoutSummary}
                        needsCardOnFile={needsCardOnFile}
                        accountUrl={accountUrl}
                        onContinueAfterCard={handleConfirmBooking}
                        cardSetupRetryHint={cardSetupRetryHint}
                        mindbodyCheckoutUrl={
                          needsMindbodyPay || mindbodyCheckoutOpened
                            ? mindbodyAppointmentCheckoutUrl
                            : null
                        }
                        mindbodyCheckoutOpened={mindbodyCheckoutOpened}
                        onOpenMindbodyCheckout={
                          needsMindbodyPay || mindbodyCheckoutOpened
                            ? openMindbodyAppointmentCheckout
                            : undefined
                        }
                        onMindbodyCheckoutFinished={() => void finishMindbodyAppointmentCheckout()}
                        mindbodyCheckoutChecking={mindbodyCheckoutChecking}
                      />

                      {onSwitchService && (
                        <UpsellSuggestions
                          currentServiceTitle={service?.title || ''}
                          onSelectUpsell={handleUpsellSelect}
                          referenceEndDateTime={selectedSlot?.endDateTime ?? null}
                        />
                      )}
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
