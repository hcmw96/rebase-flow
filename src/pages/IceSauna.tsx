import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft, Snowflake, Flame, Timer, Users } from "lucide-react";
import { format } from "date-fns";

const IceSauna = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingStep, setBookingStep] = useState(1);

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
    <div className="min-h-screen bg-gradient-dark">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-6 tracking-wide">
                ICE & SAUNA
              </h1>
              <p className="text-white/70 text-lg mb-8 leading-relaxed">
                Experience the ultimate contrast therapy. Our ice baths and infrared saunas work together to boost recovery, 
                improve circulation, reduce inflammation, and enhance overall wellness.
              </p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => setBookingStep(1)} 
                  className="glass-button text-white border-white/30 hover:bg-white/20 px-8 py-6 text-lg"
                >
                  Book Now
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
              <img
                src="/images/rebase-ice-sauna.webp"
                alt="Ice & Sauna facility"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-light text-white text-center mb-12 tracking-wide">
            BENEFITS
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <Snowflake className="w-12 h-12 text-white/70" />
              </div>
              <h3 className="text-xl font-light text-white mb-3">Reduced Inflammation</h3>
              <p className="text-white/60 text-sm">
                Cold exposure helps reduce inflammation and speeds up recovery after intense workouts.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <Flame className="w-12 h-12 text-white/70" />
              </div>
              <h3 className="text-xl font-light text-white mb-3">Improved Circulation</h3>
              <p className="text-white/60 text-sm">
                Heat therapy increases blood flow, delivering oxygen and nutrients throughout your body.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <Timer className="w-12 h-12 text-white/70" />
              </div>
              <h3 className="text-xl font-light text-white mb-3">Faster Recovery</h3>
              <p className="text-white/60 text-sm">
                Contrast therapy accelerates muscle recovery and reduces soreness after training.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-white/70" />
              </div>
              <h3 className="text-xl font-light text-white mb-3">Mental Clarity</h3>
              <p className="text-white/60 text-sm">
                The hot-cold contrast stimulates mental alertness and promotes a sense of wellbeing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Booking Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-light text-white text-center mb-12 tracking-wide">
            BOOK YOUR SESSION
          </h2>
          
          <Card className="glass-card rounded-3xl border-white/10">
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
                {bookingStep > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setBookingStep(1)}
                    className="h-8 w-8 glass-button text-white border-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
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
                    <h3 className="font-serif text-lg font-medium mb-2 text-white">Ice & Sauna Session</h3>
                    <div className="space-y-2 text-sm text-white/70">
                      <div>
                        {selectedDate && format(selectedDate, "MMM d, yyyy")} at {selectedTime}
                      </div>
                      <div>60 minutes • £45</div>
                    </div>
                  </div>
                  <Button className="w-full glass-button text-white rounded-xl font-medium">
                    Complete Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-light text-white text-center mb-12 tracking-wide">
            WHAT TO EXPECT
          </h2>
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div>
              <h3 className="text-xl font-light text-white mb-3">Before Your Session</h3>
              <p className="text-white/60">
                Arrive 10 minutes early. Wear comfortable clothing and bring a towel. We provide all other amenities.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-light text-white mb-3">During Your Session</h3>
              <p className="text-white/60">
                Start with 15 minutes in the infrared sauna, followed by 3-5 minutes in the ice bath. Repeat the cycle 2-3 times for optimal results.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-light text-white mb-3">After Your Session</h3>
              <p className="text-white/60">
                Take time to rest and rehydrate. Many guests feel energized and experience improved sleep that evening.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IceSauna;
