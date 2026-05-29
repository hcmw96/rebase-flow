import { useMemo } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { useMindbodyClasses } from '@/hooks/useMindbodyServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { filterUpcomingSessions } from '@/lib/sessionTimes';
import { classOfferings, resolveDisplayName } from '@/config/serviceConfig';

const ClassSchedule = () => {
  const today = useMemo(() => new Date(), []);
  const startDate = format(today, 'yyyy-MM-dd');
  const endDate = format(addDays(today, 7), 'yyyy-MM-dd');

  const { data: classes, isLoading, error } = useMindbodyClasses({
    startDate,
    endDate,
    enabled: true,
  });

  const classesByDay = useMemo(() => {
    if (!classes || classes.length === 0) return new Map<string, typeof classes>();

    const filtered = filterUpcomingSessions(classes).filter(c => !c.isCanceled);
    filtered.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

    const grouped = new Map<string, typeof classes>();
    for (const cls of filtered) {
      const dayKey = format(new Date(cls.startDateTime), 'yyyy-MM-dd');
      if (!grouped.has(dayKey)) grouped.set(dayKey, []);
      grouped.get(dayKey)!.push(cls);
    }
    return grouped;
  }, [classes]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load classes.</p>
      </div>
    );
  }

  if (classesByDay.size === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No classes scheduled this week.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class type cards */}
      <div className="grid grid-cols-2 gap-3">
        {classOfferings.map((cls) => (
          <div key={cls.name} className="rounded-xl overflow-hidden border border-border/30 bg-black/[0.03]">
            <div className="relative h-24 overflow-hidden">
              <img src={cls.image} alt={cls.name} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h4 className="absolute bottom-2 left-3 text-white text-xs font-medium">{resolveDisplayName(cls.name)}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule heading */}
      <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Upcoming Schedule</h3>

      {Array.from(classesByDay.entries()).map(([dayKey, dayClasses]) => {
        const date = new Date(dayKey + 'T00:00:00');
        const isToday = startOfDay(date).getTime() === startOfDay(today).getTime();

        return (
          <div key={dayKey}>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
              {isToday ? 'Today' : format(date, 'EEEE, MMM d')}
            </h3>
            <div className="space-y-2">
              {dayClasses.map((cls) => {
                const startTime = format(new Date(cls.startDateTime), 'h:mm a');
                const endTime = format(new Date(cls.endDateTime), 'h:mm a');
                const spotsLeft = cls.availableSpots;
                const isFull = spotsLeft <= 0;

                return (
                  <div
                    key={cls.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      isFull
                        ? 'border-border/30 bg-muted/30 opacity-60'
                        : 'border-border/50 bg-black/[0.03] hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-medium text-foreground text-sm">{resolveDisplayName(cls.name)}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {startTime} – {endTime}
                          </span>
                          {cls.staffName && (
                            <span>{cls.staffName}</span>
                          )}
                          {cls.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cls.locationName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={cn(
                          'text-xs font-medium flex items-center gap-1',
                          isFull ? 'text-destructive' : spotsLeft <= 3 ? 'text-accent-foreground' : 'text-muted-foreground'
                        )}>
                          <Users className="h-3 w-3" />
                          {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClassSchedule;
