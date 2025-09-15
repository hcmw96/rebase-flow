-- First clear existing services and add the actual services from the /services page
DELETE FROM public.services;

-- Insert the actual services from the Services page
INSERT INTO public.services (name, description, category, duration_minutes, price, requires_room, max_capacity) VALUES
  -- Classes
  ('Contrast Therapy', 'Recovery therapy using temperature contrasts', 'Classes', 60, 40.00, true, 15),
  ('Breathwork', 'Guided breathing exercises for wellness', 'Classes', 60, 40.00, true, 15),
  ('Yoga', 'Mindful movement and flexibility practice', 'Classes', 60, 40.00, true, 15),
  
  -- Suites
  ('Members Contrast Suite Drop In', 'Premium contrast therapy suite access', 'Suites', 60, 65.00, true, 1),
  ('Premium Suite - 45min', 'Luxury wellness suite experience', 'Suites', 45, 240.00, true, 1),
  ('Premium Suite - 90min', 'Extended luxury wellness suite experience', 'Suites', 90, 420.00, true, 1),
  ('Infrared Suite - 45min', 'Infrared therapy session', 'Suites', 45, 190.00, true, 1),
  ('Infrared Suite - 90min', 'Extended infrared therapy session', 'Suites', 90, 330.00, true, 1),
  
  -- Tech Therapies
  ('Cryotherapy - Single', 'Whole body cryotherapy session', 'Tech Therapies', 3, 50.00, true, 1),
  ('Cryotherapy - 10 Pack', 'Pack of 10 cryotherapy sessions', 'Tech Therapies', 3, 400.00, true, 1),
  ('HBOT - Single', 'Hyperbaric oxygen therapy session', 'Tech Therapies', 60, 200.00, true, 1),
  ('HBOT - 5 Pack', 'Pack of 5 HBOT sessions', 'Tech Therapies', 60, 800.00, true, 1),
  ('HBOT - 10 Pack', 'Pack of 10 HBOT sessions', 'Tech Therapies', 60, 1600.00, true, 1),
  
  -- Massage Therapies
  ('Total Body Realignment', 'Comprehensive bodywork therapy', 'Massage Therapies', 75, 195.00, true, 1),
  ('Sports Massage', 'Therapeutic massage for athletes', 'Massage Therapies', 75, 185.00, true, 1),
  ('Lymphatic Drainage', 'Gentle massage to stimulate lymph flow', 'Massage Therapies', 75, 185.00, true, 1),
  ('Deep Tissue', 'Intensive therapeutic massage', 'Massage Therapies', 75, 185.00, true, 1),
  
  -- Manual Therapies
  ('Osteopathy Consultation', 'Comprehensive osteopathic treatment', 'Manual Therapies', 60, 210.00, true, 1),
  ('Structural Fascia Therapy', 'Specialized fascia release therapy', 'Manual Therapies', 60, 200.00, true, 1),
  
  -- Other Services
  ('IV Drip', 'Intravenous nutrient therapy', 'Other Services', 52, 350.00, true, 1),
  ('Vitamin Infusions', 'Targeted vitamin therapy', 'Other Services', 30, 80.00, true, 1);