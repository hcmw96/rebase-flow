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
import { format, parseISO, set } from "date-fns";
import { useLocation } from "react-router-dom";
import CardFormDialog from "@/components/CardFormDialog";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (profileData: {
    birthDate: string;
    mobilePhone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }) => void;
  initialData?: {
    birthDate: string;
    mobilePhone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

const BookService = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const isMobile = useIsMobile();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [profileData, setProfileData] = useState({
    birthDate: "",
    mobilePhone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactEmail: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [locationId, setLocationId] = useState<string>("");
  const [staffId, setStaffId] = useState<string>("");
  const { title } = location.state || {};
  const { price } = location.state || {};
  const { duration } = location.state || {};
  const { category } = location.state || {};
  const { serviceId } = useParams<{ serviceId: string }>();
  const productId = serviceId;
  const [userIdFromProfile, setUserIdFromProfile] = useState<string>("");





  useEffect(() => {
    const fetchService = async () => {
      try {

        setLoading(true);
        const res = await fetch(
          `https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getAllSessionTypes?name=${title || ""}`,
          {
            method: "GET",
            headers: {
              Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZ3l1eGtxcW10eGNsdHNma2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjk4MjksImV4cCI6MjA2ODkwNTgyOX0.mmXnxGqS9lyviLYcQ-XPkpimRGypJQkDcqlMb5poHIo",
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Erro ao buscar serviço");
        const data = await res.json();


        if (!data) {
          navigate("/services");
          return;
        }
        setService(data);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [navigate]);

  // Fetch availabilities
  useEffect(() => {
    if (!service) return;
    const fetchAvailabilities = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getBookableItems",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionTypeIds: [parseInt(service.Id || "0")] }),
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
    fetchAvailabilities();
  }, [service]);

  if (loading)
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
      }}>
        <p>Loading...</p>
      </div>
    );

  if (error) return <p>{error}</p>;


  // Datas disponíveis para o calendário
  const availableDates = availabilities.map((a) => parseISO(a.StartDateTime)).filter(d => !isNaN(d.getTime()));


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
            {category}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              £ {price}
            </div>
            <div className="text-sm text-white/70">

            </div>
          </div>
        </div>
        <h1 className="font-serif text-2xl font-medium text-white mb-3">
          {title}
        </h1>
        <p className="text-white/70 leading-relaxed mb-4">
          {service?.description}
        </p>

      </CardContent>
    </Card>
  );
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);

    if (!selectedDate) return;



    // encontra a disponibilidade correspondente
    const availability = availabilities.find((a) => {
      const start = parseISO(a.StartDateTime);
      return (
        format(start, "HH:mm") === time &&
        start.getFullYear() === selectedDate.getFullYear() &&
        start.getMonth() === selectedDate.getMonth() &&
        start.getDate() === selectedDate.getDate()
      );
    });

    if (!availability) {
      alert("Disponibilidade não encontrada.");
      return;
    }

    const staffId = availability.Staff?.Id;
    if (!availability.Location?.Id) {
      alert("Local da aula não encontrado");
      return;
    }
    const locationId = availability.Location?.Id;

    const bookAbleDate = availability.BookableEndDateTime;
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Token não encontrado, favor logar novamente.");
      return;
    }
    const clientId = localStorage.getItem("clientId");

    console.log('serviço', service)
    const sessionTypeId = service.Id;

    setStaffId(staffId);
    setLocationId(locationId);

    // Continuar workflow do Mindbody
    proceedMindbodyWorkflow(token, bookAbleDate, time, staffId, locationId, sessionTypeId, clientId);
    console.log("Selected time:", time, "Staff ID:", staffId, "Location ID:", locationId, "Session Type ID:", sessionTypeId);
  };


  const proceedMindbodyWorkflow = async (
    token: string,
    date: Date,
    time: string,
    staffId: string,
    locationId: string,
    sessionTypeId: string,
    clientId: string
  ) => {
    try {



      // 🔎 chama sua função no Supabase para obter o usuário
      const meRes = await fetch(
        "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyMe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );

      // Se retornar 403, remove token e redireciona
      if (meRes.status === 403) {
        localStorage.removeItem("access_token");
        navigate("/services");
        return; // interrompe o fluxo
      }

      if (meRes.status === 401) {
        // Token expirado -> buscar refreshToken
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          localStorage.removeItem("access_token");
          navigate("/services");
          return;
        }

        const refreshRes = await fetch(
          "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/refreshMindbodyToken",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          }
        );

        if (!refreshRes.ok) {
          localStorage.removeItem("access_token");
          navigate("/services");
          return;
        }

        const newTokens = await refreshRes.json();

        // Atualiza localStorage com novo access_token
        localStorage.setItem("access_token", newTokens.access_token);
        localStorage.setItem("refresh_token", newTokens.refresh_token);

      }

      if (!meRes.ok) {
        const errorText = await meRes.text();
        throw new Error(`Erro ao validar usuário Mindbody: ${errorText}`);
      }
      const { user } = await meRes.json();
      console.log("Mindbody user:", user);
      setUserIdFromProfile(user.id);

      if (!user.businessProfiles || user.businessProfiles.length === 0) {
        setShowProfileModal(true);
        toast.error("Complete your profile before continuing");
        return;
      }

      const userId = user.businessProfiles[0]?.profileId;



      const cardData = await new Promise<{
        creditCardNumber: string;
        expMonth: string;
        expYear: string;
        cvv: string;
        billingName: string;
        billingPostalCode: string;
        saveInfo: boolean;
      }>((resolve, reject) => {
        const modalRoot = document.createElement("div");
        document.body.appendChild(modalRoot);

        const root = ReactDOM.createRoot(modalRoot);

        const handleClose = () => {
          toast.error("Payment canceled");
          root.unmount();
          modalRoot.remove();
        };

        const handleSubmit = (metadata: any) => {
          resolve(metadata);
          root.unmount();
          modalRoot.remove();
        };

        root.render(<CardFormDialog amount={price} onCancel={handleClose} onSubmit={handleSubmit} />);
      });

      const getMindbodyToken = async () => {
        const res = await fetch(
          "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyStaffToken",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "henry@xeniasocial.com",
              password: "Loveablefix!",
              siteId: "5736189",
            }),
          }
        );
        if (!res.ok) throw new Error("Erro ao obter token via Supabase");
        const { AccessToken: rawToken } = await res.json();
        const cleanToken = rawToken.replace(/\s+/g, '');
        return cleanToken;
      };

      const mindbodyToken = await getMindbodyToken();

      const checkoutBody = {
        CartId: null,
        ClientId: userId,
        PayerClientId: "",
        Test: true,
        Items: [
          {
            Item: {
              Type: "Service",
              Metadata: { Id: productId },
            },
            Quantity: 1,
            AppointmentBookingRequests: [
              {
                StaffId: staffId,
                LocationId: locationId,
                SessionTypeId: sessionTypeId,
                StartDateTime: date,
              },
            ],
          },
        ],
        InStore: false,
        CalculateTax: true,
        Payments: [
          {
            Type: "CreditCard",
            Metadata: {
              amount: price,
              creditCardNumber: cardData.creditCardNumber,
              expMonth: cardData.expMonth,
              expYear: cardData.expYear,
              cvv: cardData.cvv,
              billingName: cardData.billingName,
              billingPostalCode: cardData.billingPostalCode,
              saveInfo: cardData.saveInfo,
            },
          },
        ],
        SendEmail: false,
      };

      console.log("Checkout body (JSON):", JSON.stringify(checkoutBody, null, 2));

      // chama a Edge Function de checkout
      const checkoutRes = await fetch(
        "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyCheckout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": mindbodyToken.trim(),
          },
          body: JSON.stringify(checkoutBody),
        }
      );
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || "Erro no checkout");

      toast.success("Scheduling completed successfully!");
      navigate("/services");

    } catch (err: any) {
      console.error(err);
      toast.error(`Error on Mindbody workflow : ${err.message}`);
    }
  };




  const handleSaveProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Token não encontrado");
      return;
    }

    try {
      const res = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          businessId: "5736189",
          userId: userIdFromProfile,
          profileData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar perfil");

      toast.success("Profile saved successfully!");
      setShowProfileModal(false);
    } catch (err: any) {
      alert(`Erro ao cadastrar perfil: ${err.message}`);
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




                  {availableDates.length > 0 ? (
                    <div className="flex justify-center mx-auto min-w-[510px]">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) =>
                          date < new Date() ||
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
                  ) : (
                    <p>Loading Calendar...</p>
                  )}

                  {/* Horários disponíveis com professor */}
                  {timeSlots.length > 0 && (
                    <div className="mt-4">
                      <h2 className="text-xl mb-2">Available times:</h2>
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
                      You selected: {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                    </p>
                  )}
                </div>
              )}



            </div>
          </section>
        </div>

        {!isMobile && <Footer />}

        {showProfileModal && (
          <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Complete your profile</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <Input
                  type="date"
                  placeholder="Date of Birth"
                  value={profileData.birthDate}
                  onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                />
                <Input
                  placeholder="Mobile phone"
                  value={profileData.mobilePhone}
                  onChange={(e) => setProfileData({ ...profileData, mobilePhone: e.target.value })}
                />
                <Input
                  placeholder="Address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                />
                <Input
                  placeholder="City"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                />
                <Input
                  placeholder="State"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                />
                <Input
                  placeholder="Country"
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                />
                <Input
                  placeholder="Postal code"
                  value={profileData.postalCode}
                  onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                />

                {/* Emergency contact fields */}
                <Input
                  placeholder="Emergency contact name"
                  value={profileData.emergencyContactName}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContactName: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Emergency contact email"
                  value={profileData.emergencyContactEmail}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContactEmail: e.target.value })}
                />
                <Input
                  placeholder="Emergency contact phone"
                  value={profileData.emergencyContactPhone}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContactPhone: e.target.value })}
                />
                <Input
                  placeholder="Emergency contact relationship"
                  value={profileData.emergencyContactRelationship}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContactRelationship: e.target.value })}
                />
              </div>

              <DialogFooter className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowProfileModal(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
};

export default BookService;