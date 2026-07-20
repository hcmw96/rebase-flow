import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  clearPendingBooking,
  consumeOAuthUsedPopup,
  peekPendingBooking,
  type PendingBooking,
} from '@/lib/bookingResume';

function pendingKey(pending: PendingBooking, targetPath: string): string {
  return JSON.stringify({
    path: targetPath,
    hash: pending.hash,
    title: pending.service.title,
    classId: pending.selectedClassId,
    step: pending.appointment?.currentStep,
    slot: pending.appointment?.selectedSlot?.startDateTime,
  });
}

/**
 * After Mindbody OAuth / sign-up, reopen the booking drawer in progress.
 * Mobile: same-tab redirects and bfcache back-navigation (pageshow).
 */
export function useResumePendingBooking(onResume: (pending: PendingBooking) => void) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const completedRef = useRef(false);
  const guestPromptKeyRef = useRef<string | null>(null);
  const [pageShowTick, setPageShowTick] = useState(0);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      // Only re-run resume when bfcache restore still has something to resume.
      if (!event.persisted) return;
      if (!peekPendingBooking()) return;
      completedRef.current = false;
      guestPromptKeyRef.current = null;
      setPageShowTick((n) => n + 1);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const pending = peekPendingBooking();
    if (!pending) return;

    const targetPath = pending.pathname || '/';
    const onTarget =
      location.pathname === targetPath &&
      (pending.hash ? location.hash === pending.hash : true);

    if (!onTarget) {
      navigate(`${targetPath}${pending.hash || ''}`, { replace: true });
      return;
    }

    const key = pendingKey(pending, targetPath);

    if (!isAuthenticated) {
      if (guestPromptKeyRef.current !== key) {
        guestPromptKeyRef.current = key;
        onResume(pending);
      }
      return;
    }

    if (completedRef.current) return;

    // Popup OAuth: restore the booking too — the drawer may have closed while Mindbody was open.
    consumeOAuthUsedPopup();
    clearPendingBooking();
    completedRef.current = true;
    guestPromptKeyRef.current = null;
    onResume(pending);
  }, [
    isLoading,
    isAuthenticated,
    location.pathname,
    location.hash,
    navigate,
    onResume,
    pageShowTick,
  ]);
}
