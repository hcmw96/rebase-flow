import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { User, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process - integrate with Mindbody API
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to dashboard or booking page
    }, 2000);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage: `url('/lovable-uploads/397f6034-d62e-4ad3-b98c-30070da1186a.png')`
      }}
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <div className="relative z-10">
        <Navigation />
        
        <div className="pt-20">
        <section className="pt-8 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-serif font-light text-foreground mb-4">
                Welcome <span className="text-primary text-glow">Back</span>
              </h1>
              <p className="text-foreground/70">
                Sign in to your account to manage bookings and access your wellness journey.
              </p>
            </div>

            <Card className="card-luxury">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-serif">Sign In</CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <Input 
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="bg-input border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2 text-foreground/70">
                      <input type="checkbox" className="rounded border-border" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full btn-luxury"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Signing In..."
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="text-center space-y-4">
                    <p className="text-foreground/70 text-sm">
                      Don't have an account yet?
                    </p>
                    <Link to="/signup">
                      <Button variant="outline" className="w-full btn-ghost-luxury">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start space-x-3">
                    <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        Secure Mindbody Integration
                      </h4>
                      <p className="text-xs text-foreground/70">
                        Your account is powered by Mindbody's secure platform for seamless booking and payment processing.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Login;