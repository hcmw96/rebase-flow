import { useState, useEffect } from "react";
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

  // Check for access token on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    
    if (!accessToken) {
      const clientId = "f660fd3e-a0d6-4f66-878c-871c9860e565";
      const redirectUri = encodeURIComponent("https://rebase.echo.london/oauth-callback");
      const scope = encodeURIComponent("email profile openid offline_access Mindbody.Api.Public.v6");
      const nonce = "randomStringSeguro123";
      const subscriberId = "f660fd3e-a0d6-4f66-878c-871c9860e565";

      const authUrl = `https://signin.mindbodyonline.com/connect/authorize?response_mode=form_post&response_type=code%20id_token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&subscriberId=${subscriberId}&nonce=${nonce}`;
console.log("URL de autenticação Mindbody:", authUrl);
      window.location.href = authUrl;
    }
  }, []);

  const categories = ["All", "Classes", "Suites", "Tech Therapies", "Massage Therapies", "Manual Therapies", "Other Services"];

  const services = [
    // Classes
    {
      id: 1,
      title: "Contrast Therapy",
      category: "Classes", 
      duration: "60 minutes",
      price: 40
    },
    {
      id: 2,
      title: "Breathwork",
      category: "Classes",
      duration: "60 minutes", 
      price: 40
    },
    {
      id: 3,
      title: "Yoga",
      category: "Classes",
      duration: "60 minutes",
      price: 40
    },

    // Suites
    {
      id: 4,
      title: "Members Contrast Suite Drop In",
      category: "Suites",
      duration: "60 minutes",
      price: 65
    },
    {
      id: 5,
      title: "Premium Suite",
      category: "Suites",
      variants: [
        { duration: "45 minutes", price: 240 },
        { duration: "90 minutes", price: 420 }
      ]
    },
    {
      id: 6,
      title: "Infrared Suite", 
      category: "Suites",
      variants: [
        { duration: "45 minutes", price: 190 },
        { duration: "90 minutes", price: 330 }
      ]
    },

    // Tech Therapies
    {
      id: 7,
      title: "Cryotherapy",
      category: "Tech Therapies",
      variants: [
        { duration: "3 minutes", price: 50, description: "Single session" },
        { duration: "10 sessions", price: 400, description: "Pack of 10" }
      ]
    },
    {
      id: 8,
      title: "HBOT (Hyperbaric Oxygen Therapy)",
      category: "Tech Therapies", 
      variants: [
        { duration: "60 minutes", price: 200, description: "Single session" },
        { duration: "5 sessions", price: 800, description: "Pack of 5" },
        { duration: "10 sessions", price: 1600, description: "Pack of 10" }
      ]
    },

    // Massage Therapies
    {
      id: 9,
      title: "Total Body Realignment",
      category: "Massage Therapies",
      duration: "60-90 minutes",
      price: 195,
      fromPrice: true
    },
    {
      id: 10,
      title: "Sports Massage", 
      category: "Massage Therapies",
      duration: "60-90 minutes",
      price: 185,
      fromPrice: true
    },
    {
      id: 11,
      title: "Lymphatic Drainage",
      category: "Massage Therapies", 
      duration: "60-90 minutes",
      price: 185,
      fromPrice: true
    },
    {
      id: 12,
      title: "Deep Tissue",
      category: "Massage Therapies",
      duration: "60-90 minutes", 
      price: 185,
      fromPrice: true
    },

    // Manual Therapies
    {
      id: 13,
      title: "Osteopathy Consultation",
      category: "Manual Therapies",
      duration: "60 minutes",
      price: 210
    },
    {
      id: 14,
      title: "Structural Fascia Therapy", 
      category: "Manual Therapies",
      duration: "60 minutes",
      price: 200
    },

    // Other Services
    {
      id: 15,
      title: "IV Drip",
      category: "Other Services",
      duration: "45-60 minutes",
      price: 350,
      fromPrice: true
    },
    {
      id: 16,
      title: "Vitamin Infusions",
      category: "Other Services", 
      duration: "30 minutes",
      price: 80
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
                     className="animate-fade-in"
                     service={{
                       duration: service.duration,
                       price: service.price,
                       fromPrice: service.fromPrice,
                       variants: service.variants
                     }}
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
                          <div className="max-w-sm mx-auto glass-morphism rounded-2xl p-4">
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
                        )}
                        
                        {bookingStep === 2 && (
                          <div className="max-w-sm mx-auto space-y-4 glass-morphism rounded-2xl p-4">
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
                          <div className="max-w-sm mx-auto space-y-6 glass-morphism rounded-2xl p-4">
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