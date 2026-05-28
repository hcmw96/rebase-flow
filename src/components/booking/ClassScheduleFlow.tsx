import { useState, useMemo, useEffect } from 'react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
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
  { id: 1, label: 'Date' },
  { id: 2, label: 'Time' },
  { id: 3, label: 'Confirm' },
];

interface ClassScheduleFlowProps {
  classDescriptionIds: number[];
  className: string;
  onClose: () => void;
}

const ClassScheduleFlow = ({ classDescriptionIds, className: clsName, onClose }: ClassScheduleFlowProps) => {
  const { isAuthenticated, login } = useAuth();
  const bookMutation = useBookService();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState<MindbodyClass | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const startDate = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: classes = [], isLoading } = useMindbodyClasses({
    startDate,
    endDate,
    classDescriptionId: classDescriptionIds.join(','),
    enabled: classDescriptionIds.length > 0,
  });

  const filteredClasses = useMemo(() => {
    return filterUpcomingSessions(classes)
      .filter((c) => classDescriptionIds.includes(c.classDescriptionId) && !c.isCanceled)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [classes, classDescriptionIds]);

  const availableDates = useMemo(() => {
    const seen = new Map<string, Date>();
    for (const cls of filteredClasses) {
      const day = startOfDay(new Date(cls.startDateTime));
      const key = format(day, 'yyyy-MM-dd');
      if (!seen.has(key)) seen.set(key, day);
    }
    return Array.from(seen.values());
  }, [filteredClasses]);

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
      setCurrentStep(2);
    }
  }, [availableDates, selectedDate]);

  const sessionsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return filteredClasses.filter((c) => isSameDay(new Date(c.startDateTime), selectedDate));
  }, [filteredClasses, selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedClass(null);
    if (date) setCurrentStep(2);
  };

  const handleClassSelect = (cls: MindbodyClass) => {
    setSelectedClass(cls);
    setCurrentStep(3);
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
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
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
        toast.error(error?.message || 'Failed to book class. Please try again.');
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
          <p className="text-sm text-muted-foreground">You're all set.</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-left text-sm">
          <div className="font-medium text-foreground">{selectedClass.name}</div>
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
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Select Date
          </h3>
          <BookingCalendar
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            availableDates={availableDates}
            isLoading={isLoading}
          />
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Select Time
            {selectedDate && (
              <span className="text-foreground ml-2 normal-case font-normal">
                — {format(selectedDate, 'EEE, MMM d')}
              </span>
            )}
          </h3>

          {!selectedDate ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Choose a date first.</p>
          ) : sessionsForSelectedDay.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No sessions on this day.</p>
          ) : (
            <div className="space-y-2">
              {sessionsForSelectedDay.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => handleClassSelect(cls)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                    'border-border hover:border-primary/50',
                  )}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{cls.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(cls.startDateTime), 'h:mm a')}
                      </span>
                      {cls.staffName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {cls.staffName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {normaliseBrand(cls.locationName)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <Users className="h-3 w-3 shrink-0" />
                    {cls.availableSpots} spots
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {currentStep === 3 && selectedClass && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Confirm Booking
          </h3>
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-sm">
            <h4 className="font-semibold text-base text-foreground">{selectedClass.name}</h4>
            {selectedClass.description && (
              <p className="text-sm text-muted-foreground">{stripHtml(selectedClass.description)}</p>
            )}
            <div className="space-y-2">
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
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{selectedClass.availableSpots} spots remaining</span>
              </div>
            </div>
          </div>

          <BookingConfirmActions
            onChangeTime={() => {
              setSelectedClass(null);
              setCurrentStep(2);
            }}
            onConfirm={handleConfirm}
            isAuthenticated={isAuthenticated}
            isPending={bookMutation.isPending}
            changeTimeLabel="Change Time"
          />
        </div>
      )}
    </motion.div>
  );
};

export default ClassScheduleFlow;
