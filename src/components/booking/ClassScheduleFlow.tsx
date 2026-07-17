import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  format,
  startOfWeek,
  addWeeks,
  isSameDay,
} from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMindbodyClasses, MindbodyClass } from '@/hooks/useMindbodyServices';
import { useAuth } from '@/contexts/AuthContext';
import { useBookService } from '@/hooks/useMindbodyBookings';
import { useClientMembership } from '@/hooks/useMindbodyMembership';
import { buildCommunalContrastCheckoutSummary } from '@/lib/bookingCheckoutSummary';
import { cn } from '@/lib/utils';
import BookingCalendar from '@/components/booking/BookingCalendar';
import BookingSteps from '@/components/booking/BookingSteps';
import BookingConfirmActions from '@/components/booking/BookingConfirmActions';
import BookingConfirmationSuccess from '@/components/booking/BookingConfirmationSuccess';
import type { BookingServiceData } from '@/components/booking/BookingDrawer';
import { filterUpcomingSessions, formatMindbodyDate, formatMindbodyTime, formatAppointmentTimeRange, mindbodyDateKey, parseMindbodyDateTime, studioCalendarDate, studioTodayKey } from '@/lib/sessionTimes';
import { bookingHorizonDateRange, bookingHorizonEndDate } from '@/lib/bookingHorizon';
import { resolveDisplayName, resolveDisplayText, resolveGroupDescription } from '@/config/serviceConfig';
import { stashPendingBooking } from '@/lib/bookingResume';
import { classifyBookingError } from '@/lib/bookingErrors';
import { BookingMutationError } from '@/lib/bookingMutationError';
import { mindbodyClientAccountUrl, resolveMindbodySignUpUrl } from '@/lib/mindbodyAuth';
import { openMindbodyExternalUrl } from '@/lib/mobileBrowser';
import {
  clearSessionNeedsPaymentCard,
  markSessionNeedsPaymentCard,
  sessionNeedsPaymentCard,
} from '@/lib/paymentCardSetupStorage';
import { buildSlotBookingIdempotencyKey } from '@/lib/bookingIdempotency';

import { stripHtml } from '@/lib/htmlText';
const normaliseBrand = (value: string | null | undefined): string =>
  (value ?? '').replace(/re[\s-]?base/gi, 'Rebase');

const STEPS = [
  { id: 1, label: 'Schedule' },
  { id: 2, label: 'Confirm' },
];

function weekLabel(weekStart: Date): string {
  const today = studioCalendarDate(studioTodayKey());
  const thisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const nextWeek = addWeeks(thisWeek, 1);
  if (isSameDay(weekStart, thisWeek)) return 'This week';
  if (isSameDay(weekStart, nextWeek)) return 'Next week';
  return `Week of ${format(weekStart, 'EEE, MMM d')}`;
}

function dayHeading(date: Date): string {
  const today = studioCalendarDate(studioTodayKey());
  if (isSameDay(date, today)) return `Today — ${format(date, 'EEEE, MMM d')}`;
  return format(date, 'EEEE, MMM d');
}

interface ClassSlotButtonProps {
  cls: MindbodyClass;
  onSelect: (cls: MindbodyClass) => void;
}

function ClassSlotButton({ cls, onSelect }: ClassSlotButtonProps) {
  const isFull = cls.availableSpots <= 0;
  return (
    <button
      type="button"
      disabled={isFull}
      onClick={() => !isFull && onSelect(cls)}
      className={cn(
        'w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all text-left',
        isFull
          ? 'border-border/40 opacity-60 cursor-not-allowed'
          : 'border-border hover:border-primary/50',
      )}
    >
      <div className="space-y-1">
        <div className="font-medium text-foreground">{resolveDisplayName(cls.name)}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatMindbodyTime(cls.startDateTime)}
          </span>
          {cls.staffName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {resolveDisplayName(cls.staffName)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {normaliseBrand(cls.locationName)}
          </span>
        </div>
      </div>
      <div
        className={cn(
          'text-xs flex items-center gap-1 sm:shrink-0',
          isFull ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        <Users className="h-3 w-3 shrink-0" />
        {isFull
          ? 'Fully booked'
          : `${cls.availableSpots} spot${cls.availableSpots !== 1 ? 's' : ''}`}
      </div>
    </button>
  );
}

interface ClassScheduleFlowProps {
  classDescriptionIds: number[];
  className: string;
  onClose: () => void;
  resumeClassId?: string;
  bookingService?: BookingServiceData;
}

const ClassScheduleFlow = ({
  classDescriptionIds,
  className: clsName,
  onClose,
  resumeClassId,
  bookingService,
}: ClassScheduleFlowProps) => {
  const { isAuthenticated, login, logout, refreshMbSession, mbSession, mindbodySignUpUrl } = useAuth();
  const bookMutation = useBookService();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const bookingInFlightRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState<MindbodyClass | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingErrorRequiresSignIn, setBookingErrorRequiresSignIn] = useState(false);
  const [bookingOutcomeUncertain, setBookingOutcomeUncertain] = useState(false);
  const [needsCardOnFile, setNeedsCardOnFile] = useState(false);
  const [cardSetupRetryHint, setCardSetupRetryHint] = useState<string | null>(null);

  const serviceLabel = resolveDisplayName(bookingService?.title ?? clsName);
  const { data: membershipData, refetch: refetchMembership } = useClientMembership();
  const accountUrl = mindbodyClientAccountUrl();

  const checkoutSummary =
    isAuthenticated && currentStep === 2
      ? buildCommunalContrastCheckoutSummary(serviceLabel, membershipData?.clientServices, {
          needsCardOnFile,
        })
      : null;

  useEffect(() => {
    if (
      isAuthenticated &&
      currentStep === 2 &&
      checkoutSummary &&
      !checkoutSummary.pass &&
      sessionNeedsPaymentCard(mbSession?.sessionId)
    ) {
      setNeedsCardOnFile(true);
    }
  }, [isAuthenticated, currentStep, checkoutSummary, mbSession?.sessionId]);

  const { startDate, endDate } = bookingHorizonDateRange();

  const { data: classes = [], isLoading } = useMindbodyClasses({
    startDate,
    endDate,
    classDescriptionId: classDescriptionIds.join(','),
    enabled: classDescriptionIds.length > 0,
  });

  const allowedDescriptionIds = useMemo(
    () => new Set(classDescriptionIds.map((id) => Number(id))),
    [classDescriptionIds],
  );

  const filteredClasses = useMemo(() => {
    return filterUpcomingSessions(classes)
      .filter(
        (c) =>
          allowedDescriptionIds.has(Number(c.classDescriptionId)) && !c.isCanceled,
      )
      .sort((a, b) => parseMindbodyDateTime(a.startDateTime).getTime() - parseMindbodyDateTime(b.startDateTime).getTime());
  }, [classes, allowedDescriptionIds]);

  const availableDates = useMemo(() => {
    const seen = new Map<string, Date>();
    for (const cls of filteredClasses) {
      const day = studioCalendarDate(cls.startDateTime);
      const key = mindbodyDateKey(cls.startDateTime);
      if (!seen.has(key)) seen.set(key, day);
    }
    return Array.from(seen.values());
  }, [filteredClasses]);

  /** Group sessions by calendar week, then by day (through the booking horizon). */
  const scheduleByWeek = useMemo(() => {
    const weekMap = new Map<
      string,
      { weekStart: Date; label: string; days: { date: Date; dayKey: string; sessions: MindbodyClass[] }[] }
    >();

    for (const cls of filteredClasses) {
      const day = studioCalendarDate(cls.startDateTime);
      const dayKey = mindbodyDateKey(cls.startDateTime);
      const weekStart = startOfWeek(day, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStart,
          label: weekLabel(weekStart),
          days: [],
        });
      }

      const week = weekMap.get(weekKey)!;
      let dayGroup = week.days.find((d) => d.dayKey === dayKey);
      if (!dayGroup) {
        dayGroup = { date: day, dayKey, sessions: [] };
        week.days.push(dayGroup);
      }
      dayGroup.sessions.push(cls);
    }

    return Array.from(weekMap.values()).sort(
      (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
    );
  }, [filteredClasses]);

  const scrollToDay = useCallback((dayKey: string) => {
    const el = document.getElementById(`class-day-${dayKey}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedClass(null);
    if (date) {
      scrollToDay(format(date, 'yyyy-MM-dd'));
    }
  };

  const handleClassSelect = (cls: MindbodyClass) => {
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
    setSelectedClass(cls);
    setCurrentStep(2);
  };

  useEffect(() => {
    if (!resumeClassId || filteredClasses.length === 0) return;
    const match = filteredClasses.find((c) => c.id === resumeClassId);
    if (match) {
      setSelectedClass(match);
      setCurrentStep(2);
    }
  }, [resumeClassId, filteredClasses]);

  useEffect(() => {
    if (isAuthenticated) {
      setBookingError(null);
      setBookingErrorRequiresSignIn(false);
      setBookingOutcomeUncertain(false);
    }
  }, [isAuthenticated]);

  const idempotencyKey = useMemo(() => {
    if (!selectedClass || !mbSession?.sessionId) return undefined;
    return buildSlotBookingIdempotencyKey({
      sessionId: mbSession.sessionId,
      bookingType: 'class',
      classId: selectedClass.id,
      startDateTime: selectedClass.startDateTime,
    });
  }, [selectedClass, mbSession?.sessionId]);

  const startSignIn = (cls?: MindbodyClass | null) => {
    const target = cls ?? selectedClass;
    if (bookingService) {
      stashPendingBooking(bookingService, {
        selectedClassId: target?.id,
      });
    }
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
    logout();
    login({ clearSession: true });
  };

  const startCreateAccount = (cls?: MindbodyClass | null) => {
    const target = cls ?? selectedClass;
    if (bookingService) {
      stashPendingBooking(bookingService, {
        selectedClassId: target?.id,
      });
    }
    setBookingError(null);
    setBookingErrorRequiresSignIn(false);
    setBookingOutcomeUncertain(false);
    const url = mindbodySignUpUrl || resolveMindbodySignUpUrl();
    openMindbodyExternalUrl(url);
  };

  const handleBook = async () => {
    if (!selectedClass || bookingComplete || bookingInFlightRef.current || bookMutation.isPending) {
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
      await refetchMembership();
      await bookMutation.mutateAsync({
        bookingType: 'class',
        classId: selectedClass.id,
        locationId: selectedClass.locationId,
        serviceName: selectedClass.name,
        startDateTime: selectedClass.startDateTime,
        endDateTime: selectedClass.endDateTime,
        locationName: selectedClass.locationName,
        staffName: selectedClass.staffName,
        idempotencyKey,
      });
      setBookingComplete(true);
      setNeedsCardOnFile(false);
      clearSessionNeedsPaymentCard();
    } catch (error: unknown) {
      bookingInFlightRef.current = false;
      setIsSubmitting(false);
      if (error instanceof BookingMutationError) {
        if (
          error.flags.noStoredCard ||
          error.flags.cardDeclined ||
          (error.flags.siteScopeIssue && error.flags.paymentRequired)
        ) {
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
    }
  };

  const handleConfirm = () => {
    if (!selectedClass || bookingComplete || isSubmitting || bookMutation.isPending) return;
    if (!isAuthenticated) {
      startSignIn(selectedClass);
      return;
    }
    void handleBook();
  };

  if (bookingComplete && selectedClass) {
    return (
      <BookingConfirmationSuccess
        details={{
          serviceName: selectedClass.name,
          startDateTime: selectedClass.startDateTime,
          endDateTime: selectedClass.endDateTime,
          staffName: selectedClass.staffName,
          locationName: selectedClass.locationName,
        }}
        onDone={onClose}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No upcoming sessions found for {clsName}.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5 pb-4"
    >
      <BookingSteps steps={STEPS} currentStep={currentStep} className="mb-1" />

      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pick a date
            </h3>
            <BookingCalendar
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
              availableDates={availableDates}
              isLoading={isLoading}
              toDate={bookingHorizonEndDate()}
            />
          </div>

          <div className="space-y-4" ref={scheduleRef}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Upcoming sessions
              </h3>
              {selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs h-8"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Show all
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {scheduleByWeek.map((week) => (
                <section key={format(week.weekStart, 'yyyy-MM-dd')} className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-[1]">
                    {week.label}
                  </h4>
                  {week.days.map((day) => {
                    const isHighlighted =
                      !selectedDate || isSameDay(day.date, selectedDate);
                    if (selectedDate && !isHighlighted) return null;

                    return (
                      <div
                        key={day.dayKey}
                        id={`class-day-${day.dayKey}`}
                        className="space-y-2 scroll-mt-4"
                      >
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isSameDay(day.date, studioCalendarDate(studioTodayKey()))
                              ? 'text-primary'
                              : 'text-foreground/80',
                          )}
                        >
                          {dayHeading(day.date)}
                        </p>
                        <div className="space-y-2">
                          {day.sessions.map((cls) => (
                            <ClassSlotButton
                              key={cls.id}
                              cls={cls}
                              onSelect={handleClassSelect}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && selectedClass && (
        <div className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Confirm Booking
            </h3>
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-sm">
              <h4 className="font-semibold text-base text-foreground">
                {resolveDisplayName(selectedClass.name)}
              </h4>
              {(() => {
                const confirmDescription = resolveGroupDescription(
                  selectedClass.description,
                  resolveDisplayName(selectedClass.name),
                );
                if (!confirmDescription) return null;
                return (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resolveDisplayText(stripHtml(confirmDescription))}
                  </p>
                );
              })()}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {formatMindbodyDate(selectedClass.startDateTime, 'EEE, MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {formatAppointmentTimeRange(
                      selectedClass.startDateTime,
                      selectedClass.endDateTime,
                    )}
                  </span>
                </div>
                {selectedClass.staffName && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="leading-snug">{resolveDisplayName(selectedClass.staffName)}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="leading-snug">{normaliseBrand(selectedClass.locationName)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {selectedClass.availableSpots <= 0
                      ? 'Fully booked'
                      : `${selectedClass.availableSpots} spot${selectedClass.availableSpots !== 1 ? 's' : ''} remaining`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <BookingConfirmActions
              onChangeTime={() => {
                setBookingError(null);
                setBookingErrorRequiresSignIn(false);
                setBookingOutcomeUncertain(false);
                setNeedsCardOnFile(false);
                setCardSetupRetryHint(null);
                setSelectedClass(null);
                setCurrentStep(1);
              }}
              onConfirm={
                !isAuthenticated || bookingErrorRequiresSignIn
                  ? () => startSignIn(selectedClass)
                  : handleConfirm
              }
              isAuthenticated={isAuthenticated}
              isPending={bookMutation.isPending || isSubmitting}
              changeTimeLabel="Change session"
              bookingError={bookingError}
              bookingErrorRequiresSignIn={bookingErrorRequiresSignIn}
              bookingOutcomeUncertain={bookingOutcomeUncertain}
              checkoutSummary={checkoutSummary}
              onCreateAccount={() => startCreateAccount(selectedClass)}
              needsCardOnFile={needsCardOnFile}
              accountUrl={accountUrl}
              onContinueAfterCard={handleBook}
              cardSetupRetryHint={cardSetupRetryHint}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClassScheduleFlow;
