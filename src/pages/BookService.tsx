import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarIcon, Clock, ArrowLeft, Check, MapPin, Star } from "lucide-react";
import { format } from "date-fns";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const isMobile = useIsMobile();

  // Complete service data matching Services page
  const services = [
    // Classes
    {
      id: 1,
      title: "Contrast Therapy",
      category: "Classes", 
      duration: "60 minutes",
      price: 40,
      description: "Guided hot and cold therapy session combining sauna and ice bath"
    },
    {
      id: 2,
      title: "Breathwork",
      category: "Classes",
      duration: "60 minutes", 
      price: 40,
      description: "Mindful breathing techniques to enhance wellness and reduce stress"
    },
    {
      id: 3,
      title: "Yoga",
      category: "Classes",
      duration: "60 minutes",
      price: 40,
      description: "Restorative yoga sessions to improve flexibility and mental clarity"
    },

    // Suites
    {
      id: 4,
      title: "Members Contrast Suite Drop In",
      category: "Suites",
      duration: "60 minutes",
      price: 65,
      description: "Access to our contrast therapy suite with sauna and ice bath facilities"
    },
    {
      id: 5,
      title: "Premium Suite",
      category: "Suites",
      description: "Exclusive private access to our premium wellness facilities",
      options: [
        { duration: "45 minutes", price: 190, description: "Standard session" },
        { duration: "60 minutes", price: 240, description: "Extended session" },
        { duration: "90 minutes", price: 290, description: "Full experience" }
      ]
    },
    {
      id: 6,
      title: "Infrared Suite", 
      category: "Suites",
      description: "Private infrared sauna suite for deep relaxation and detoxification",
      options: [
        { duration: "45 minutes", price: 150, description: "Standard session" },
        { duration: "60 minutes", price: 190, description: "Extended session" },
        { duration: "90 minutes", price: 240, description: "Full experience" }
      ]
    },

    // Tech Therapies
    {
      id: 7,
      title: "Cryotherapy",
      category: "Tech Therapies",
      duration: "3 minutes",
      price: 50,
      description: "Whole-body cryotherapy for recovery and inflammation reduction"
    },
    {
      id: 8,
      title: "HBOT (Hyperbaric Oxygen Therapy)",
      category: "Tech Therapies", 
      duration: "60 minutes",
      price: 200,
      description: "Accelerated healing and recovery through pressurized oxygen therapy"
    },

    // Massage Therapies
    {
      id: 9,
      title: "Total Body Realignment",
      category: "Massage Therapies",
      description: "Comprehensive bodywork to restore balance and alignment",
      options: [
        { duration: "60 minutes", price: 165, description: "Standard treatment" },
        { duration: "90 minutes", price: 195, description: "Extended treatment" }
      ]
    },
    {
      id: 10,
      title: "Sports Massage", 
      category: "Massage Therapies",
      description: "Targeted massage therapy for athletes and active individuals",
      options: [
        { duration: "60 minutes", price: 155, description: "Standard treatment" },
        { duration: "90 minutes", price: 185, description: "Extended treatment" }
      ]
    },
    {
      id: 11,
      title: "Lymphatic Drainage",
      category: "Massage Therapies", 
      description: "Gentle massage technique to support lymphatic system function",
      options: [
        { duration: "60 minutes", price: 155, description: "Standard treatment" },
        { duration: "90 minutes", price: 185, description: "Extended treatment" }
      ]
    },
    {
      id: 12,
      title: "Deep Tissue",
      category: "Massage Therapies",
      description: "Intensive massage therapy targeting deep muscle tension",
      options: [
        { duration: "60 minutes", price: 155, description: "Standard treatment" },
        { duration: "90 minutes", price: 185, description: "Extended treatment" }
      ]
    },

    // Manual Therapies
    {
      id: 13,
      title: "Osteopathy Consultation",
      category: "Manual Therapies",
      duration: "60 minutes",
      price: 210,
      description: "Comprehensive assessment and treatment by certified osteopaths"
    },
    {
      id: 14,
      title: "Structural Fascia Therapy", 
      category: "Manual Therapies",
      duration: "60 minutes",
      price: 200,
      description: "Specialized therapy targeting fascial restrictions and mobility"
    },

    // Other Services
    {
      id: 15,
      title: "IV Drip",
      category: "Other Services",
      description: "Intravenous vitamin and nutrient therapy for optimal wellness",
      options: [
        { duration: "45 minutes", price: 200, description: "Initial assessment & treatment plan", name: "First Consultation" },
        { duration: "30 minutes", price: 150, description: "Comprehensive health screening", name: "Blood Test" },
        { duration: "45 minutes", price: 320, description: "Reduce inflammation", name: "Anti-Inflammatory" },
        { duration: "45 minutes", price: 300, description: "Boost vitality & energy", name: "Energy" },
        { duration: "45 minutes", price: 320, description: "Mental clarity & focus", name: "Focus" },
        { duration: "45 minutes", price: 340, description: "Healthy skin & radiance", name: "Glow" },
        { duration: "45 minutes", price: 300, description: "Strengthen immune system", name: "Immunity" },
        { duration: "60 minutes", price: 380, description: "Enhanced immune support", name: "Immunity Plus" },
        { duration: "60 minutes", price: 420, description: "Neurological health support", name: "Neuro-Regan" },
        { duration: "45 minutes", price: 340, description: "Post-workout recovery", name: "Recovery" },
        { duration: "45 minutes", price: 320, description: "Relaxation & better sleep", name: "Rest & Sleep" },
        { duration: "45 minutes", price: 350, description: "Complete rejuvenation", name: "Revive" },
        { duration: "60 minutes", price: 450, description: "Cellular regeneration", name: "NAD+ (250MG)" },
        { duration: "90 minutes", price: 650, description: "Advanced regeneration", name: "NAD+ (500MG)" },
        { duration: "15 minutes", price: 80, description: "Targeted vitamin injections", name: "Vitamin Shots" }
      ]
    },
    {
      id: 16,
      title: "Vitamin Infusions",
      category: "Other Services", 
      duration: "30 minutes",
      price: 80,
      description: "Targeted vitamin injections for enhanced health and energy"
    }
  ];

  const selectedService = services.find(service => service.id === parseInt(serviceId || ""));

  useEffect(() => {
    if (!selectedService) {
      navigate("/services");
      return;
    }
    
    // If service has options, start at step 0, otherwise step 1
    if (selectedService.options) {
      setStep(0);
    } else {
      setStep(1);
    }
  }, [selectedService, navigate]);

  const handleOptionSelect = (option: any) => {
    setSelectedOption(option);
    setStep(1);
  };

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
    if (step > (selectedService?.options ? 0 : 1)) {
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
            {step === 0 && "Choose Option"}
            {step === 1 && "Choose Date"}
            {step === 2 && "Pick Time"}
            {step === 3 && "Confirm Booking"}
          </div>
          <div className="text-xs text-muted-foreground">
            Step {selectedService?.options ? step + 1 : step} of {selectedService?.options ? 4 : 3}
          </div>
        </div>
        <div className="w-8" />
      </div>
    </div>
  );

  const renderProgressDots = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: selectedService?.options ? 4 : 3 }, (_, i) => i).map((stepNum) => (
        <div key={stepNum} className={`w-2 h-2 rounded-full transition-colors ${
          step >= stepNum ? 'bg-primary' : 'bg-muted'
        }`} />
      ))}
    </div>
  );

  const renderServiceInfo = () => (
    <Card className="glass-card rounded-3xl border-white/10 mb-6">
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex justify-between items-start mb-3">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {selectedService?.category}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              £{selectedOption ? selectedOption.price : selectedService?.price}
            </div>
            <div className="text-sm text-white/70">
              {selectedOption ? selectedOption.duration : selectedService?.duration}
            </div>
          </div>
        </div>
        <h1 className="font-serif text-2xl font-medium text-white mb-3">
          {selectedService?.title}
        </h1>
        <p className="text-white/70 leading-relaxed mb-4">
          {selectedService?.description}
        </p>
        {selectedOption && (
          <div className="text-sm text-white/60">
            {selectedOption.description}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderOptionSelection = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-light text-white mb-2">
            Choose Your Option
          </h2>
          <p className="text-sm text-white/70">
            Select your preferred option for {selectedService?.title}
          </p>
        </div>
      )}
      
      <div className={`mx-auto glass-morphism rounded-2xl ${isMobile ? 'max-w-sm p-4 mx-4' : 'max-w-lg p-6'}`}>
        <Select onValueChange={(value) => {
          const option = selectedService?.options?.[parseInt(value)];
          if (option) handleOptionSelect(option);
        }}>
          <SelectTrigger className="w-full h-14 glass-button text-white border-white/20 hover:bg-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
            <SelectValue placeholder="Select an option..." className="text-white" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-white/20 rounded-xl z-50">
            {selectedService?.options?.map((option: any, index: number) => (
              <SelectItem 
                key={index} 
                value={index.toString()}
                className="text-foreground hover:bg-accent/50 focus:bg-accent/50 rounded-lg cursor-pointer p-4 border-b border-border/10 last:border-0"
              >
                <div className="grid grid-cols-[1fr_80px] gap-6 w-full items-start">
                  <div className="min-w-0">
                    <div className="font-semibold text-base">{option.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{option.duration}</span>
                      <span className="mx-2">•</span>
                      <span>{option.description}</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-right font-mono">£{option.price}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderDateSelection = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-light text-white mb-2">
            Choose Your Date
          </h2>
          <p className="text-sm text-white/70">
            Select your preferred date for {selectedService?.title}
          </p>
        </div>
      )}
      
      <div className={`mx-auto glass-morphism rounded-2xl ${isMobile ? 'max-w-sm p-4 mx-4' : 'max-w-lg p-8'}`}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date()}
          initialFocus
          className="p-3 pointer-events-auto"
          classNames={{
            months: "text-white",
            month: "text-white",
            caption: "text-white",
            caption_label: "text-white text-sm font-medium",
            nav: "text-white",
            nav_button: "text-white/70 hover:text-white h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "text-white w-full",
            head_row: "text-white",
            head_cell: "text-white/70 rounded-md w-9 font-normal text-[0.8rem]",
            row: "text-white",
            cell: "text-white relative p-0 text-center text-sm focus-within:relative focus-within:z-20 h-9 w-9",
            day: "text-white h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/20 hover:text-white rounded-md transition-colors text-sm",
            day_selected: "bg-white/30 text-white hover:bg-white/40 hover:text-white focus:bg-white/30 focus:text-white",
            day_today: "bg-white/10 text-white",
            day_outside: "text-white/50 opacity-50",
            day_disabled: "text-white/30 opacity-50",
          }}
        />
      </div>
    </div>
  );

  const renderTimeSelection = () => (
    <div className="px-4 pb-8">
      {!isMobile && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-light text-white mb-2">
            Pick Your Time
          </h2>
          <p className="text-sm text-white/70">
            {selectedDate && format(selectedDate, "EEEE, MMMM d")}
          </p>
        </div>
      )}
      
      <div className={`mx-auto glass-morphism rounded-2xl ${isMobile ? 'max-w-sm p-4 mx-4' : 'max-w-lg p-6'}`}>
        <div className="grid grid-cols-3 gap-3">
          {generateTimeSlots().map((time) => (
            <Button
              key={time}
              variant="outline"
              className={`h-12 text-sm transition-all rounded-xl ${
                selectedTime === time 
                  ? 'glass-button text-white border-white/30 bg-white/20' 
                  : 'glass-button text-white/70 border-white/20 hover:text-white hover:bg-white/10'
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
          <h2 className="text-2xl font-serif font-light text-white mb-4">
            Confirm Your Booking
          </h2>
        </div>
      )}
      
      <Card className={`glass-card rounded-3xl border-white/10 mx-auto ${isMobile ? 'max-w-sm mx-4' : 'max-w-lg'}`}>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full mx-auto flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-serif text-lg font-medium text-white mb-2">
                {selectedService?.title}
              </h3>
              <p className="text-sm text-white/70">
                {selectedService?.description}
              </p>
            </div>
            
            <div className="border-t border-white/20 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Date</span>
                <span className="font-medium text-white">
                  {selectedDate && format(selectedDate, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Time</span>
                <span className="font-medium text-white">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Duration</span>
                <span className="font-medium text-white">
                  {selectedOption ? selectedOption.duration : selectedService?.duration}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t border-white/20 pt-3">
                <span className="text-white">Total</span>
                <span className="text-white">
                  £{selectedOption ? selectedOption.price : selectedService?.price}
                </span>
              </div>
            </div>
            
            <Button className="w-full glass-button text-white rounded-xl font-medium">
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
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative transition-all duration-700 ease-in-out"
      style={{
        backgroundImage: `url('/lovable-uploads/8911d1ac-19d7-427a-9138-19c768396ea7.png')`
      }}
    >
      {/* Dark overlay for text legibility with smooth transition */}
      <div className="absolute inset-0 bg-black/50 z-0 transition-opacity duration-500" />
      
      <div className="relative z-10 min-h-screen animate-fade-in">
      {!isMobile && <Navigation />}
      
      {isMobile && renderMobileHeader()}
      
      <div className={isMobile ? "pt-0" : "pt-20"}>
        <section className={isMobile ? "py-4" : "py-20 px-4 sm:px-6 lg:px-8"}>
          <div className="max-w-7xl mx-auto">
            {!isMobile && (
              <div className="animate-scale-in">
                {renderProgressDots()}
              </div>
            )}
            
            {/* Service info always visible on desktop, only on mobile in step 1 or 0 */}
            {(!isMobile || step <= 1) && (
              <div className={`mx-auto mb-8 animate-fade-in ${isMobile ? 'max-w-sm px-4' : 'max-w-lg'}`}>
                {renderServiceInfo()}
              </div>
            )}
            
            <div className="max-w-lg mx-auto">
              <div className="transition-all duration-500 ease-in-out">
                {step === 0 && <div className="animate-fade-in">{renderOptionSelection()}</div>}
                {step === 1 && <div className="animate-fade-in">{renderDateSelection()}</div>}
                {step === 2 && <div className="animate-fade-in">{renderTimeSelection()}</div>}
                {step === 3 && <div className="animate-fade-in">{renderConfirmation()}</div>}
              </div>
            </div>
          </div>
        </section>
      </div>

      {!isMobile && <Footer />}
      </div>
    </div>
  );
};

export default BookService;