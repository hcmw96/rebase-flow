import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMindbody } from "@/hooks/useMindbody";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

// Types for the UI data structures
interface ServiceItem {
  id: number;
  title: string;
  category: string;
  duration: string;
  price?: number;
  fromPrice?: boolean;
  variants?: { duration: string; price: number; description?: string; }[];
  description?: string;
}

interface ClassItem {
  id: number;
  title: string;
  category: "Classes";
  duration: string;
  startTime: string;
  endTime: string;
  instructor: string;
  capacity: number;
  booked: number;
  available: boolean;
}

type BookableItem = ServiceItem | ClassItem;

// Type guard functions
const isClass = (item: BookableItem): item is ClassItem => {
  return 'startTime' in item;
};

const isService = (item: BookableItem): item is ServiceItem => {
  return !('startTime' in item);
};

const Services = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openBookingId, setOpenBookingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const { services: mindbodyServices, classes: mindbodyClasses, loading, error, refreshData, isAuthenticated, loginWithEmail } = useMindbody();
  const [loginEmail, setLoginEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const categories = ["All", "Classes", "Services", "Appointments"];

  const handleEmailLogin = async () => {
    if (!loginEmail.trim()) return;
    
    setIsLoggingIn(true);
    try {
      const success = await loginWithEmail(loginEmail);
      if (success) {
        setLoginEmail("");
      }
    } catch (err) {
      console.error('Failed to login:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fallback static services for when Mindbody is unavailable
  const fallbackServices: ServiceItem[] = [
    {
      id: 1,
      title: "Contrast Therapy",
      category: "Classes", 
      duration: "60 minutes",
      price: 40
    },
    {
      id: 2,
      title: "Premium Suite",
      category: "Services",
      duration: "45-90 minutes",
      variants: [
        { duration: "45 minutes", price: 240 },
        { duration: "90 minutes", price: 420 }
      ]
    },
    {
      id: 3,
      title: "Sports Massage", 
      category: "Services",
      duration: "60-90 minutes",
      price: 185,
      fromPrice: true
    }
  ];

  // Transform Mindbody services to UI format
  const transformMindbodyServices = (services: any[]): ServiceItem[] => {
    return services.map(service => ({
      id: service.Id,
      title: service.Name,
      category: mapMindbodyCategory(service.CategoryName),
      duration: `${service.Duration} minutes`,
      price: service.OnlinePrice || service.Price,
      description: service.Description
    }));
  };

  // Transform Mindbody classes to UI format  
  const transformMindbodyClasses = (classes: any[]): ClassItem[] => {
    return classes.map(cls => ({
      id: cls.Id,
      title: cls.ClassDescription.Name,
      category: "Classes" as const,
      duration: `${cls.ClassDescription.Duration} minutes`,
      startTime: cls.StartDateTime,
      endTime: cls.EndDateTime,
      instructor: `${cls.Staff.FirstName} ${cls.Staff.LastName}`,
      capacity: cls.MaxCapacity,
      booked: cls.TotalBooked,
      available: cls.MaxCapacity - cls.TotalBooked > 0
    }));
  };

  // Map Mindbody categories to UI categories
  const mapMindbodyCategory = (categoryName: string) => {
    const categoryMap: { [key: string]: string } = {
      'Massage': 'Services',
      'Therapy': 'Services', 
      'Treatment': 'Services',
      'Class': 'Classes',
      'Workshop': 'Classes',
      'Session': 'Services'
    };
    
    for (const [key, value] of Object.entries(categoryMap)) {
      if (categoryName?.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return 'Services';
  };

  // Get combined services (prioritize Mindbody data, use fallback only if no data)
  const services = mindbodyServices.length > 0 
    ? transformMindbodyServices(mindbodyServices)
    : (!loading ? fallbackServices : []);
    
  const classes = transformMindbodyClasses(mindbodyClasses);

  const getFilteredData = () => {
    if (activeCategory === "All") {
      return [...services, ...classes];
    } else if (activeCategory === "Classes") {
      return classes;
    } else if (activeCategory === "Services") {
      return services.filter(service => service.category === "Services");
    } else if (activeCategory === "Appointments") {
      return services; // Could filter for bookable services
    }
    return services.filter(service => service.category === activeCategory);
  };

  const filteredData = getFilteredData();

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
        
        {!isAuthenticated && !loading && (
          <section className="px-4 sm:px-6 lg:px-8 mb-8">
            <div className="max-w-7xl mx-auto">
              <Alert className="glass-card border-blue-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-white">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="flex-grow">Enter your email or phone number to access your Mindbody account:</span>
                    <div className="flex gap-2 min-w-0 flex-1 sm:flex-initial">
                      <Input 
                        placeholder="Email or phone number"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()}
                        className="glass-card bg-black/20 border-white/20 text-white placeholder:text-white/50"
                        disabled={isLoggingIn}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleEmailLogin}
                        className="text-blue-400 hover:bg-blue-500/20 whitespace-nowrap"
                        disabled={isLoggingIn || !loginEmail.trim()}
                      >
                        {isLoggingIn ? "..." : "Login"}
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </section>
        )}

        {/* Error Alert */}
        {error && (
          <section className="px-4 sm:px-6 lg:px-8 mb-8">
            <div className="max-w-7xl mx-auto">
              <Alert className="glass-card border-amber-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-white flex items-center justify-between">
                  <span>{error} - Showing limited services.</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshData}
                    className="text-white hover:bg-white/10 ml-4"
                    disabled={loading}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section className="px-4 sm:px-6 lg:px-8 mb-8">
            <div className="max-w-7xl mx-auto text-center">
              <div className="glass-card rounded-3xl border-white/10 p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/70">Loading live services and classes...</p>
              </div>
            </div>
          </section>
        )}

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

        {/* Services and Classes Grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredData.map((item) => (
                <div key={item.id} className="space-y-4">
                  {isClass(item) ? (
                    // Render class card with live schedule info
                    <Card className="glass-card rounded-3xl border-white/10 animate-fade-in">
                      <CardHeader>
                        <CardTitle className="text-white font-serif">{item.title}</CardTitle>
                        <Badge variant="outline" className="w-fit glass-button text-white/70 border-white/20">
                          {item.category}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-white/70">
                          <div className="flex justify-between items-center">
                            <span>Duration:</span>
                            <span className="text-white">{item.duration}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Next Class:</span>
                            <span className="text-white">
                              {format(new Date(item.startTime), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Instructor:</span>
                            <span className="text-white">{item.instructor}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Availability:</span>
                            <span className={cn("font-medium", item.available ? "text-green-400" : "text-red-400")}>
                              {item.available ? `${item.capacity - item.booked} spots left` : "Full"}
                            </span>
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-6 glass-button text-white rounded-xl"
                          disabled={!item.available}
                          onClick={() => handleBookNow(item.id)}
                        >
                          {item.available ? "Book Class" : "Join Waitlist"}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    // Render service card
                    <ServiceCard 
                      id={item.id}
                      title={item.title}
                      category={item.category}
                      className="animate-fade-in"
                      service={{
                        duration: item.duration,
                        price: item.price,
                        fromPrice: item.fromPrice,
                        variants: item.variants
                      }}
                    />
                  )}
                  
                  {openBookingId === item.id && (
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
                              disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                              initialFocus
                              className="rounded-xl border-0 shadow-none p-0 w-full [&_.rdp-day]:text-white [&_.rdp-day_button]:hover:bg-white/20 [&_.rdp-day_selected]:bg-white/30 [&_.rdp-head_cell]:text-white/70"
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
                                {item.title}
                              </h3>
                              <div className="space-y-2 text-sm text-white/70">
                                <div>{selectedDate && format(selectedDate, "MMM d, yyyy")} at {selectedTime}</div>
                                <div>{item.duration} • £{isService(item) ? item.price || 0 : 'TBD'}</div>
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