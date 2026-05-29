import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  clearPendingBooking,
  peekPendingBooking,
  stashPendingBooking,
  type PendingBooking,
} from '@/lib/bookingResume';

/**
 * After Mindbody OAuth, reopen the booking drawer the user had in progress.
 */
export function useResumePendingBooking(onResume: (pending: PendingBooking) => void) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const resumedRef = useRef(false);

  useEffect(() => {
    if (isLoading || resumedRef.current) return;

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

    if (!isAuthenticated) return;

    clearPendingBooking();
    resumedRef.current = true;
    onResume(pending);
  }, [isLoading, isAuthenticated, location.pathname, location.hash, navigate, onResume]);
}
