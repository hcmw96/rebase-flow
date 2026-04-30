import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Users, CheckCircle, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMindbodyClasses, MindbodyClass } from '@/hooks/useMindbodyServices';
import { useAuth } from '@/contexts/AuthContext';
import { useBookService } from '@/hooks/useMindbodyBookings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const stripHtml = (html: string) => {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
  return html.replace(/<[^>]*>?/gm, '');
};

interface ClassScheduleFlowProps {
  classDescriptionIds: number[];
  className: string;
  onClose: () => void;
}

const ClassScheduleFlow = ({ classDescriptionIds, className: clsName, onClose }: ClassScheduleFlowProps) => {
  const { mbSession, isAuthenticated, login } = useAuth();
  const bookMutation = useBookService();

  const [selectedClass, setSelectedClass] = useState<MindbodyClass | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [showAll, setShowAll] = useState(true);

  const startDate = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  // Fetch classes for all classDescriptionIds
  const { data: classes = [], isLoading } = useMindbodyClasses({
    startDate,
    endDate,
    classDescriptionId: classDescriptionIds.join(','),
    enabled: classDescriptionIds.length > 0,
  });

  // Filter to matching classDescriptionIds and not cancelled
  const filteredClasses = useMemo(() => {
    return classes
      .filter(c => classDescriptionIds.includes(c.classDescriptionId) && !c.isCanceled)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [classes, classDescriptionIds]);

  // Split into next session and rest
  const nextSession = filteredClasses[0] ?? null;
  const otherSessions = filteredClasses.slice(1);

  // Group remaining sessions by day
  const otherGroupedByDay = useMemo(() => {
    const map = new Map<string, MindbodyClass[]>();
    for (const cls of otherSessions) {
      const day = format(new Date(cls.startDateTime), 'yyyy-MM-dd');
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(cls);
    }
    return map;
  }, [otherSessions]);

  const handleBook = async () => {
    if (!selectedClass || !mbSession) return;

    try {
      await bookMutation.mutateAsync({
        bookingType: 'class',
        classId: selectedClass.id,
        serviceName: selectedClass.name,
      });
      setBookingComplete(true);
      toast.success('Class booked successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to book class. Please try again.');
    }
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
              {format(new Date(selectedClass.startDateTime), 'h:mm a')} – {format(new Date(selectedClass.endDateTime), 'h:mm a')}
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
            <span>{selectedClass.locationName}</span>
          </div>
        </div>
        <Button onClick={onClose} className="w-full">Done</Button>
      </motion.div>
    );
  }

  if (selectedClass) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3 text-sm">
          <h3 className="font-semibold text-base text-foreground">{selectedClass.name}</h3>
          {selectedClass.description && (
            <p className="text-sm text-muted-foreground">
              {stripHtml(selectedClass.description)}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{format(new Date(selectedClass.startDateTime), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {format(new Date(selectedClass.startDateTime), 'h:mm a')} – {format(new Date(selectedClass.endDateTime), 'h:mm a')}
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
              <span>{selectedClass.locationName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{selectedClass.availableSpots} spots remaining</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setSelectedClass(null)} className="flex-1">
            Back
          </Button>
          <Button
            onClick={isAuthenticated ? handleBook : login}
            disabled={bookMutation.isPending}
            className="flex-1"
          >
            {bookMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Booking...</>
            ) : isAuthenticated ? (
              'Confirm Booking'
            ) : (
              'Sign In to Book'
            )}
          </Button>
        </div>
      </motion.div>
    );
  }


  const renderClassButton = (cls: MindbodyClass) => (
    <button
      key={cls.id}
      onClick={() => setSelectedClass(cls)}
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
        'border-border hover:border-primary/50'
      )}
    >
      <div className="space-y-1">
        <div className="font-medium text-foreground">{cls.name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-3">
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
        </div>
      </div>
      <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 whitespace-nowrap">
        <Users className="h-3 w-3 shrink-0" />
        {cls.availableSpots} spots
      </div>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !nextSession ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No upcoming sessions found for this class.
        </div>
      ) : (
        <>
          {/* Next available session */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Next Available
            </h3>
            <button
              onClick={() => setSelectedClass(nextSession)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                'border-primary/40 bg-primary/5 hover:border-primary/70'
              )}
            >
              <div className="space-y-1">
                <div className="font-medium text-foreground">{nextSession.name}</div>
                {nextSession.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {stripHtml(nextSession.description)}
                  </p>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(nextSession.startDateTime), 'EEE, MMM d')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(nextSession.startDateTime), 'h:mm a')}
                  </span>
                  {nextSession.staffName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {nextSession.staffName}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Users className="h-3 w-3 shrink-0" />
                {nextSession.availableSpots} spots
              </div>
            </button>
          </div>

          {/* Expandable remaining sessions */}
          {otherSessions.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', showAll && 'rotate-180')} />
                <span>{showAll ? 'Hide' : 'Show'} more sessions ({otherSessions.length})</span>
              </button>

              <AnimatePresence>
                {showAll && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-4"
                  >
                    {Array.from(otherGroupedByDay.entries()).map(([day, dayCls]) => (
                      <div key={day} className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {format(new Date(day), 'EEEE, MMM d')}
                        </p>
                        {dayCls.map(renderClassButton)}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ClassScheduleFlow;
