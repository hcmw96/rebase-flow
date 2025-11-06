import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
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
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(["All"]);

  useEffect(() => {
    const fetchSessionTypes = async () => {
      try {
        const res = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyClasses-v1", {
          method: "POST",
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3l1eGtxcW10eGNsdHNma2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjk4MjksImV4cCI6MjA2ODkwNTgyOX0.mmXnxGqS9lyviLYcQ-XPkpimRGypJQkDcqlMb5poHIo",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Error fetching session types");

        const data = await res.json();
        console.log("API response:", data);

        const allServices: any[] = [];
        const categorySet = new Set<string>(["All"]);

        // Categories to group
        const groupedCategories: Record<string, any[]> = {
          "IV Drip": [],
          "Massage Therapy": [],
          "Private Suites": [],
          CRYO: [],
          HBOT: [],
        };

        (data.Services || []).forEach((service: any) => {
          const category = service.RevenueCategory || "Other";
          categorySet.add(category);

          const serviceObj = {
            id: Number(service.Id),
            title: service.Name,
            category: category,
            price: service.Price,
            sessionId: service.sessionId,
            description: service.OnlineDescription,
            sellOnline: service.SellOnline,
            program: service.Program,
            count: service.Count,
          };

          // Check if service belongs to a grouped category
          if (groupedCategories[category]) {
            groupedCategories[category].push(serviceObj);
          } else {
            // Add non-grouped services directly
            allServices.push({
              ...serviceObj,
              variants: [],
            });
          }
        });

        // Create grouped service cards
        Object.entries(groupedCategories).forEach(([categoryName, variants], index) => {
          if (variants.length > 0) {
            categorySet.add(categoryName);
            allServices.push({
              id: 999999 - index, // Unique IDs for grouped cards
              title: categoryName,
              category: categoryName,
              price: Math.min(...variants.map((v) => v.price)),
              sessionId: variants[0].sessionId, // ✅ pega do primeiro variant
              description: `Choose from ${variants.length} ${categoryName} options`,
              sellOnline: true,
              program: categoryName,
              count: variants.length,
              variants: variants.map((v) => ({
                id: v.id,
                title: v.title,
                duration: v.duration,
                price: v.price,
                description: v.title,
                sessionId: v.sessionId,
              })),
            });
          }
        });

        setServices(allServices);
        setCategories(Array.from(categorySet));
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionTypes();
  }, []);

  // Fallback static services in case API fails

  // Use fetched services or fallback to static services
  const allServices = services;

  const filteredServices =
    activeCategory === "All" ? allServices : allServices.filter((service) => service.category === activeCategory);

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
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <Hero />

      <div className="bg-gradient-dark">{/* Removed pt-20 since Hero handles spacing */}
          {/* Loading State */}
          {loading && (
            <section className="px-4 sm:px-6 lg:px-8 mb-12">
              <div className="max-w-7xl mx-auto text-center">
                <div className="text-white text-lg">Loading services...</div>
              </div>
            </section>
          )}

          {/* Error State */}
          {error && !loading && (
            <section className="px-4 sm:px-6 lg:px-8 mb-12">
              <div className="max-w-7xl mx-auto text-center">
                <div className="text-red-400 text-lg">Error: {error}</div>
                <div className="text-white/70 text-sm mt-2">Showing fallback services</div>
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
                        : "glass-button text-white/70 hover:text-white border-white/20",
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
                      service={{
                        duration: service.duration,
                        price: service.price,
                        variants: service.variants,
                        sessionId: service.sessionId || service.variants?.[0]?.sessionId,
                      }}
                    />

                    {openBookingId === service.id && (
                      <Card className="glass-card rounded-3xl border-white/10 animate-in slide-in-from-top-2 duration-300">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            {bookingStep > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackStep}
                                className="h-8 w-8 glass-button text-white border-white/20"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                            )}
                            <CardTitle className="text-center font-serif flex-1 text-white">
                              {bookingStep === 1 && "Choose Date"}
                              {bookingStep === 2 && "Select Time"}
                              {bookingStep === 3 && "Confirm Booking"}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={closeBooking}
                              className="h-8 w-8 glass-button text-white border-white/20"
                            >
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
                                  nav_button:
                                    "text-white/70 hover:text-white h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                  nav_button_previous: "absolute left-1",
                                  nav_button_next: "absolute right-1",
                                  table: "text-white w-full",
                                  head_row: "text-white",
                                  head_cell: "text-white/70 rounded-md w-9 font-normal text-[0.8rem]",
                                  row: "text-white",
                                  cell: "text-white relative p-0 text-center text-sm focus-within:relative focus-within:z-20 h-9 w-9",
                                  day: "text-white h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/20 hover:text-white rounded-md transition-colors text-sm",
                                  day_selected:
                                    "bg-white/30 text-white hover:bg-white/40 hover:text-white focus:bg-white/30 focus:text-white",
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
                                        ? "glass-button text-white border-white/30 bg-white/20"
                                        : "glass-button text-white/70 border-white/20 hover:text-white hover:bg-white/10"
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
                                <h3 className="font-serif text-lg font-medium mb-2 text-white">{service.title}</h3>
                                <div className="space-y-2 text-sm text-white/70">
                                  <div>
                                    {selectedDate && format(selectedDate, "MMM d, yyyy")} at {selectedTime}
                                  </div>
                                  <div>
                                    {service.duration} • £{service.price}
                                  </div>
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
  );
};

export default Services;
