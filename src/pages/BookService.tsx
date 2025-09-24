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
import { Calendar as CalendarIcon, Clock, ArrowLeft, Check, MapPin, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const isMobile = useIsMobile();

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

  // Fetch availabilities
  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getBookableItems",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionTypeIds: [parseInt(serviceId || "0")] }),
          }
        );
        if (!res.ok) throw new Error("Erro ao buscar disponibilidades");
        const data = await res.json();
        setAvailabilities(data.Availabilities);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (serviceId) fetchAvailabilities();
  }, [serviceId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!service) return <p>Serviço não encontrado</p>;

  // Datas disponíveis para o calendário
  const availableDates = availabilities.map((a) => parseISO(a.StartDateTime));

  // Quando seleciona um dia, pegar horários disponíveis
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (!date) return;
    const slots = availabilities
      .filter((a) => {
        const start = parseISO(a.StartDateTime);
        return (
          start.getFullYear() === date.getFullYear() &&
          start.getMonth() === date.getMonth() &&
          start.getDate() === date.getDate()
        );
      })
      .map((a) => format(parseISO(a.StartDateTime), "HH:mm"));
    setTimeSlots(slots);
    setSelectedTime("");
  };


  const renderMobileHeader = () => (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="w-8" />
      </div>
    </div>
  );



  const renderServiceInfo = () => (
    <Card className="glass-card rounded-3xl border-white/10 mb-6">
      <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex justify-between items-start mb-3">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {service?.category} {/* <-- usando service do fetch */}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              £
            </div>
            <div className="text-sm text-white/70">

            </div>
          </div>
        </div>
        <h1 className="font-serif text-2xl font-medium text-white mb-3">
          {service?.title}
        </h1>
        <p className="text-white/70 leading-relaxed mb-4">
          {service?.description}
        </p>

      </CardContent>
    </Card>
  );


    const handleTimeSelect = (time: string) => {
    setSelectedTime(time);

    // Verifica se já existe code ou access_token na URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const accessToken = params.get("access_token");

    if (!code && !accessToken) {
      const clientId = "f660fd3e-a0d6-4f66-878c-871c9860e565";
      const redirectUri = encodeURIComponent(
        "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/teste"
      );
      const subscriberId = "f660fd3e-a0d6-4f66-878c-871c9860e565";
      const nonce = crypto.randomUUID();
      const authUrl = `https://signin.mindbodyonline.com/connect/authorize?response_mode=form_post&response_type=code%20id_token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=email profile openid offline_access Mindbody.Api.Public.v6&subscriberId=${subscriberId}&nonce=${nonce}`;
      window.location.href = authUrl;
    } else {
      console.log("Já existe code ou access_token, não redirecionando");
      // Aqui você pode continuar para criar a reserva usando o accessToken
    }
  };

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

                </div>
              )}

              {/* Service info always visible on desktop, only on mobile in step 1 or 0 */}
              {!isMobile && (
                <div className={` flex justify-center flex-col mx-auto mb-8 animate-fade-in ${isMobile ? 'max-w-sm px-4' : 'max-w-lg'}`}>
                  {renderServiceInfo()}

                  {/* Centraliza o calendário */}
                  <div className="flex justify-center mx-auto min-w-[510px]">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      minDate={new Date()}
                      disabled={(date) =>
                        !availableDates.some(
                          (d) =>
                            d.getFullYear() === date.getFullYear() &&
                            d.getMonth() === date.getMonth() &&
                            d.getDate() === date.getDate()
                        )
                      }
                      className="text-white rounded-lg p-4 border border-white/20 glass-card w-full max-w-md flex flex-col items-center"
                    />
                  </div>

                  {/* Horários disponíveis com professor */}
                  {timeSlots.length > 0 && (
                    <div className="mt-4">
                      <h2 className="text-xl mb-2">Horários disponíveis:</h2>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((t) => {
                          // encontra a disponibilidade correspondente
                          const availability = availabilities.find((a) => {
                            const start = parseISO(a.StartDateTime);
                            return (
                              format(start, "HH:mm") === t &&
                              selectedDate &&
                              start.getFullYear() === selectedDate.getFullYear() &&
                              start.getMonth() === selectedDate.getMonth() &&
                              start.getDate() === selectedDate.getDate()
                            );
                          });

                          const staffName = availability?.Staff?.DisplayName || "Indisponível";

                          return (
                            <Button
                              key={t}
                              variant={selectedTime === t ? "default" : "outline"}
                               onClick={() => handleTimeSelect(t)}
                              className="text-white flex flex-col"
                            >
                              <span>{t}</span>
                              <span className="text-xs text-white/70">{staffName}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Seleção final */}
                  {selectedDate && selectedTime && (
                    <p className="mt-4">
                      Você selecionou: {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                    </p>
                  )}
                </div>
              )}



            </div>
          </section>
        </div>

        {!isMobile && <Footer />}
      </div>
    </div>
  );
};

export default BookService;