import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SignOutButton from '@/components/SignOutButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Integrations = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);

        // Check connection status via edge function
        const response = await supabase.functions.invoke('mb-connected');
        if (response.data) {
          setConnected(response.data.connected || false);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const startConnect = async () => {
    setConnecting(true);
    try {
      // Get the OAuth authorization URL from edge function
      const response = await supabase.functions.invoke('mb-oauth-start');
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.authorizeUrl) {
        // Redirect to MINDBODY OAuth
        window.location.href = response.data.authorizeUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to start MINDBODY connection",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };

  const disconnectMindbody = async () => {
    try {
      const response = await supabase.functions.invoke('mb-disconnect');
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setConnected(false);
      toast({
        title: "Disconnected",
        description: "MINDBODY integration has been disconnected"
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnect failed",
        description: error instanceof Error ? error.message : "Failed to disconnect MINDBODY",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-serif font-light text-foreground mb-4">
                  <span className="text-primary">Integrations</span>
                </h1>
                <p className="text-lg text-foreground/70">
                  Connect your wellness platforms to streamline your experience
                </p>
              </div>
              <SignOutButton />
            </div>

            <div className="grid gap-6">
              {/* MINDBODY Integration */}
              <Card className="card-luxury">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : connected ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">MINDBODY</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Connect to book classes and manage appointments
                        </p>
                      </div>
                    </div>
                    <Badge variant={connected ? "default" : "secondary"}>
                      {loading ? "Checking..." : connected ? "Connected" : "Not connected"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {connected ? (
                        <div className="space-y-2">
                          <p className="text-green-600 font-medium">✓ Ready for booking</p>
                          <p>Your MINDBODY account is connected and ready to use. You can now browse and book classes seamlessly.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p>Connect your MINDBODY account to access:</p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Browse available classes and appointments</li>
                            <li>Book services directly from the platform</li>
                            <li>View your booking history</li>
                            <li>Manage your wellness schedule</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      {!connected ? (
                        <Button 
                          onClick={startConnect} 
                          disabled={connecting || loading}
                          className="gap-2"
                        >
                          {connecting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Connect MINDBODY
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex gap-3">
                          <Button asChild>
                            <a href="/classes">
                              Browse Classes
                            </a>
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={disconnectMindbody}
                          >
                            Disconnect
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Future integrations placeholder */}
              <Card className="card-luxury opacity-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted/20 rounded-xl flex items-center justify-center">
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">More integrations</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Additional wellness platform integrations coming soon
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Integrations;