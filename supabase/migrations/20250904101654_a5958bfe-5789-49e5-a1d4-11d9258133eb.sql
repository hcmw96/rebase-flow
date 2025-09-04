-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing MINDBODY OAuth connections
CREATE TABLE public.mb_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  site_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mb_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for mb_connections
CREATE POLICY "Users can view their own mb connections" 
ON public.mb_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mb connections" 
ON public.mb_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mb connections" 
ON public.mb_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mb connections" 
ON public.mb_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for caching MINDBODY classes
CREATE TABLE public.mb_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mb_class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location_id TEXT,
  location_name TEXT,
  instructor_name TEXT,
  description TEXT,
  booking_available BOOLEAN DEFAULT true,
  is_cancelled BOOLEAN DEFAULT false,
  max_capacity INTEGER,
  current_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for public access to classes
ALTER TABLE public.mb_classes ENABLE ROW LEVEL SECURITY;

-- Create policies for mb_classes (public read access)
CREATE POLICY "Classes are viewable by everyone" 
ON public.mb_classes 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates on mb_connections
CREATE TRIGGER update_mb_connections_updated_at
BEFORE UPDATE ON public.mb_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on mb_classes
CREATE TRIGGER update_mb_classes_updated_at
BEFORE UPDATE ON public.mb_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique index on mb_class_id to prevent duplicates
CREATE UNIQUE INDEX idx_mb_classes_mb_class_id ON public.mb_classes(mb_class_id);

-- Create index on user_id for mb_connections
CREATE INDEX idx_mb_connections_user_id ON public.mb_connections(user_id);