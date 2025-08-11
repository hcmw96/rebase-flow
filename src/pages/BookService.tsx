import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarIcon, Clock, ArrowLeft, Check, MapPin } from "lucide-react";
import { format } from "date-fns";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const isMobile = useIsMobile();

  // Service data from Services page
  const services = [
    {
      id: 1,
      title: "Ice Bath",
      category: "Recovery",
      duration: "15 minutes",
      price: 25,
      description: "Invigorating cold water immersion therapy to reduce inflammation and boost recovery"
    },
    {
      id: 2,
      title: "Traditional Sauna",
      category: "Recovery", 
      duration: "30 minutes",
      price: 35,
      description: "Authentic Finnish sauna experience for deep relaxation and detoxification"
    },
    {
      id: 3,
      title: "Infrared Sauna",
      category: "Recovery",
      duration: "30 minutes", 
      price: 40,
      description: "Gentle infrared heat therapy for muscle relaxation and improved circulation"
    },
    {
      id: 4,
      title: "Contrast Class",
      category: "Movement",
      duration: "60 minutes",
      price: 45,
      description: "Guided hot and cold therapy session combining sauna and ice bath"
    },
    {
      id: 5,
      title: "Private Contrast Suite",
      category: "Recovery",
      duration: "90 minutes",
      price: 120,
      description: "Exclusive private access to our premium contrast therapy facilities"
    },
    {
      id: 12,
      title: "Recovery Specialist",
      category: "Therapy",
      duration: "30 minutes", 
      price: 65,
      description: "One-on-one session with our certified recovery specialists"
    }
  ];

  const selectedService = services.find(service => service.id === parseInt(serviceId || ""));

  useEffect(() => {
    if (!selectedService) {
      navigate("/services");
    }
  }, [selectedService, navigate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep(2);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/services");
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
        <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <div className="text-sm font-medium text-foreground">
            {step === 1 && "Choose Date"}
            {step === 2 && "Pick Time"}
            {step === 3 && "Confirm Booking"}
          </div>
          <div className="text-xs text-muted-foreground">
            Step {step} of 3
          </div>
        </div>
        <div className="w-8" />
      </div>
    </div>
  );

  const renderProgressDots = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3].map((stepNum) => (
        <div key={stepNum} className={`w-2 h-2 rounded-full transition-colors ${
          step >= stepNum ? 'bg-primary' : 'bg-muted'
        }`} />
      ))}
    </div>
  );

  const renderServiceInfo = () => (
    <Card className="card-luxury mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {selectedService?.category}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">£{selectedService?.price}</div>
            <div className="text-sm text-muted-foreground">{selectedService?.duration}</div>
          </div>
        </div>
        <h1 className="font-serif text-2xl font-medium text-foreground mb-3">
          {selectedService?.title}
        </h1>
        <p className="text-foreground/70 leading-relaxed mb-4">
          {selectedService?.description}
        </p>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          <span>Rebase Wellness Studio</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderDateSelection = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-light text-foreground mb-2">
            Choose Your Date
          </h2>
          <p className="text-sm text-foreground/70">
            Select your preferred date for {selectedService?.title}
          </p>
        </div>
      )}
      
      <div className="max-w-sm mx-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
          initialFocus
          className="rounded-xl border-0 shadow-none p-0"
          classNames={{
            months: "space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
            day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-sm",
            day_range_end: "day-range-end",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
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

  if (!selectedService) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {!isMobile && <Navigation />}
      
      {isMobile && renderMobileHeader()}
      
      <div className={isMobile ? "pt-0" : "pt-20"}>
        <section className={isMobile ? "py-4" : "py-20 px-4 sm:px-6 lg:px-8"}>
          <div className="max-w-7xl mx-auto">
            {!isMobile && renderProgressDots()}
            
            {/* Service info always visible on desktop, only on mobile in step 1 */}
            {(!isMobile || step === 1) && (
              <div className="max-w-lg mx-auto mb-8">
                {renderServiceInfo()}
              </div>
            )}
            
            <div className="max-w-lg mx-auto">
              {step === 1 && renderDateSelection()}
              {step === 2 && renderTimeSelection()}
              {step === 3 && renderConfirmation()}
            </div>
          </div>
        </section>
      </div>

      {!isMobile && <Footer />}
    </div>
  );
};

export default BookService;