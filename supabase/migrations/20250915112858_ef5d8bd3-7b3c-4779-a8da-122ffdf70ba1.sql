-- Insert sample services for the booking modal
INSERT INTO public.services (name, description, category, duration_minutes, price, requires_room, max_capacity) VALUES
  ('Swedish Massage', 'Relaxing full-body massage using smooth, flowing strokes', 'Massage Therapy', 60, 120.00, true, 1),
  ('Deep Tissue Massage', 'Therapeutic massage targeting deep muscle layers', 'Massage Therapy', 90, 150.00, true, 1),
  ('Hot Stone Massage', 'Massage using heated stones to enhance relaxation', 'Massage Therapy', 75, 140.00, true, 1),
  ('Facial Treatment', 'Customized facial for all skin types', 'Skincare', 60, 90.00, true, 1),
  ('Acupuncture Session', 'Traditional Chinese medicine treatment', 'Alternative Medicine', 45, 85.00, true, 1),
  ('Yoga Class', 'Group yoga session for all levels', 'Fitness', 60, 25.00, true, 15),
  ('Personal Training', 'One-on-one fitness coaching session', 'Fitness', 60, 80.00, false, 1),
  ('Aromatherapy Massage', 'Massage with essential oils for relaxation', 'Massage Therapy', 60, 125.00, true, 1);

-- Insert sample staff members
INSERT INTO public.staff (first_name, last_name, email, phone, specialties, hourly_rate, commission_rate) VALUES
  ('Sarah', 'Johnson', 'sarah@rebasewellness.com', '555-0101', ARRAY['Swedish Massage', 'Deep Tissue'], 45.00, 0.30),
  ('Michael', 'Chen', 'michael@rebasewellness.com', '555-0102', ARRAY['Acupuncture', 'Hot Stone Massage'], 50.00, 0.35),
  ('Emma', 'Williams', 'emma@rebasewellness.com', '555-0103', ARRAY['Facial Treatment', 'Skincare'], 40.00, 0.25),
  ('David', 'Martinez', 'david@rebasewellness.com', '555-0104', ARRAY['Personal Training', 'Yoga'], 35.00, 0.20),
  ('Lisa', 'Anderson', 'lisa@rebasewellness.com', '555-0105', ARRAY['Aromatherapy', 'Swedish Massage'], 42.00, 0.28);

-- Insert sample rooms
INSERT INTO public.rooms (name, capacity, equipment, hourly_rate) VALUES
  ('Serenity Room', 1, '{"massage_table": true, "essential_oils": true, "soft_music": true}', 15.00),
  ('Harmony Suite', 1, '{"massage_table": true, "hot_stones": true, "towel_warmer": true}', 20.00),
  ('Wellness Studio', 15, '{"yoga_mats": true, "mirrors": true, "sound_system": true}', 25.00),
  ('Treatment Room A', 1, '{"facial_bed": true, "steamer": true, "skincare_products": true}', 18.00),
  ('Therapy Room B', 1, '{"acupuncture_table": true, "heat_lamp": true, "needles": true}', 16.00);

-- Insert sample clients  
INSERT INTO public.clients (first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone) VALUES
  ('Jennifer', 'Davis', 'jennifer.davis@email.com', '555-1001', 'Tom Davis', '555-1002'),
  ('Robert', 'Wilson', 'robert.wilson@email.com', '555-1003', 'Mary Wilson', '555-1004'),
  ('Amanda', 'Brown', 'amanda.brown@email.com', '555-1005', 'James Brown', '555-1006'),
  ('Christopher', 'Taylor', 'chris.taylor@email.com', '555-1007', 'Susan Taylor', '555-1008'),
  ('Michelle', 'Moore', 'michelle.moore@email.com', '555-1009', 'Kevin Moore', '555-1010');