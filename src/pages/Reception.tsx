import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, CreditCard, Package, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';

// Import reception components
import ScheduleView from '@/components/reception/ScheduleView';
import ClientManagement from '@/components/reception/ClientManagement';
import PointOfSale from '@/components/reception/PointOfSale';
import ReportsView from '@/components/reception/ReportsView';
import { MindbodyConnect } from '@/components/MindbodyConnect';

type UserRole = 'admin' | 'manager' | 'receptionist' | 'practitioner';

const Reception = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    // Demo mode - bypass authentication for development
    setUser({ email: 'demo@example.com' } as User);
    setUserRole('admin');
    setLoading(false);

    // OAuth will work without auth - real auth code commented for demo
    /*
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/login');
        } else {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/login');
      } else {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
    */
  }, [navigate]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          title: "Access denied",
          description: "No role assigned. Please contact your administrator.",
          variant: "destructive",
        });
        navigate('/services');
        return;
      }

      setUserRole(data.role);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load user permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the reception system.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/services')}>
              Return to Website
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Rebase Reception</h1>
            <Badge variant="secondary" className="capitalize">
              {userRole}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-6">
          <MindbodyConnect />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Point of Sale
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2"
              disabled={!['admin', 'manager'].includes(userRole)}
            >
              <Package className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <ScheduleView userRole={userRole} />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManagement userRole={userRole} />
          </TabsContent>

          <TabsContent value="pos">
            <PointOfSale userRole={userRole} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsView userRole={userRole} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reception;