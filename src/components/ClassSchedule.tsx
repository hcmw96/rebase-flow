import { useMemo } from 'react';
import { useMindbodyClasses, type MindbodyClass } from '@/hooks/useMindbodyServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  filterUpcomingSessions,
  formatMindbodyDate,
  formatMindbodyTime,
  mindbodyDateKey,
  parseMindbodyDateTime,
  studioTodayKey,
} from '@/lib/sessionTimes';
import { bookingHorizonDateRange } from '@/lib/bookingHorizon';
import { classOfferings, resolveDisplayName } from '@/config/serviceConfig';
import { ImageCardScrim } from '@/components/ImageTextScrim';
import type { BookingServiceData } from '@/components/booking/BookingDrawer';

export type ClassBookingOptions = {
  resumeClassId?: string;
};

interface ClassScheduleProps {
  onSelectService?: (service: BookingServiceData, options?: ClassBookingOptions) => void;
}

const ClassSchedule = ({ onSelectService }: ClassScheduleProps) => {
  const { startDate, endDate } = bookingHorizonDateRange();

  const { data: classes, isLoading, error } = useMindbodyClasses({
    startDate,
    endDate,
    enabled: true,
  });

  const classesByDay = useMemo(() => {
    if (!classes || classes.length === 0) return new Map<string, typeof classes>();

    const filtered = filterUpcomingSessions(classes).filter((c) => !c.isCanceled);
    filtered.sort(
      (a, b) =>
        parseMindbodyDateTime(a.startDateTime).getTime() -
        parseMindbodyDateTime(b.startDateTime).getTime(),
    );

    const grouped = new Map<string, typeof classes>();
    for (const cls of filtered) {
      const dayKey = mindbodyDateKey(cls.startDateTime);
      if (!grouped.has(dayKey)) grouped.set(dayKey, []);
      grouped.get(dayKey)!.push(cls);
    }
    return grouped;
  }, [classes]);

  const openClassBooking = (cls: MindbodyClass) => {
    if (!onSelectService || cls.availableSpots <= 0) return;

    const offering = classOfferings.find((entry) =>
      entry.classDescriptionIds.includes(cls.classDescriptionId ?? -1),
    );
    const title = resolveDisplayName(offering?.name ?? cls.name);

    onSelectService(
      {
        title,
        description: offering?.description ?? '',
        category: 'Signature Classes',
        image: offering?.image ?? '/images/rebase-class-yoga.jpg',
        variants: [],
        classDescriptionIds: offering?.classDescriptionIds ?? (
          cls.classDescriptionId ? [cls.classDescriptionId] : []
        ),
      },
      { resumeClassId: cls.id },
    );
  };

  const openClassType = (offering: (typeof classOfferings)[number]) => {
    onSelectService?.({
      title: resolveDisplayName(offering.name),
      description: offering.description,
      category: 'Signature Classes',
      image: offering.image,
      variants: [],
      classDescriptionIds: offering.classDescriptionIds,
    });
  };

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
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {classOfferings.map((cls) => (
            <button
              key={cls.name}
              type="button"
              onClick={() => openClassType(cls)}
              className="rounded-xl overflow-hidden border border-border/30 bg-black/[0.03] text-left transition-colors hover:border-primary/30"
            >
              <div className="relative h-24 overflow-hidden">
                <img src={cls.image} alt={cls.name} className="w-full h-full object-cover" loading="lazy" />
                <ImageCardScrim />
                <h4 className="absolute bottom-2 left-3 right-3 z-10 text-[#F9ECD9] text-xs font-medium drop-shadow-sm">
                  {resolveDisplayName(cls.name)}
                </h4>
              </div>
            </button>
          ))}
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No upcoming classes scheduled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {classOfferings.map((cls) => (
          <button
            key={cls.name}
            type="button"
            onClick={() => openClassType(cls)}
            className="rounded-xl overflow-hidden border border-border/30 bg-black/[0.03] text-left transition-colors hover:border-primary/30"
          >
            <div className="relative h-24 overflow-hidden">
              <img src={cls.image} alt={cls.name} className="w-full h-full object-cover" loading="lazy" />
              <ImageCardScrim />
              <h4 className="absolute bottom-2 left-3 right-3 z-10 text-[#F9ECD9] text-xs font-medium drop-shadow-sm">
                {resolveDisplayName(cls.name)}
              </h4>
            </div>
          </button>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Upcoming Schedule</h3>

      {Array.from(classesByDay.entries()).map(([dayKey, dayClasses]) => {
        const isToday = dayKey === studioTodayKey();

        return (
          <div key={dayKey}>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
              {isToday ? 'Today' : formatMindbodyDate(`${dayKey}T12:00:00`, 'EEEE, MMM d')}
            </h3>
            <div className="space-y-2">
              {dayClasses.map((cls) => {
                const startTime = formatMindbodyTime(cls.startDateTime);
                const endTime = formatMindbodyTime(cls.endDateTime);
                const spotsLeft = cls.availableSpots;
                const isFull = spotsLeft <= 0;

                return (
                  <button
                    key={cls.id}
                    type="button"
                    disabled={isFull || !onSelectService}
                    onClick={() => openClassBooking(cls)}
                    className={cn(
                      'w-full p-4 rounded-xl border transition-all text-left',
                      isFull
                        ? 'border-border/30 bg-muted/30 opacity-60 cursor-not-allowed'
                        : 'border-border/50 bg-black/[0.03] hover:border-primary/30 active:border-primary/50',
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
                          {cls.staffName && <span>{cls.staffName}</span>}
                          {cls.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cls.locationName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            'text-xs font-medium flex items-center gap-1',
                            isFull
                              ? 'text-destructive'
                              : spotsLeft <= 3
                                ? 'text-accent-foreground'
                                : 'text-muted-foreground',
                          )}
                        >
                          <Users className="h-3 w-3" />
                          {isFull ? 'Fully booked' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                  </button>
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
