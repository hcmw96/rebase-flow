import { useState } from "react";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const Services = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openBookingId, setOpenBookingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingStep, setBookingStep] = useState(1);

  const categories = ["All", "Recovery", "Movement", "Mindfulness", "Therapy"];

  const services = [
    {
      id: 1,
      title: "Ice Bath",
      category: "Recovery",
      duration: "15 minutes",
      price: 25,
      image: "/lovable-uploads/ca3fba7a-cec4-41dc-8899-fd2d4b0d270a.png"
    },
    {
      id: 2,
      title: "Traditional Sauna",
      category: "Recovery",
      duration: "30 minutes",
      price: 35
    },
    {
      id: 3,
      title: "Infrared Sauna", 
      category: "Recovery",
      duration: "30 minutes",
      price: 40
    },
    {
      id: 4,
      title: "Contrast Class",
      category: "Movement",
      duration: "60 minutes",
      price: 45
    },
    {
      id: 5,
      title: "Private Contrast Suite",
      category: "Recovery",
      duration: "90 minutes",
      price: 120
    },
    {
      id: 6,
      title: "Breathwork",
      category: "Mindfulness",
      duration: "45 minutes",
      price: 35
    },
    {
      id: 7,
      title: "Yoga",
      category: "Movement",
      duration: "60 minutes",
      price: 25
    },
    {
      id: 8,
      title: "Hyperbaric Oxygen",
      category: "Therapy",
      duration: "60 minutes",
      price: 80
    },
    {
      id: 9,
      title: "Cryotherapy",
      category: "Recovery",
      duration: "3 minutes",
      price: 45
    },
    {
      id: 10,
      title: "IV Vitamin Therapy",
      category: "Therapy",
      duration: "45 minutes",
      price: 95
    },
    {
      id: 11,
      title: "Lymphatic Drainage",
      category: "Therapy",
      duration: "60 minutes",
      price: 85
    },
    {
      id: 12,
      title: "Recovery Specialist",
      category: "Therapy",
      duration: "30 minutes",
      price: 65
    }
  ];

  const filteredServices = activeCategory === "All" 
    ? services 
    : services.filter(service => service.category === activeCategory);

  const handleBookNow = (serviceId: number) => {
    setOpenBookingId(serviceId);
    setBookingStep(1);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const closeBooking = () => {
    setOpenBookingId(null);
    setBookingStep(1);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) setBookingStep(2);
  };


  const handleBackStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setBookingStep(3);
  };

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

  return (
    <div 
      className="min-h-screen bg-cover bg-left bg-fixed relative"
      style={{
        backgroundImage: `url('/lovable-uploads/397f6034-d62e-4ad3-b98c-30070da1186a.png')`
      }}
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      
      <div className="relative z-10">
        <Navigation />
        
        <div className="pt-20">

        {/* Category Filter */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "transition-all duration-300 rounded-xl",
                    activeCategory === category 
                      ? "glass-button text-white" 
                      : "glass-button text-white/70 hover:text-white border-white/20"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service) => (
                <div key={service.id} className="space-y-4">
                  <ServiceCard 
                    id={service.id}
                    title={service.title}
                    category={service.category}
                    image={service.image}
                    className="animate-fade-in"
                  />
                  
                  {openBookingId === service.id && (
                    <Card className="glass-card rounded-3xl border-white/10 animate-in slide-in-from-top-2 duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          {bookingStep > 1 && (
                            <Button variant="ghost" size="icon" onClick={handleBackStep} className="h-8 w-8 glass-button text-white border-white/20">
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          )}
                          <CardTitle className="text-center font-serif flex-1 text-white">
                            {bookingStep === 1 && "Choose Date"}
                            {bookingStep === 2 && "Select Time"}
                            {bookingStep === 3 && "Confirm Booking"}
                          </CardTitle>
                          <Button variant="ghost" size="icon" onClick={closeBooking} className="h-8 w-8 glass-button text-white border-white/20">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-6">
                        {bookingStep === 1 && (
                          <div className="max-w-sm mx-auto">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                              initialFocus
                              className="rounded-xl border-0 shadow-none p-0 w-full"
                            />
                          </div>
                        )}
                        
                        {bookingStep === 2 && (
                          <div className="max-w-sm mx-auto space-y-4">
                            <div className="text-center text-sm text-white/70 mb-6">
                              {selectedDate && format(selectedDate, "EEEE, MMMM d")}
                            </div>
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
                        )}
                        
                        {bookingStep === 3 && (
                          <div className="max-w-sm mx-auto space-y-6">
                            <div className="text-center">
                              <h3 className="font-serif text-lg font-medium mb-2 text-white">
                                {service.title}
                              </h3>
                              <div className="space-y-2 text-sm text-white/70">
                                <div>{selectedDate && format(selectedDate, "MMM d, yyyy")} at {selectedTime}</div>
                                <div>{service.duration} • £{service.price}</div>
                              </div>
                            </div>
                            <Button className="w-full glass-button text-white rounded-xl font-medium">
                              Complete Booking
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Services;