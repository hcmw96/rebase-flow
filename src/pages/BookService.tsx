import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useMindbody } from "@/hooks/useMindbody";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar as CalendarIcon, Clock, ArrowLeft, Check, MapPin, Star } from "lucide-react";
import { format } from "date-fns";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const { isAuthenticated, services, classes, loading } = useMindbody();
  const isMobile = useIsMobile();

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Transform Mindbody data for booking
  const transformedServices = services.map(service => ({
    id: service.Id,
    title: service.Name,
    category: "Services",
    duration: "60 minutes",
    price: service.OnlinePrice || service.Price || 0
  }));

  // Add classes
  const transformedClasses = classes.map(cls => ({
    id: `class_${cls.Id}`,
    title: cls.ClassDescription?.Name || "Class",
    category: "Classes",
    duration: "60 minutes",
    price: 40,
    startDateTime: cls.StartDateTime,
    endDateTime: cls.EndDateTime,
    isClass: true
  }));

  const allServices = [...transformedServices, ...transformedClasses];
  
  // Find selected service - handle both regular services and classes
  let selectedService;
  if (serviceId?.startsWith('class_')) {
    const classId = parseInt(serviceId.replace('class_', ''));
    selectedService = allServices.find(service => service.id === `class_${classId}`);
  } else {
    selectedService = allServices.find(service => service.id === parseInt(serviceId || ""));
  }

  useEffect(() => {
    if (!selectedService) {
      navigate("/services");
    }
    // Auto-select variant if there's only one or no variants
    if (selectedService?.variants && selectedService.variants.length === 1) {
      setSelectedVariant(selectedService.variants[0]);
    } else if (!selectedService?.variants) {
      setSelectedVariant(null);
    }
  }, [selectedService, navigate]);

  // Determine total steps based on service type
  const getTotalSteps = () => {
    return selectedService?.variants && selectedService.variants.length > 1 ? 4 : 3;
  };

  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant);
    setStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const nextStep = selectedService?.variants && selectedService.variants.length > 1 ? 3 : 2;
      setStep(nextStep);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    const nextStep = selectedService?.variants && selectedService.variants.length > 1 ? 4 : 3;
    setStep(nextStep);
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

  const renderMobileHeader = () => {
    const getStepTitle = () => {
      if (selectedService?.variants && selectedService.variants.length > 1) {
        switch (step) {
          case 1: return "Choose Option";
          case 2: return "Choose Date";
          case 3: return "Pick Time";
          case 4: return "Confirm Booking";
          default: return "";
        }
      } else {
        switch (step) {
          case 1: return "Choose Date";
          case 2: return "Pick Time";
          case 3: return "Confirm Booking";
          default: return "";
        }
      }
    };

    return (
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-foreground">
              {getStepTitle()}
            </div>
            <div className="text-xs text-muted-foreground">
              Step {step} of {getTotalSteps()}
            </div>
          </div>
          <div className="w-8" />
        </div>
      </div>
    );
  };

  const renderProgressDots = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {Array.from({ length: getTotalSteps() }).map((_, index) => (
        <div key={index + 1} className={`w-2 h-2 rounded-full transition-colors ${
          step >= index + 1 ? 'bg-primary' : 'bg-muted'
        }`} />
      ))}
    </div>
  );

  const renderServiceInfo = () => {
    const renderPricing = () => {
      if (!selectedService) return null;

      if (selectedService.variants && selectedService.variants.length > 0) {
        return (
          <div className="text-right">
            <div className="text-sm text-white/70 mb-1">Multiple options</div>
            <div className="text-lg font-bold text-white">
              £{selectedService.variants[0].price} - £{selectedService.variants[selectedService.variants.length - 1].price}
            </div>
          </div>
        );
      }

      if (selectedService.fromPrice) {
        return (
          <div className="text-right">
            <div className="text-sm text-white/70 mb-1">{selectedService.duration}</div>
            <div className="text-lg font-bold text-white">from £{selectedService.price}</div>
          </div>
        );
      }

      return (
        <div className="text-right">
          <div className="text-sm text-white/70 mb-1">{selectedService.duration}</div>
          <div className="text-lg font-bold text-white">£{selectedService.price}</div>
        </div>
      );
    };

    return (
      <Card className="glass-card rounded-3xl border-white/10 mb-6">
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex justify-between items-start mb-3">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {selectedService?.category}
            </Badge>
            {renderPricing()}
          </div>
          <h1 className="font-serif text-2xl font-medium text-white mb-3">
            {selectedService?.title}
          </h1>
          {selectedService?.variants && selectedService.variants.length > 0 && (
            <div className="space-y-2">
              {selectedService.variants.map((variant, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-white/70">
                    {variant.description ? variant.description : variant.duration}
                  </span>
                  <span className="text-white font-medium">£{variant.price}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderVariantSelection = () => (
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
        <div className="space-y-3">
          {selectedService?.variants?.map((variant, index) => (
            <Button
              key={index}
              variant="outline"
              className={`w-full h-16 text-left flex justify-between items-center rounded-xl transition-all ${
                selectedVariant === variant
                  ? 'glass-button text-white border-white/30 bg-white/20' 
                  : 'glass-button text-white/70 border-white/20 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => handleVariantSelect(variant)}
            >
              <div>
                <div className="text-sm font-medium">
                  {variant.description || variant.duration}
                </div>
                <div className="text-xs text-white/50">
                  {variant.description ? variant.duration : `${selectedService.title} session`}
                </div>
              </div>
              <div className="text-lg font-bold">£{variant.price}</div>
            </Button>
          ))}
        </div>
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
          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
          initialFocus
          className="rounded-xl border-0 shadow-none p-0 pointer-events-auto w-full [&_.rdp-day]:text-white [&_.rdp-day_button]:hover:bg-white/20 [&_.rdp-day_selected]:bg-white/30 [&_.rdp-head_cell]:text-white/70 [&_.rdp-caption_label]:text-white [&_.rdp-nav_button]:text-white/70 [&_.rdp-nav_button]:hover:text-white"
          style={{
            width: '100%'
          }}
          classNames={{
            months: "space-y-0 w-full",
            month: "space-y-4 w-full",
            caption: "flex justify-center pt-1 relative items-center w-full",
            caption_label: "text-sm font-medium text-white",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white/70 hover:text-white",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex w-full",
            head_cell: "text-white/70 rounded-md flex-1 font-normal text-[0.8rem] text-center",
            row: "flex w-full mt-2",
            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-white/20 [&:has([aria-selected].day-outside)]:bg-white/10 flex-1",
            day: "h-8 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-white/20 hover:text-white rounded-md transition-colors text-sm text-white",
            day_range_end: "day-range-end",
            day_selected: "bg-white/30 text-white hover:bg-white/40 hover:text-white focus:bg-white/30 focus:text-white",
            day_today: "bg-white/10 text-white",
            day_outside: "day-outside text-white/50 opacity-50 aria-selected:bg-white/10 aria-selected:text-white/50 aria-selected:opacity-30",
            day_disabled: "text-white/30 opacity-50",
            day_range_middle: "aria-selected:bg-white/20 aria-selected:text-white",
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

  const renderConfirmation = () => {
    const renderPricingInfo = () => {
      if (!selectedService) return null;

      // If there's a selected variant, show its details
      if (selectedVariant) {
        return (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Option</span>
              <span className="font-medium text-white">
                {selectedVariant.description || selectedVariant.duration}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Duration</span>
              <span className="font-medium text-white">{selectedVariant.duration}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-white/20 pt-3">
              <span className="text-white">Total</span>
              <span className="text-white">£{selectedVariant.price}</span>
            </div>
          </>
        );
      }

      if (selectedService.fromPrice) {
        return (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Duration</span>
              <span className="font-medium text-white">{selectedService.duration}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-white/20 pt-3">
              <span className="text-white">Starting from</span>
              <span className="text-white">£{selectedService.price}</span>
            </div>
          </>
        );
      }

      return (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Duration</span>
            <span className="font-medium text-white">{selectedService.duration}</span>
          </div>
          <div className="flex justify-between text-sm font-medium border-t border-white/20 pt-3">
            <span className="text-white">Total</span>
            <span className="text-white">£{selectedService.price}</span>
          </div>
        </>
      );
    };

    return (
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
                {renderPricingInfo()}
              </div>
              
              <Button className="w-full glass-button text-white rounded-xl font-medium">
                Complete Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
            
            {/* Service info always visible on desktop, only on mobile in step 1 */}
            {(!isMobile || step === 1) && (
              <div className={`mx-auto mb-8 animate-fade-in ${isMobile ? 'max-w-sm px-4' : 'max-w-lg'}`}>
                {renderServiceInfo()}
              </div>
            )}
            
            <div className="max-w-lg mx-auto">
              <div className="transition-all duration-500 ease-in-out">
                {step === 1 && selectedService?.variants && selectedService.variants.length > 1 && (
                  <div className="animate-fade-in">{renderVariantSelection()}</div>
                )}
                {((step === 1 && (!selectedService?.variants || selectedService.variants.length <= 1)) ||
                  (step === 2 && selectedService?.variants && selectedService.variants.length > 1)) && (
                  <div className="animate-fade-in">{renderDateSelection()}</div>
                )}
                {((step === 2 && (!selectedService?.variants || selectedService.variants.length <= 1)) ||
                  (step === 3 && selectedService?.variants && selectedService.variants.length > 1)) && (
                  <div className="animate-fade-in">{renderTimeSelection()}</div>
                )}
                {((step === 3 && (!selectedService?.variants || selectedService.variants.length <= 1)) ||
                  (step === 4 && selectedService?.variants && selectedService.variants.length > 1)) && (
                  <div className="animate-fade-in">{renderConfirmation()}</div>
                )}
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