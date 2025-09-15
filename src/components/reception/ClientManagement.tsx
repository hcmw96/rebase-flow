import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Search, Phone, Mail, Calendar, AlertTriangle, FileText, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type UserRole = 'admin' | 'manager' | 'receptionist' | 'practitioner';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes: string;
  preferences: any;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

interface ClientManagementProps {
  userRole: UserRole;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientHistory, setClientHistory] = useState([]);

  // New client form state
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    tags: [] as string[]
  });

  const canManageClients = ['admin', 'manager', 'receptionist'].includes(userRole);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search term
    const filtered = clients.filter(client =>
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.first_name || !newClient.last_name || !newClient.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          ...newClient,
          tags: newClient.tags.length > 0 ? newClient.tags : null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client created successfully",
      });

      setShowNewClient(false);
      setNewClient({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_notes: '',
        tags: []
      });
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    }
  };

  const fetchClientHistory = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name, duration_minutes),
          staff (first_name, last_name),
          payments (amount, payment_method, status)
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setClientHistory(data || []);
    } catch (error) {
      console.error('Error fetching client history:', error);
      toast({
        title: "Error",
        description: "Failed to load client history",
        variant: "destructive",
      });
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    fetchClientHistory(client.id);
  };

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Client Management</h2>
          <p className="text-muted-foreground">
            Manage client profiles, history, and information
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {canManageClients && (
            <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Create a new client profile with their personal information.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={newClient.first_name}
                        onChange={(e) => setNewClient({...newClient, first_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={newClient.last_name}
                        onChange={(e) => setNewClient({...newClient, last_name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={newClient.date_of_birth}
                        onChange={(e) => setNewClient({...newClient, date_of_birth: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                      <Input
                        id="emergency_contact_name"
                        value={newClient.emergency_contact_name}
                        onChange={(e) => setNewClient({...newClient, emergency_contact_name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                      <Input
                        id="emergency_contact_phone"
                        value={newClient.emergency_contact_phone}
                        onChange={(e) => setNewClient({...newClient, emergency_contact_phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical_notes">Medical Notes / Allergies</Label>
                    <Textarea
                      id="medical_notes"
                      value={newClient.medical_notes}
                      onChange={(e) => setNewClient({...newClient, medical_notes: e.target.value})}
                      placeholder="Any medical conditions, allergies, or special considerations..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNewClient(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClient}>
                    Create Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Clients table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Emergency Contact</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="space-y-2">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="text-lg font-medium">No clients found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm ? 'No clients match your search.' : 'No clients have been added yet.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {client.first_name} {client.last_name}
                          </div>
                          {client.tags && client.tags.length > 0 && (
                            <div className="flex gap-1">
                              {client.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.emergency_contact_name && (
                          <div className="space-y-1 text-sm">
                            <div>{client.emergency_contact_name}</div>
                            {client.emergency_contact_phone && (
                              <div className="text-muted-foreground">
                                {client.emergency_contact_phone}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(client.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.is_active ? 'default' : 'secondary'}>
                          {client.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {client.medical_notes && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Medical notes</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewClient(client)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                              <DialogTitle>
                                {selectedClient?.first_name} {selectedClient?.last_name}
                              </DialogTitle>
                              <DialogDescription>
                                Client profile and history
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedClient && (
                              <Tabs defaultValue="profile" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="profile">Profile</TabsTrigger>
                                  <TabsTrigger value="history">History</TabsTrigger>
                                  <TabsTrigger value="waivers">Waivers</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="profile" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Contact Information</Label>
                                      <div className="mt-2 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4" />
                                          <span>{selectedClient.email}</span>
                                        </div>
                                        {selectedClient.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span>{selectedClient.phone}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label className="text-sm font-medium">Emergency Contact</Label>
                                      <div className="mt-2 space-y-1">
                                        {selectedClient.emergency_contact_name && (
                                          <div>{selectedClient.emergency_contact_name}</div>
                                        )}
                                        {selectedClient.emergency_contact_phone && (
                                          <div className="text-sm text-muted-foreground">
                                            {selectedClient.emergency_contact_phone}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedClient.medical_notes && (
                                    <div>
                                      <Label className="text-sm font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        Medical Notes
                                      </Label>
                                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-sm">{selectedClient.medical_notes}</p>
                                      </div>
                                    </div>
                                  )}
                                </TabsContent>
                                
                                <TabsContent value="history">
                                  <div className="space-y-4">
                                    {clientHistory.length === 0 ? (
                                      <div className="text-center py-8">
                                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No booking history found</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {clientHistory.map((booking) => (
                                          <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                              <div className="font-medium">{booking.services?.name}</div>
                                              <div className="text-sm text-muted-foreground">
                                                {format(new Date(booking.start_time), 'MMM d, yyyy h:mm a')}
                                              </div>
                                              {booking.staff && (
                                                <div className="text-sm text-muted-foreground">
                                                  with {booking.staff.first_name} {booking.staff.last_name}
                                                </div>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                                                {booking.status}
                                              </Badge>
                                              <div className="text-sm font-medium mt-1">
                                                ${booking.price}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="waivers">
                                  <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">Waiver management coming soon</p>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientManagement;