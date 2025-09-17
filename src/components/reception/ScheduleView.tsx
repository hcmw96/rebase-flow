import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Plus, Filter, Clock, User, MapPin, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'manager' | 'receptionist' | 'practitioner';

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  notes: string;
  price: number;
  clients: { first_name: string; last_name: string; email: string; };
  services: { name: string; duration_minutes: number; price: number; };
  staff: { first_name: string; last_name: string; } | null;
  rooms: { name: string; } | null;
}

interface ScheduleViewProps {
  userRole: UserRole;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [showNewBooking, setShowNewBooking] = useState(false);

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    client_id: '',
    service_id: '',
    staff_id: '',
    room_id: '',
    start_time: '',
    notes: '',
    price: 0
  });

  const canManageBookings = ['admin', 'manager', 'receptionist'].includes(userRole);

  useEffect(() => {
    console.log('🔄 ScheduleView useEffect triggered, selectedDate:', selectedDate);
    fetchBookings();
    fetchClients();
    fetchServices();
    fetchStaff();
    fetchRooms();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (first_name, last_name, email),
          services (name, duration_minutes, price),
          staff (first_name, last_name),
          rooms (name)
        `)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time');

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchServices = async () => {
    console.log('🔍 fetchServices called');
    try {
      console.log('🌐 Making Supabase request for services...');
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      console.log('📊 Supabase services response:', { data, error });
      
      if (error) {
        console.error('❌ Supabase services error:', error);
        throw error;
      }
      
      console.log('✅ Setting services state with data:', data);
      console.log('📊 Services count:', data?.length || 0);
      setServices(data || []);
    } catch (error) {
      console.error('💥 Error fetching services:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.client_id || !newBooking.service_id || !newBooking.start_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedService = services.find(s => s.id === newBooking.service_id);
      const startTime = new Date(newBooking.start_time);
      const endTime = new Date(startTime.getTime() + (selectedService?.duration_minutes || 60) * 60000);

      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: newBooking.client_id,
          service_id: newBooking.service_id,
          staff_id: newBooking.staff_id || null,
          room_id: newBooking.room_id || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          notes: newBooking.notes,
          price: newBooking.price || selectedService?.price,
          status: 'scheduled',
          payment_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      setShowNewBooking(false);
      setNewBooking({
        client_id: '',
        service_id: '',
        staff_id: '',
        room_id: '',
        start_time: '',
        notes: '',
        price: 0
      });
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    if (!canManageBookings) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Booking ${status}`,
      });

      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false;
    if (filterStaff !== 'all' && (!booking.staff || booking.staff.first_name + ' ' + booking.staff.last_name !== filterStaff)) return false;
    return true;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'checked_in': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      case 'no_show': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Schedule</h2>
          <p className="text-muted-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarDays className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Filters */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStaff} onValueChange={setFilterStaff}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map((member: any) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManageBookings && (
            <Dialog open={showNewBooking} onOpenChange={setShowNewBooking}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Booking</DialogTitle>
                  <DialogDescription>
                    Schedule a new appointment for a client.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select value={newBooking.client_id} onValueChange={(value) => setNewBooking({...newBooking, client_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Service *</Label>
                    <Select value={newBooking.service_id} onValueChange={(value) => {
                      console.log('🎯 Service selected:', value);
                      const service = services.find(s => s.id === value);
                      console.log('📋 Found service:', service);
                      setNewBooking({...newBooking, service_id: value, price: service?.price || 0});
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          console.log('🎨 Rendering services dropdown, services array:', services);
                          console.log('🔢 Services array length:', services.length);
                          return services.map((service) => {
                            console.log('🔄 Rendering service item:', service);
                            return (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - £{service.price} ({service.duration_minutes}min)
                              </SelectItem>
                            );
                          });
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff">Staff</Label>
                    <Select value={newBooking.staff_id} onValueChange={(value) => setNewBooking({...newBooking, staff_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Select value={newBooking.room_id} onValueChange={(value) => setNewBooking({...newBooking, room_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="datetime">Date & Time *</Label>
                    <Input
                      id="datetime"
                      type="datetime-local"
                      value={newBooking.start_time}
                      onChange={(e) => setNewBooking({...newBooking, start_time: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newBooking.price}
                      onChange={(e) => setNewBooking({...newBooking, price: parseFloat(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newBooking.notes}
                      onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                      placeholder="Any special notes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNewBooking(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBooking}>
                    Create Booking
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Bookings grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No bookings found</h3>
                  <p className="text-muted-foreground">
                    No appointments scheduled for this day.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {booking.clients.first_name} {booking.clients.last_name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="font-medium">{booking.services.name}</span>
                        {booking.staff && (
                          <span className="text-sm text-muted-foreground">
                            with {booking.staff.first_name} {booking.staff.last_name}
                          </span>
                        )}
                        {booking.rooms && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.rooms.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm font-medium">${booking.price}</span>
                      
                      {canManageBookings && booking.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'checked_in')}
                        >
                          Check In
                        </Button>
                      )}
                      
                      {canManageBookings && booking.status === 'checked_in' && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {booking.notes && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Notes:</strong> {booking.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleView;