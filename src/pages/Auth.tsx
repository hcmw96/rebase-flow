import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    // Authentication is now handled by AuthGate component
    // This page can redirect to protected routes
    setTimeout(() => {
      setLoading(false);
      console.log('Login redirect - handled by AuthGate');
      window.location.href = '/classes';
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-left bg-fixed relative flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/lovable-uploads/397f6034-d62e-4ad3-b98c-30070da1186a.png')`
      }}
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-serif font-light text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-foreground/70">
            Access your wellness journey
          </p>
        </div>

        {/* Login Form */}
        <Card className="card-luxury">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl font-serif font-medium text-foreground">
              Sign In
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pb-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-foreground/70 mb-4">
                  Access your wellness journey by visiting our classes page. 
                  Authentication is handled automatically.
                </p>
                
                <div className="space-y-3">
                  <Button asChild className="w-full btn-luxury">
                    <Link to="/classes">
                      Browse Classes
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/integrations">
                      Manage Integrations
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
            <User className="h-4 w-4 mr-2" />
            Secure client portal access
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;