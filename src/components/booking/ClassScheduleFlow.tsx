import { useState, useMemo, useRef, useCallback } from 'react';
import {
  format,
  addDays,
  startOfDay,
  isSameDay,
  startOfWeek,
  addWeeks,
} from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMindbodyClasses, MindbodyClass } from '@/hooks/useMindbodyServices';
import { useAuth } from '@/contexts/AuthContext';
import { useBookService } from '@/hooks/useMindbodyBookings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BookingCalendar from '@/components/booking/BookingCalendar';
import BookingSteps from '@/components/booking/BookingSteps';
import BookingConfirmActions from '@/components/booking/BookingConfirmActions';
import { filterUpcomingSessions } from '@/lib/sessionTimes';
import { resolveDisplayName } from '@/config/serviceConfig';

const stripHtml = (html: string) => {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
  return html.replace(/<[^>]*>?/gm, '');
};

const normaliseBrand = (value: string | null | undefined): string =>
  (value ?? '').replace(/re[\s-]?base/gi, 'Rebase');

const STEPS = [
  { id: 1, label: 'Schedule' },
  { id: 2, label: 'Confirm' },
];

const SCHEDULE_WEEKS_AHEAD = 30;

function weekLabel(weekStart: Date): string {
  const today = new Date();
  const thisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const nextWeek = addWeeks(thisWeek, 1);
  if (isSameDay(weekStart, thisWeek)) return 'This week';
  if (isSameDay(weekStart, nextWeek)) return 'Next week';
  return `Week of ${format(weekStart, 'EEE, MMM d')}`;
}

function dayHeading(date: Date): string {
  const today = startOfDay(new Date());
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
        'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
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
            {format(new Date(cls.startDateTime), 'h:mm a')}
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
          'text-xs flex items-center gap-1 shrink-0 whitespace-nowrap',
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
}

const ClassScheduleFlow = ({ classDescriptionIds, className: clsName, onClose }: ClassScheduleFlowProps) => {
  const { isAuthenticated, login } = useAuth();
  const bookMutation = useBookService();
  const scheduleRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState<MindbodyClass | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const startDate = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), SCHEDULE_WEEKS_AHEAD), 'yyyy-MM-dd');

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
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [classes, allowedDescriptionIds]);

  const availableDates = useMemo(() => {
    const seen = new Map<string, Date>();
    for (const cls of filteredClasses) {
      const day = startOfDay(new Date(cls.startDateTime));
      const key = format(day, 'yyyy-MM-dd');
      if (!seen.has(key)) seen.set(key, day);
    }
    return Array.from(seen.values());
  }, [filteredClasses]);

  /** Group sessions by calendar week, then by day (next 30 days). */
  const scheduleByWeek = useMemo(() => {
    const weekMap = new Map<
      string,
      { weekStart: Date; label: string; days: { date: Date; dayKey: string; sessions: MindbodyClass[] }[] }
    >();

    for (const cls of filteredClasses) {
      const day = startOfDay(new Date(cls.startDateTime));
      const dayKey = format(day, 'yyyy-MM-dd');
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
    setSelectedClass(cls);
    setCurrentStep(2);
  };

  const handleBook = async () => {
    if (!selectedClass) return;

    try {
      await bookMutation.mutateAsync({
        bookingType: 'class',
        classId: selectedClass.id,
        serviceName: selectedClass.name,
        startDateTime: selectedClass.startDateTime,
        endDateTime: selectedClass.endDateTime,
        locationName: selectedClass.locationName,
        staffName: selectedClass.staffName,
      });
      setBookingComplete(true);
      toast.success('Class booked successfully!');
    } catch (error: unknown) {
      const msg = (error instanceof Error ? error.message : '').toLowerCase();
      if (
        msg.includes('site id does not match') ||
        msg.includes('session not found') ||
        msg.includes('session expired') ||
        msg.includes('please log in')
      ) {
        toast.error('Your sign-in expired. Please sign in again.', {
          action: { label: 'Sign in', onClick: () => login() },
        });
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to book class. Please try again.');
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedClass) return;
    if (!isAuthenticated) {
      login();
      return;
    }
    handleBook();
  };

  if (bookingComplete && selectedClass) {
    return (
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
          <h3 className="text-xl font-semibold text-foreground">Class Booked!</h3>
          <p className="text-sm text-muted-foreground">You&apos;re all set.</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-left text-sm">
          <div className="font-medium text-foreground">{resolveDisplayName(selectedClass.name)}</div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{format(new Date(selectedClass.startDateTime), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {format(new Date(selectedClass.startDateTime), 'h:mm a')} –{' '}
              {format(new Date(selectedClass.endDateTime), 'h:mm a')}
            </span>
          </div>
          {selectedClass.staffName && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{selectedClass.staffName}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{normaliseBrand(selectedClass.locationName)}</span>
          </div>
        </div>
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </motion.div>
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
      className="space-y-5"
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
              toDate={addDays(new Date(), SCHEDULE_WEEKS_AHEAD)}
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

            <div className="space-y-6 max-h-[min(50vh,28rem)] overflow-y-auto pr-1 -mr-1">
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
                            isSameDay(day.date, new Date())
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
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Confirm Booking
          </h3>
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-sm">
            <h4 className="font-semibold text-base text-foreground">
              {resolveDisplayName(selectedClass.name)}
            </h4>
            {selectedClass.description && (
              <p className="text-sm text-muted-foreground">
                {stripHtml(selectedClass.description)}
              </p>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {format(new Date(selectedClass.startDateTime), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {format(new Date(selectedClass.startDateTime), 'h:mm a')} –{' '}
                  {format(new Date(selectedClass.endDateTime), 'h:mm a')}
                </span>
              </div>
              {selectedClass.staffName && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{selectedClass.staffName}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{normaliseBrand(selectedClass.locationName)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {selectedClass.availableSpots <= 0
                    ? 'Fully booked'
                    : `${selectedClass.availableSpots} spot${selectedClass.availableSpots !== 1 ? 's' : ''} remaining`}
                </span>
              </div>
            </div>
          </div>

          <BookingConfirmActions
            onChangeTime={() => {
              setSelectedClass(null);
              setCurrentStep(1);
            }}
            onConfirm={handleConfirm}
            isAuthenticated={isAuthenticated}
            isPending={bookMutation.isPending}
            changeTimeLabel="Change session"
          />
        </div>
      )}
    </motion.div>
  );
};

export default ClassScheduleFlow;
