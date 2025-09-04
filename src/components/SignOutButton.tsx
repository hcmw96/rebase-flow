import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SignOutButton = () => {
  const { toast } = useToast();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={signOut}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
};

export default SignOutButton;