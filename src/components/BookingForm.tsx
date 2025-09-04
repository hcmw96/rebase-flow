import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BookingFormProps {
  service: {
    id: number;
    title: string;
    price: number;
    duration: string;
  };
}

const BookingForm = ({ service }: BookingFormProps) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  const handleNext = () => {
    if (step === 1 && (!selectedDate || !selectedTime)) {
      toast({
        title: "Please select date and time",
        variant: "destructive"
      });
      return;
    }
    
    if (step === 2 && (!customerName || !customerEmail)) {
      toast({
        title: "Please fill in your details",
        variant: "destructive"
      });
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Booking confirmed!",
      description: `Your ${service.title} appointment is booked for ${format(selectedDate!, "PPP")} at ${selectedTime}.`
    });
    
    navigate("/booking-confirmation", {
      state: {
        service,
        date: selectedDate,
        time: selectedTime,
        customer: { name: customerName, email: customerEmail, phone: customerPhone }
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
              step >= num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {num}
            </div>
            {num < 3 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
                step > num ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Select Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-3 block">Choose Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">Choose Time</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className="h-10 text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleNext} className="w-full" size="lg">
              Next Step
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <User className="h-5 w-5 mr-2" />
              Your Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Review Booking
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle className="text-xl">Confirm Your Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-border gap-1 sm:gap-0">
                <span className="font-medium">Service</span>
                <span className="text-foreground/80 sm:text-foreground">{service.title}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-border gap-1 sm:gap-0">
                <span className="font-medium">Date</span>
                <span className="text-foreground/80 sm:text-foreground">{selectedDate ? format(selectedDate, "PPP") : ""}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-border gap-1 sm:gap-0">
                <span className="font-medium">Time</span>
                <span className="text-foreground/80 sm:text-foreground">{selectedTime}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-border gap-1 sm:gap-0">
                <span className="font-medium">Duration</span>
                <span className="text-foreground/80 sm:text-foreground">{service.duration}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-border gap-1 sm:gap-0">
                <span className="font-medium">Name</span>
                <span className="text-foreground/80 sm:text-foreground break-words">{customerName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-border gap-1 sm:gap-0">
                <span className="font-medium">Email</span>
                <span className="text-foreground/80 sm:text-foreground break-all text-sm sm:text-base">{customerEmail}</span>
              </div>
              <div className="flex justify-between items-center py-3 text-lg font-semibold">
                <span>Total Price</span>
                <span>£{service.price}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1" size="lg">
                Confirm Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingForm;