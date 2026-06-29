-- Ensure duplicate confirmed rows are removed and the slot guard index exists.
DELETE FROM public.bookings
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY session_id, booking_type, COALESCE(service_id, ''), start_time
        ORDER BY created_at ASC
      ) AS rn
    FROM public.bookings
    WHERE status = 'confirmed'
  ) ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_confirmed_session_slot_uidx
  ON public.bookings (
    session_id,
    booking_type,
    COALESCE(service_id, ''),
    start_time
  )
  WHERE status = 'confirmed';
