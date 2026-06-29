import { useState, useEffect, useMemo, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { useWidget, GroupedService, ServiceVariant } from '../context/WidgetContext';
import { createApiClient, AvailableItem } from '../api/client';
import { filterUpcomingSessions } from '../../lib/sessionTimes';
import { buildSlotBookingIdempotencyKey } from '../../lib/bookingIdempotency';
import { BookingCalendar } from './BookingCalendar';
import { TimeSlotPicker } from './TimeSlotPicker';

interface BookingModalProps {
  service: GroupedService;
  onClose: () => void;
}

type BookingStep = 'variant' | 'date' | 'time' | 'confirm' | 'success';

export function BookingModal({ service, onClose }: BookingModalProps) {
  const { config, session, isAuthenticated, login } = useWidget();
  const hasVariants = service.variants.length > 1;

  const [step, setStep] = useState<BookingStep>(hasVariants ? 'variant' : 'date');
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(
    hasVariants ? null : service.variants[0]
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<AvailableItem | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableItem[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bookingInFlightRef = useRef(false);

  const idempotencyKey = useMemo(() => {
    if (!selectedSlot || !session?.sessionId) return undefined;
    return buildSlotBookingIdempotencyKey({
      sessionId: session.sessionId,
      bookingType: 'appointment',
      sessionTypeId: selectedSlot.sessionTypeId.toString(),
      staffId: selectedSlot.staffId.toString(),
      startDateTime: selectedSlot.startDateTime,
    });
  }, [selectedSlot, session?.sessionId]);

  const client = useMemo(() => createApiClient(config.apiUrl), [config.apiUrl]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || !selectedVariant) return;

    setIsLoadingSlots(true);
    setAvailableSlots([]);

    client.getAvailability({
      sessionTypeId: selectedVariant.id,
      startDate: format(selectedDate, 'yyyy-MM-dd'),
    })
      .then(data => {
        const items = filterUpcomingSessions(data.availableItems || []);
        const forDay = items.filter((slot) =>
          selectedDate ? isSameDay(new Date(slot.startDateTime), selectedDate) : true,
        );
        setAvailableSlots(forDay);
        setIsLoadingSlots(false);
      })
      .catch(() => {
        setIsLoadingSlots(false);
      });
  }, [selectedDate, selectedVariant, client]);

  const handleVariantSelect = (variant: ServiceVariant) => {
    setSelectedVariant(variant);
    setStep('date');
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      setStep('time');
    }
  };

  const handleSlotSelect = (slot: AvailableItem) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const handleBack = () => {
    switch (step) {
      case 'date':
        if (hasVariants) setStep('variant');
        else onClose();
        break;
      case 'time':
        setStep('date');
        break;
      case 'confirm':
        setStep('time');
        break;
      default:
        onClose();
    }
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!selectedSlot || !session || !selectedVariant || bookingInFlightRef.current || isBooking) return;

    bookingInFlightRef.current = true;
    setIsBooking(true);
    setError(null);

    try {
      await client.bookService({
        sessionId: session.sessionId,
        bookingType: 'appointment',
        sessionTypeId: selectedSlot.sessionTypeId.toString(),
        staffId: selectedSlot.staffId.toString(),
        locationId: selectedSlot.locationId,
        startDateTime: selectedSlot.startDateTime,
        serviceName: selectedVariant.name,
        idempotencyKey,
      });
      setStep('success');
    } catch (err) {
      bookingInFlightRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to book. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const displayPrice = selectedVariant?.price 
    ? `£${selectedVariant.price.toFixed(2)}` 
    : 'Contact for pricing';
  const displayDuration = selectedVariant?.duration 
    ? `${selectedVariant.duration} min` 
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[hsl(25,18%,12%)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(25,10%,20%)]">
          <button 
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-[hsl(25,10%,15%)] transition-colors text-[hsl(35,15%,88%)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-[hsl(35,15%,88%)]">
            {step === 'success' ? 'Booking Confirmed' : `Book ${service.baseName}`}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[hsl(25,10%,15%)] transition-colors text-[hsl(35,15%,88%)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Variant Selection */}
          {step === 'variant' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[hsl(35,8%,55%)] mb-4">Select Treatment Type</h3>
              {service.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-[hsl(25,10%,20%)] hover:border-[hsl(35,15%,75%)]/50 hover:bg-[hsl(25,10%,15%)] transition-all text-left"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-medium text-[hsl(35,15%,88%)]">{variant.name}</div>
                    {variant.description && (
                      <div className="text-xs text-[hsl(35,8%,55%)] mt-1 leading-relaxed line-clamp-2">
                        {variant.description.replace(/<[^>]*>/g, '').trim()}
                      </div>
                    )}
                    <div className="text-sm text-[hsl(35,8%,55%)] flex items-center gap-3 mt-1">
                      {variant.isPack && variant.packSessionCount ? (
                        <span>{variant.packSessionCount} sessions</span>
                      ) : variant.duration ? (
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {variant.duration} min
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="font-semibold text-[hsl(35,15%,88%)]">
                    {variant.price ? `£${variant.price.toFixed(2)}` : 'Contact'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Date Selection */}
          {step === 'date' && (
            <div>
              <h3 className="text-sm font-medium text-[hsl(35,8%,55%)] mb-4">Select a Date</h3>
              <BookingCalendar
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
              />
            </div>
          )}

          {/* Time Selection */}
          {step === 'time' && (
            <div>
              <h3 className="text-sm font-medium text-[hsl(35,8%,55%)] mb-4">
                Select a Time — {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
              </h3>
              <TimeSlotPicker
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelect={handleSlotSelect}
                isLoading={isLoadingSlots}
              />
            </div>
          )}

          {/* Confirmation */}
          {step === 'confirm' && selectedSlot && (
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-[hsl(35,8%,55%)] mb-4">Confirm Booking</h3>
              
              {/* Service Summary */}
              <div className="bg-[hsl(25,12%,15%)] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <img 
                    src={service.image} 
                    alt={service.baseName}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-[hsl(35,15%,88%)]">{selectedVariant?.name || service.baseName}</h4>
                    <div className="text-sm text-[hsl(35,8%,55%)] flex items-center gap-2">
                      {displayDuration && <span>{displayDuration}</span>}
                      <span className="font-medium text-[hsl(35,15%,88%)]">{displayPrice}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-[hsl(25,10%,20%)] pt-3 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-[hsl(35,15%,88%)]">
                    <svg className="h-4 w-4 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {format(new Date(selectedSlot.startDateTime), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[hsl(35,15%,88%)]">
                    <svg className="h-4 w-4 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {format(new Date(selectedSlot.startDateTime), 'h:mm a')}
                  </div>
                  {selectedSlot.staffName && (
                    <div className="flex items-center gap-3 text-sm text-[hsl(35,15%,88%)]">
                      <svg className="h-4 w-4 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {selectedSlot.staffName}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-[hsl(35,15%,88%)]">
                    <svg className="h-4 w-4 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {selectedSlot.locationName}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {!isAuthenticated && (
                <p className="text-sm text-[hsl(35,8%,55%)]">
                  Sign in with your Mindbody account to complete this booking.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('time')}
                  disabled={isBooking}
                  className="flex-1 py-3 border border-[hsl(25,10%,25%)] text-[hsl(35,15%,88%)] font-medium rounded-xl hover:bg-[hsl(25,12%,18%)] transition-colors disabled:opacity-50"
                >
                  Change Time
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                  className="flex-1 py-3 bg-[hsl(35,15%,75%)] text-[hsl(25,8%,8%)] font-semibold rounded-xl hover:bg-[hsl(35,15%,80%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBooking ? 'Booking...' : isAuthenticated ? 'Confirm Booking' : 'Sign In to Book'}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && selectedSlot && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-[hsl(35,15%,88%)]">Booking Confirmed!</h3>
                <p className="text-[hsl(35,8%,55%)] mt-1">Your appointment has been booked successfully.</p>
              </div>

              <div className="bg-[hsl(25,12%,15%)] rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center gap-3 text-sm text-[hsl(35,15%,88%)]">
                  <svg className="h-4 w-4 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {format(new Date(selectedSlot.startDateTime), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-3 text-sm text-[hsl(35,15%,88%)]">
                  <svg className="h-4 w-4 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {format(new Date(selectedSlot.startDateTime), 'h:mm a')}
                </div>
                <div className="flex items-center gap-3 text-sm text-[hsl(35,15%,88%)]">
                  <svg className="h-4 w-4 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {selectedSlot.locationName}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-[hsl(25,10%,15%)] text-[hsl(35,15%,88%)] font-medium rounded-xl hover:bg-[hsl(25,12%,18%)] transition-colors border border-[hsl(25,10%,20%)]"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
