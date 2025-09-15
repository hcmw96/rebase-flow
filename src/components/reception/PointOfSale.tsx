import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Receipt, Search, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'manager' | 'receptionist' | 'practitioner';

interface CartItem {
  id: string;
  type: 'service' | 'package' | 'membership' | 'inventory';
  name: string;
  price: number;
  quantity: number;
  duration?: number;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PointOfSaleProps {
  userRole: UserRole;
}

const PointOfSale: React.FC<PointOfSaleProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const canProcessPayments = ['admin', 'manager', 'receptionist'].includes(userRole);

  useEffect(() => {
    fetchClients();
    fetchServices();
    fetchPackages();
    fetchMemberships();
    fetchInventory();
  }, []);

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
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*, services(name)')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMemberships(data || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name');

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const addToCart = (item: any, type: 'service' | 'package' | 'membership' | 'inventory') => {
    const cartItem: CartItem = {
      id: item.id,
      type,
      name: type === 'package' ? `${item.name} (${item.services?.name})` : item.name,
      price: type === 'membership' ? item.monthly_price : item.price,
      quantity: 1,
      duration: type === 'service' ? item.duration_minutes : undefined
    };

    const existingItem = cart.find(c => c.id === item.id && c.type === type);
    if (existingItem) {
      setCart(cart.map(c => 
        c.id === item.id && c.type === type 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, cartItem]);
    }

    toast({
      title: "Added to cart",
      description: `${cartItem.name} added to cart`,
    });
  };

  const updateCartQuantity = (id: string, type: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id && item.type === type) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string, type: string) => {
    setCart(cart.filter(item => !(item.id === id && item.type === type)));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.1; // 10% tax rate
  };

  const processPayment = async () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = calculateTotal();
      const tax = calculateTax(subtotal);
      const total = subtotal + tax;

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          client_id: selectedClient.id,
          amount: total,
          payment_method: paymentMethod,
          status: 'completed',
          notes: `POS Sale - ${cart.length} items`
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Handle different item types
      for (const item of cart) {
        if (item.type === 'package') {
          // Add client package
          const packageData = packages.find(p => p.id === item.id);
          if (packageData) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + packageData.validity_days);

            await supabase
              .from('client_packages')
              .insert({
                client_id: selectedClient.id,
                package_id: item.id,
                sessions_remaining: packageData.sessions_included * item.quantity,
                expiry_date: expiryDate.toISOString()
              });
          }
        } else if (item.type === 'membership') {
          // Add client membership
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + item.quantity);

          await supabase
            .from('client_memberships')
            .insert({
              client_id: selectedClient.id,
              membership_id: item.id,
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate.toISOString().split('T')[0]
            });
        } else if (item.type === 'inventory') {
          // Update inventory stock
          const currentItem = inventory.find(i => i.id === item.id);
          if (currentItem) {
            await supabase
              .from('inventory')
              .update({ stock_quantity: currentItem.stock_quantity - item.quantity })
              .eq('id', item.id);
          }
        }
      }

      setLastTransaction({
        id: payment.id,
        client: selectedClient,
        items: [...cart],
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
        created_at: new Date().toISOString()
      });

      // Clear cart and selections
      setCart([]);
      setSelectedClient(null);
      setClientSearch('');
      setShowReceipt(true);

      toast({
        title: "Payment processed",
        description: `Successfully processed $${total.toFixed(2)} payment`,
      });

      // Refresh data
      fetchInventory();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Point of Sale</h2>
          <p className="text-muted-foreground">
            Process sales for services, packages, memberships, and retail items
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products and Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.duration_minutes}min • ${service.price}
                      </div>
                    </div>
                    {canProcessPayments && (
                      <Button
                        size="sm"
                        onClick={() => addToCart(service, 'service')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pkg.sessions_included} sessions • ${pkg.price}
                      </div>
                    </div>
                    {canProcessPayments && (
                      <Button
                        size="sm"
                        onClick={() => addToCart(pkg, 'package')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Retail Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retail Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {item.stock_quantity} • ${item.price}
                      </div>
                    </div>
                    {canProcessPayments && (
                      <Button
                        size="sm"
                        onClick={() => addToCart(item, 'inventory')}
                        disabled={item.stock_quantity === 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {clientSearch && (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedClient?.id === client.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedClient(client);
                        setClientSearch('');
                      }}
                    >
                      <div className="font-medium">
                        {client.first_name} {client.last_name}
                      </div>
                      <div className="text-sm opacity-70">
                        {client.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedClient && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedClient.email}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Cart is empty
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.type}`} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.id, item.type, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.id, item.type, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id, item.type)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span>${calculateTax(calculateTotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${(calculateTotal() + calculateTax(calculateTotal())).toFixed(2)}</span>
                    </div>
                  </div>

                  {canProcessPayments && (
                    <>
                      <Separator />
                      
                      <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          className="w-full"
                          onClick={processPayment}
                          disabled={!selectedClient || cart.length === 0}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Process Payment
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipt
            </DialogTitle>
          </DialogHeader>
          
          {lastTransaction && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold">Rebase Wellness Studio</h3>
                <p className="text-sm text-muted-foreground">
                  Transaction #{lastTransaction.id.slice(-8)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(lastTransaction.created_at).toLocaleString()}
                </p>
              </div>

              <Separator />

              <div>
                <p className="font-medium">Customer:</p>
                <p>{lastTransaction.client.first_name} {lastTransaction.client.last_name}</p>
                <p className="text-sm text-muted-foreground">{lastTransaction.client.email}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                {lastTransaction.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${lastTransaction.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${lastTransaction.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${lastTransaction.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Payment Method: {lastTransaction.payment_method}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PointOfSale;