import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CreditCard } from "lucide-react";

const Book = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);

  const services = [
    {
      id: 1,
      title: "Contrast Therapy Session",
      description: "Complete sauna and ice bath experience",
      duration: "60 minutes",
      price: 120,
      category: "Recovery"
    },
    {
      id: 2,
      title: "Cryotherapy",
      description: "Whole-body cryotherapy session",
      duration: "3 minutes",
      price: 45,
      category: "Recovery"
    },
    {
      id: 3,
      title: "Breathwork Class",
      description: "Guided breathwork session",
      duration: "45 minutes",
      price: 35,
      category: "Mindfulness"
    },
    {
      id: 4,
      title: "IV Vitamin Therapy",
      description: "Customized vitamin infusion",
      duration: "45 minutes",
      price: 95,
      category: "Therapy"
    }
  ];

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setStep(2);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {[1, 2, 3, 4].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {stepNum}
          </div>
          {stepNum < 4 && (
            <div className={`w-16 h-px mx-2 transition-colors ${
              step > stepNum ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderServiceSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-light text-foreground mb-4">
          Choose Your <span className="text-primary">Experience</span>
        </h2>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          Select from our range of wellness services. Each session is carefully designed to maximize your wellbeing.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {services.map((service) => (
          <Card key={service.id} className="card-luxury group cursor-pointer hover:scale-105 transition-all" onClick={() => handleServiceSelect(service)}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {service.category}
                </Badge>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">£{service.price}</div>
                  <div className="text-sm text-muted-foreground">{service.duration}</div>
                </div>
              </div>
              <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors">
                {service.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-4">{service.description}</p>
              <Button className="w-full btn-luxury">
                Select This Service
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMindbodyIntegration = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-light text-foreground mb-4">
          Schedule Your <span className="text-primary">Session</span>
        </h2>
        <p className="text-foreground/70 max-w-2xl mx-auto mb-8">
          We use Mindbody to manage all bookings and schedules. You'll be redirected to our secure booking system.
        </p>
      </div>

      <Card className="card-luxury max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl font-serif">
            Selected Service: {selectedService?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="font-medium">{selectedService?.duration}</div>
            </div>
            <div>
              <CreditCard className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="font-medium">£{selectedService?.price}</div>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-6">
            <h3 className="font-medium text-foreground mb-4">Booking Options:</h3>
            <div className="space-y-3">
              <Button className="w-full btn-luxury" onClick={() => setStep(3)}>
                <User className="h-4 w-4 mr-2" />
                I have a Mindbody account
              </Button>
              <Button variant="outline" className="w-full btn-ghost-luxury" onClick={() => setStep(4)}>
                <Calendar className="h-4 w-4 mr-2" />
                Create new account & book
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLogin = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-light text-foreground mb-4">
          Welcome <span className="text-primary">Back</span>
        </h2>
        <p className="text-foreground/70 max-w-2xl mx-auto mb-8">
          Sign in to your Mindbody account to complete your booking.
        </p>
      </div>

      <Card className="card-luxury max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Secure Mindbody Login
              </h3>
              <p className="text-sm text-foreground/70">
                You'll be redirected to Mindbody's secure login portal to access your account and complete your booking.
              </p>
            </div>
            
            <Button className="w-full btn-luxury">
              Continue to Mindbody
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSignup = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-light text-foreground mb-4">
          Create Your <span className="text-primary">Account</span>
        </h2>
        <p className="text-foreground/70 max-w-2xl mx-auto mb-8">
          New to Rebase? Create your Mindbody account to unlock seamless booking and manage your wellness journey.
        </p>
      </div>

      <Card className="card-luxury max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Quick Account Setup
              </h3>
              <p className="text-sm text-foreground/70">
                Create your Mindbody account in just a few steps and book your first session today.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button className="w-full btn-luxury">
                Create Mindbody Account
              </Button>
              <Button variant="ghost" onClick={() => setStep(3)} className="w-full text-sm">
                Already have an account? Sign in
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {renderStepIndicator()}
            
            {step === 1 && renderServiceSelection()}
            {step === 2 && renderMindbodyIntegration()}
            {step === 3 && renderLogin()}
            {step === 4 && renderSignup()}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Book;