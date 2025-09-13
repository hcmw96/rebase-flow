import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarIcon, Clock, ArrowLeft, Check } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";

const Book = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const isMobile = useIsMobile();

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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep(3);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const renderMobileHeader = () => (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="flex items-center justify-between p-4">
        {step > 1 && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 text-center">
          <div className="text-sm font-medium text-foreground">
            {step === 1 && "Select Service"}
            {step === 2 && "Choose Date"}
            {step === 3 && "Pick Time"}
            {step === 4 && "Confirm Booking"}
          </div>
          <div className="text-xs text-muted-foreground">
            Step {step} of 4
          </div>
        </div>
        <div className="w-8" />
      </div>
    </div>
  );

  const renderProgressDots = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3, 4].map((stepNum) => (
        <div key={stepNum} className={`w-2 h-2 rounded-full transition-colors ${
          step >= stepNum ? 'bg-primary' : 'bg-muted'
        }`} />
      ))}
    </div>
  );

  const renderServiceSelection = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-light text-foreground mb-4">
            Choose Your <span className="text-primary">Experience</span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Select from our range of wellness services.
          </p>
        </div>
      )}
      
      <div className="space-y-4 max-w-lg mx-auto">
        {services.map((service) => (
          <Card 
            key={service.id} 
            className="card-luxury cursor-pointer active:scale-95 transition-transform" 
            onClick={() => handleServiceSelect(service)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {service.category}
                </Badge>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">£{service.price}</div>
                  <div className="text-xs text-muted-foreground">{service.duration}</div>
                </div>
              </div>
              <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                {service.title}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {service.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDateSelection = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-light text-foreground mb-2">
            Choose Your Date
          </h2>
          <p className="text-sm text-foreground/70">
            {selectedService?.title} • {selectedService?.duration}
          </p>
        </div>
      )}
      
      <div className="max-w-sm mx-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date()}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </div>
    </div>
  );

  const renderTimeSelection = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-light text-foreground mb-2">
            Pick Your Time
          </h2>
          <p className="text-sm text-foreground/70">
            {selectedDate && format(selectedDate, "EEEE, MMMM d")}
          </p>
        </div>
      )}
      
      <div className="max-w-sm mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {generateTimeSlots().map((time) => (
            <Button
              key={time}
              variant="outline"
              className={`h-12 text-sm transition-all ${
                selectedTime === time 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => handleTimeSelect(time)}
            >
              {time}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-light text-foreground mb-4">
            Confirm Your Booking
          </h2>
        </div>
      )}
      
      <Card className="card-luxury max-w-sm mx-auto">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                {selectedService?.title}
              </h3>
              <p className="text-sm text-foreground/70">
                {selectedService?.description}
              </p>
            </div>
            
            <div className="border-t border-border/50 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/70">Date</span>
                <span className="font-medium">
                  {selectedDate && format(selectedDate, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/70">Time</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/70">Duration</span>
                <span className="font-medium">{selectedService?.duration}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t border-border/50 pt-3">
                <span>Total</span>
                <span className="text-primary">£{selectedService?.price}</span>
              </div>
            </div>
            
            <Button className="w-full btn-luxury">
              Complete Booking
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen">
      {!isMobile && <Navigation />}
      
      {isMobile && renderMobileHeader()}
      
      <div className={isMobile ? "pt-0" : "pt-20"}>
        <section className={isMobile ? "py-4" : "py-20 px-4 sm:px-6 lg:px-8"}>
          <div className="max-w-7xl mx-auto">
            {!isMobile && renderProgressDots()}
            
            {step === 1 && renderServiceSelection()}
            {step === 2 && renderDateSelection()}
            {step === 3 && renderTimeSelection()}
            {step === 4 && renderConfirmation()}
          </div>
        </section>
      </div>

      {!isMobile && <Footer />}
    </div>
  );
};

export default Book;