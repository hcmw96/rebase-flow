import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ExternalLink, RefreshCw, Check, X } from 'lucide-react';

interface MindbodyConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  site_id: string;
  created_at: string;
  updated_at: string;
}

export const MindbodyConnect = () => {
  const [connection, setConnection] = useState<MindbodyConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const oauthCallback = urlParams.get('oauth_callback');
    
    if (oauthCallback === 'true' && code && state) {
      handleOAuthCallback(code, state);
    } else if (urlParams.get('oauth') === 'success') {
      toast.success('Successfully connected to Mindbody!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      checkConnection();
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setConnecting(true);
      
      const { data, error } = await supabase.functions.invoke('mindbody-oauth', {
        body: { 
          action: 'callback',
          code,
          state
        }
      });

      if (error) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to complete Mindbody connection');
        return;
      }

      toast.success('Successfully connected to Mindbody!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      await checkConnection();
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Failed to complete connection');
    } finally {
      setConnecting(false);
    }
  };

  const checkConnection = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user');
        return;
      }

      const { data, error } = await supabase
        .from('mb_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking connection:', error);
        toast.error('Failed to check Mindbody connection');
        return;
      }

      setConnection(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const initiateConnection = async () => {
    try {
      setConnecting(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to connect to Mindbody');
        return;
      }
      
      // Use the proper Supabase function invoke method
      const { data, error } = await supabase.functions.invoke('mindbody-oauth', {
        body: { 
          action: 'initiate',
          userId: user.id
        }
      });

      if (error) {
        console.error('Error initiating OAuth:', error);
        toast.error('Failed to initiate Mindbody connection');
        return;
      }

      // Redirect to Mindbody OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to connect to Mindbody');
    } finally {
      setConnecting(false);
    }
  };

  const refreshToken = async () => {
    try {
      setRefreshing(true);
      
      const { error } = await supabase.functions.invoke('mindbody-oauth', {
        body: { action: 'refresh' }
      });

      if (error) {
        console.error('Error refreshing token:', error);
        toast.error('Failed to refresh Mindbody connection');
        return;
      }

      toast.success('Mindbody connection refreshed successfully');
      await checkConnection();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to refresh connection');
    } finally {
      setRefreshing(false);
    }
  };

  const disconnectMindbody = async () => {
    try {
      if (!connection) return;

      const { error } = await supabase
        .from('mb_connections')
        .delete()
        .eq('id', connection.id);

      if (error) {
        console.error('Error disconnecting:', error);
        toast.error('Failed to disconnect from Mindbody');
        return;
      }

      toast.success('Disconnected from Mindbody');
      setConnection(null);
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const isTokenExpired = () => {
    if (!connection?.expires_at) return false;
    return new Date(connection.expires_at) <= new Date();
  };

  const getConnectionStatus = () => {
    if (!connection) return 'disconnected';
    if (isTokenExpired()) return 'expired';
    return 'connected';
  };

  const getStatusBadge = () => {
    const status = getConnectionStatus();
    
    switch (status) {
      case 'connected':
        return (
          <Badge variant="secondary" className="text-green-600 bg-green-50">
            <Check className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <RefreshCw className="w-3 h-3 mr-1" />
            Token Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            <X className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Checking Mindbody connection...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">Mindbody Integration</h3>
            <p className="text-sm text-muted-foreground">
              Connect to sync schedules and enable client bookings
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {connection ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Site ID:</span>
              <p className="font-mono">{connection.site_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Connected:</span>
              <p>{new Date(connection.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {connection.expires_at && (
            <div className="text-sm">
              <span className="text-muted-foreground">Token expires:</span>
              <p className={isTokenExpired() ? 'text-orange-600' : ''}>
                {new Date(connection.expires_at).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            {isTokenExpired() && (
              <Button
                onClick={refreshToken}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Token
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={disconnectMindbody}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Mindbody account to enable advanced scheduling features, 
            real-time class availability, and seamless client booking experience.
          </p>
          
          <Button
            onClick={initiateConnection}
            disabled={connecting}
            className="w-full"
          >
            {connecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect to Mindbody
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};