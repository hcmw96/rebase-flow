-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'receptionist', 'practitioner');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    date_of_birth DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    preferences JSONB DEFAULT '{}',
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staff table
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    specialties TEXT[],
    hourly_rate DECIMAL(10,2),
    commission_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 1,
    equipment JSONB DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    requires_room BOOLEAN DEFAULT false,
    max_capacity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    price DECIMAL(10,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create packages table
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
    sessions_included INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    validity_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client packages table
CREATE TABLE public.client_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE RESTRICT NOT NULL,
    sessions_remaining INTEGER NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create memberships table
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    benefits JSONB DEFAULT '{}',
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client memberships table
CREATE TABLE public.client_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    membership_id UUID REFERENCES public.memberships(id) ON DELETE RESTRICT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'cancelled', 'expired')),
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'cash', 'bank_transfer')),
    transaction_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create waivers table
CREATE TABLE public.waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client waivers table
CREATE TABLE public.client_waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    waiver_id UUID REFERENCES public.waivers(id) ON DELETE RESTRICT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    signature_data TEXT,
    ip_address INET,
    UNIQUE(client_id, waiver_id)
);

-- Create inventory table for retail items
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = $1 ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'manager' THEN 2 
      WHEN 'receptionist' THEN 3 
      WHEN 'practitioner' THEN 4 
    END LIMIT 1;
$$;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for profiles
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Staff can view all profiles" ON public.profiles
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

-- Create RLS policies for clients
CREATE POLICY "Staff can manage clients" ON public.clients
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist'));

CREATE POLICY "Practitioners can view clients" ON public.clients
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'practitioner');

-- Create RLS policies for staff
CREATE POLICY "All staff can view staff" ON public.staff
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Managers can manage staff" ON public.staff
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for rooms
CREATE POLICY "Staff can view rooms" ON public.rooms
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Managers can manage rooms" ON public.rooms
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for services
CREATE POLICY "Staff can view services" ON public.services
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Managers can manage services" ON public.services
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for bookings
CREATE POLICY "Staff can view all bookings" ON public.bookings
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Reception staff can manage bookings" ON public.bookings
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist'));

-- Create RLS policies for packages
CREATE POLICY "Staff can view packages" ON public.packages
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Managers can manage packages" ON public.packages
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for client packages
CREATE POLICY "Staff can view client packages" ON public.client_packages
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Reception staff can manage client packages" ON public.client_packages
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist'));

-- Create RLS policies for memberships
CREATE POLICY "Staff can view memberships" ON public.memberships
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Managers can manage memberships" ON public.memberships
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for client memberships
CREATE POLICY "Staff can view client memberships" ON public.client_memberships
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Reception staff can manage client memberships" ON public.client_memberships
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist'));

-- Create RLS policies for payments
CREATE POLICY "Staff can view payments" ON public.payments
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Reception staff can manage payments" ON public.payments
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist'));

-- Create RLS policies for waivers
CREATE POLICY "Staff can view waivers" ON public.waivers
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Managers can manage waivers" ON public.waivers
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Create RLS policies for client waivers
CREATE POLICY "Staff can view client waivers" ON public.client_waivers
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Reception staff can manage client waivers" ON public.client_waivers
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist'));

-- Create RLS policies for inventory
CREATE POLICY "Staff can view inventory" ON public.inventory
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist', 'practitioner'));

CREATE POLICY "Reception staff can manage inventory" ON public.inventory
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager', 'receptionist'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_client_memberships_updated_at
  BEFORE UPDATE ON public.client_memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create profile trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.services (name, description, duration_minutes, price, category) VALUES
('Personal Training', 'One-on-one fitness training session', 60, 75.00, 'Fitness'),
('Yoga Class', 'Group yoga session for all levels', 90, 25.00, 'Wellness'),
('Massage Therapy', 'Therapeutic massage treatment', 60, 85.00, 'Therapy'),
('Nutrition Consultation', 'Personalized nutrition planning', 45, 65.00, 'Consultation');

INSERT INTO public.rooms (name, capacity, hourly_rate) VALUES
('Studio A', 20, 50.00),
('Studio B', 15, 40.00),
('Treatment Room 1', 1, 30.00),
('Treatment Room 2', 1, 30.00);

INSERT INTO public.memberships (name, description, monthly_price, benefits) VALUES
('Basic Membership', 'Access to group classes and basic facilities', 79.99, '{"classes": "unlimited", "facilities": "basic"}'),
('Premium Membership', 'Full access including personal training credits', 149.99, '{"classes": "unlimited", "facilities": "full", "pt_sessions": 2}');

INSERT INTO public.packages (name, description, service_id, sessions_included, price, validity_days) VALUES
('PT Package - 5 Sessions', '5 personal training sessions', (SELECT id FROM public.services WHERE name = 'Personal Training'), 5, 350.00, 180),
('Yoga Package - 10 Sessions', '10 group yoga classes', (SELECT id FROM public.services WHERE name = 'Yoga Class'), 10, 200.00, 365);

INSERT INTO public.inventory (name, description, sku, price, cost, stock_quantity, category) VALUES
('Protein Powder - Vanilla', 'High-quality whey protein powder', 'PROT-VAN-001', 45.99, 28.00, 24, 'Supplements'),
('Yoga Mat - Premium', 'Non-slip premium yoga mat', 'MAT-PREM-001', 35.99, 18.00, 15, 'Equipment'),
('Water Bottle - Branded', 'Studio branded stainless steel water bottle', 'BOTTLE-001', 24.99, 12.00, 30, 'Merchandise');

INSERT INTO public.waivers (name, content, version) VALUES
('General Liability Waiver', 'I understand that participation in fitness activities involves risk of injury...', 1),
('COVID-19 Health Screening', 'I confirm that I am not experiencing any COVID-19 symptoms...', 1);