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
import { Calendar as CalendarIcon, ArrowLeft, Check } from "lucide-react";
import { format } from "date-fns";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyClasses-v1",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Erro ao buscar serviço");

        const data = await res.json();
        const serviceIdNum = parseInt(serviceId || "");
        const allServices = Object.values(data.sessionTypes).flat();
        const foundService = allServices.find((s: any) => s.id === serviceIdNum);

        if (!foundService) {
          navigate("/services");
          return;
        }

        setService(foundService);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, navigate]);

  const handleOptionSelect = (option: any) => {
    setSelectedOption(option);
    setStep(1);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate("/services");
    }
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

  if (!service) return loading ? <p>Loading...</p> : <p>{error}</p>;

  const renderServiceInfo = () => (
    <Card className="glass-card rounded-3xl border-white/10 mb-6">
      <CardContent className={`${isMobile ? "p-4" : "p-6"}`}>
        <div className="flex justify-between items-start mb-3">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {service.category}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              £{selectedOption ? selectedOption.price : service.price}
            </div>
            <div className="text-sm text-white/70">
              {selectedOption ? selectedOption.duration : service.duration}
            </div>
          </div>
        </div>
        <h1 className="font-serif text-2xl font-medium text-white mb-3">{service.title}</h1>
        <p className="text-white/70 leading-relaxed mb-4">{service.description}</p>
        {selectedOption && <div className="text-sm text-white/60">{selectedOption.description}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative transition-all duration-700 ease-in-out"
      style={{ backgroundImage: `url('/lovable-uploads/8911d1ac-19d7-427a-9138-19c768396ea7.png')` }}
    >
      <div className="absolute inset-0 bg-black/50 z-0 transition-opacity duration-500" />
      <div className="relative z-10 min-h-screen animate-fade-in">
        {!isMobile && <Navigation />}
        {isMobile && (
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40 p-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft />
            </Button>
            <div className="text-center text-sm font-medium text-foreground">{step === 0 ? "Choose Option" : step === 1 ? "Choose Date" : step === 2 ? "Pick Time" : "Confirm Booking"}</div>
            <div className="w-8" />
          </div>
        )}

        <div className={isMobile ? "pt-0" : "pt-20"}>
          <section className={isMobile ? "py-4" : "py-20 px-4 sm:px-6 lg:px-8"}>
            <div className="max-w-7xl mx-auto">
              <div className={`mx-auto mb-8 animate-fade-in ${isMobile ? "max-w-sm px-4" : "max-w-lg"}`}>
                {renderServiceInfo()}
              </div>

              <div className="max-w-lg mx-auto">
                {step === 0 && service.options && (
                  <Select onValueChange={(value) => handleOptionSelect(service.options[parseInt(value)])}>
                    <SelectTrigger className="w-full h-14 glass-button text-white border-white/20 rounded-xl bg-white/5">
                      <SelectValue placeholder="Select an option..." className="text-white" />
                    </SelectTrigger>
                    <SelectContent>
                      {service.options.map((option: any, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {option.name} - £{option.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {step === 1 && <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} />}
                {step === 2 && (
                  <div className="grid grid-cols-3 gap-3">
                    {generateTimeSlots().map((time) => (
                      <Button key={time} onClick={() => handleTimeSelect(time)}>
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
                {step === 3 && (
                  <Card className="glass-card rounded-3xl">
                    <CardContent>
                      <h3 className="text-white">{service.title}</h3>
                      <p className="text-white/70">{service.description}</p>
                      <p className="text-white">Date: {selectedDate && format(selectedDate, "MMM d, yyyy")}</p>
                      <p className="text-white">Time: {selectedTime}</p>
                    </CardContent>
                  </Card>
                )}
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
