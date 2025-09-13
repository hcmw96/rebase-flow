import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

const Cryotherapy = () => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const service = {
    id: 'cryotherapy',
    title: 'Whole Body Cryotherapy',
    category: 'Recovery',
    duration: 3,
    price: 50,
    description: 'Experience the transformative power of cold therapy. Boost recovery, reduce inflammation, and enhance your wellbeing in our state-of-the-art cryotherapy chambers.',
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
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/services');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 17) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const renderMobileHeader = () => (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-white hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-white">
            {step === 1 ? 'Choose Date' : step === 2 ? 'Choose Time' : 'Confirm Booking'}
          </h1>
          <p className="text-xs text-white/70">Step {step} of 3</p>
        </div>
        <div className="w-16"></div>
      </div>
    </div>
  );

  const renderProgressDots = () => (
    <div className="flex justify-center gap-2 mb-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-colors ${
            i <= step ? 'bg-primary' : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );

  const renderServiceInfo = () => (
    <Card className="glass-card border-white/10 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 mb-2">
            {service.category}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">£{service.price}</div>
            <div className="text-sm text-white/70 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {service.duration} minutes
            </div>
          </div>
        </div>
        <CardTitle className="text-white text-xl">{service.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-white/80 leading-relaxed">
          {service.description}
        </CardDescription>
      </CardContent>
    </Card>
  );

  const renderDateSelection = () => (
    <Card className="glass-card border-white/10">
      <CardContent className="p-6">
        <div className="max-w-sm mx-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date() || date.getDay() === 0}
            className="w-full pointer-events-auto border-0 shadow-none p-0"
            classNames={{
              months: "space-y-0 w-full",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center w-full",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white/70 hover:text-white border-white/20",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell: "text-white/70 rounded-md flex-1 font-normal text-[0.8rem] text-center",
              row: "flex w-full mt-2",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
              day: "h-8 w-full p-0 font-normal text-white hover:bg-white/20 hover:text-white rounded-md transition-colors aria-selected:opacity-100",
              day_selected: "bg-white/30 text-white hover:bg-white/40 hover:text-white focus:bg-white/30 focus:text-white",
              day_today: "bg-white/10 text-white",
              day_outside: "text-white/50 opacity-50",
              day_disabled: "text-white/30 opacity-50",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderTimeSelection = () => (
    <Card className="glass-card border-white/10">
      <CardContent className="p-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {generateTimeSlots().map((time) => (
            <button
              key={time}
              onClick={() => handleTimeSelect(time)}
              className="p-3 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-primary hover:border-primary transition-all duration-200 text-sm font-medium"
            >
              {time}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderConfirmation = () => (
    <Card className="glass-card border-white/10">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-3 text-green-400 mb-4">
          <CheckCircle className="w-6 h-6" />
          <span className="text-lg font-semibold">Booking Confirmed!</span>
        </div>
        
        <div className="space-y-4 text-white">
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
            <span className="text-white/70">Service:</span>
            <span className="font-semibold">{service.title}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
            <span className="text-white/70">Date:</span>
            <span className="font-semibold">{selectedDate?.toDateString()}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
            <span className="text-white/70">Time:</span>
            <span className="font-semibold">{selectedTime}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
            <span className="text-white/70">Duration:</span>
            <span className="font-semibold">{service.duration} minutes</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-primary/20 rounded-lg border border-primary/30">
            <span className="text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total:
            </span>
            <span className="font-bold text-xl text-primary">£{service.price}</span>
          </div>
        </div>

        <div className="pt-4">
          <Link to="/services">
            <Button className="w-full btn-luxury">
              Return to Services
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/lovable-uploads/eacb5724-5ff4-4a7e-9e11-224717628e17.png)` }}
      >
        <div className="absolute inset-0 bg-background/80"></div>
      </div>

      {/* Navigation - hidden on mobile */}
      {!isMobile && <Navigation />}

      <div className="relative z-10">
        {isMobile && renderMobileHeader()}
        
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {!isMobile && renderProgressDots()}
          
          <div className="space-y-6">
            {renderServiceInfo()}
            
            {step === 1 && renderDateSelection()}
            {step === 2 && renderTimeSelection()}
            {step === 3 && renderConfirmation()}
          </div>
        </div>
      </div>

      {/* Footer - hidden on mobile */}
      {!isMobile && <Footer />}
    </div>
  );
};

export default Cryotherapy;