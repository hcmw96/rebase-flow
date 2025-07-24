import { useState } from "react";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const Services = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingStep, setBookingStep] = useState(1);

  const categories = ["All", "Recovery", "Movement", "Mindfulness", "Therapy"];

  const services = [
    {
      id: 1,
      title: "Ice Baths",
      category: "Recovery",
      duration: "15 minutes",
      price: 25
    },
    {
      id: 2,
      title: "Traditional Saunas",
      category: "Recovery",
      duration: "30 minutes",
      price: 35
    },
    {
      id: 3,
      title: "Infrared Saunas", 
      category: "Recovery",
      duration: "30 minutes",
      price: 40
    },
    {
      id: 4,
      title: "Contrast Classes",
      category: "Movement",
      duration: "60 minutes",
      price: 45
    },
    {
      id: 5,
      title: "Private Contrast Suites",
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
      title: "Recovery Specialists",
      category: "Therapy",
      duration: "30 minutes",
      price: 65
    }
  ];

  const filteredServices = activeCategory === "All" 
    ? services 
    : services.filter(service => service.category === activeCategory);

  const handleBookNow = (service: any) => {
    setSelectedService(service);
    setBookingStep(1);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) setBookingStep(2);
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
    <div className="min-h-screen">
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
                    "transition-all duration-300",
                    activeCategory === category 
                      ? "btn-luxury" 
                      : "btn-ghost-luxury"
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
              {filteredServices.map((service, index) => (
                <Drawer key={service.id}>
                  <DrawerTrigger asChild>
                    <div onClick={() => handleBookNow(service)}>
                      <ServiceCard 
                        {...service}
                        className="animate-fade-in cursor-pointer"
                      />
                    </div>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="text-center font-serif">
                        {bookingStep === 1 && "Choose Date"}
                        {bookingStep === 2 && "Select Time"}
                        {bookingStep === 3 && "Confirm Booking"}
                      </DrawerTitle>
                    </DrawerHeader>
                    
                    <div className="px-4 pb-8">
                      {bookingStep === 1 && (
                        <div className="max-w-sm mx-auto">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                            initialFocus
                            className="rounded-xl border-0 shadow-none p-0"
                          />
                        </div>
                      )}
                      
                      {bookingStep === 2 && (
                        <div className="max-w-sm mx-auto space-y-4">
                          <div className="text-center text-sm text-muted-foreground mb-6">
                            {selectedDate && format(selectedDate, "EEEE, MMMM d")}
                          </div>
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
                      )}
                      
                      {bookingStep === 3 && (
                        <div className="max-w-sm mx-auto space-y-6">
                          <div className="text-center">
                            <h3 className="font-serif text-lg font-medium mb-2">
                              {selectedService?.title}
                            </h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div>{selectedDate && format(selectedDate, "MMM d, yyyy")} at {selectedTime}</div>
                              <div>{selectedService?.duration} • £{selectedService?.price}</div>
                            </div>
                          </div>
                          <Button className="w-full btn-luxury">
                            Complete Booking
                          </Button>
                        </div>
                      )}
                    </div>
                  </DrawerContent>
                </Drawer>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Services;