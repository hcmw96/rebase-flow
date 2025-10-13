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
import { motion, AnimatePresence } from "framer-motion";

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

export interface ClientCreditCard {
  Address: string | null;
  CardHolder: string | null;
  CardNumber: string;
  CardType: string;
  City: string | null;
  ExpMonth: string;
  ExpYear: string;
  LastFour: string;
  PostalCode: string | null;
  State: string | null;
  isStoredCard?: boolean;
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
  const [clientCardInfo, setClientCardInfo] = useState<ClientCreditCard[] | null>(null);
  const [serviceIdFromStorage, setServiceIdFromStorage] = useState<number | null>(null);
  const [serviceTitleFromStorage, setServiceTitleFromStorage] = useState<string | null>(null);
  const [servicePriceFromStorage, setServicePriceFromStorage] = useState<number | null>(null);
  const [serviceCategoryFromStorage, setServiceCategoryFromStorage] = useState<string | null>(null);
  const [showCalendarView, setShowCalendarView] = useState(true);

  function parseJwt(token: string) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      console.error("Erro ao decodificar id_token:", e);
      return null;
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");
    const refreshToken = params.get("refresh_token");

    // Se já temos tokens no localStorage, não faz nada
    const storedAccessToken = localStorage.getItem("access_token");
    if (storedAccessToken && !code && !accessToken) {
      console.log("🔹 Usuário já autenticado, pulando fluxo OAuth");
      return;
    }

    // 🔸 Caso 1: chegou do redirect do Mindbody com tokens → salvar e limpar URL
    if (accessToken || refreshToken) {
      if (accessToken) localStorage.setItem("access_token", accessToken);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
      if (idToken) {
        localStorage.setItem("id_token", idToken);
        const decoded = parseJwt(idToken);
        localStorage.setItem("clientId", decoded?.sub);
      }

      // 🔹 Remove tokens da URL (mantém o usuário em /book/:id)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      console.log("✅ Tokens armazenados, URL limpa");
      return;
    }

    // 🔸 Caso 2: primeira vez → iniciar login OAuth
    if (!code && !accessToken && !storedAccessToken) {
      const currentPath = window.location.pathname; // ex: "/book/1176"
      const redirectUri = "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/teste";
      const state = currentPath;

      const authUrl =
        "https://signin.mindbodyonline.com/connect/authorize" +
        "?client_id=f660fd3e-a0d6-4f66-878c-871c9860e565" +
        "&response_type=code id_token" +
        "&response_mode=form_post" +
        "&scope=email openid profile Platform.Contacts.Api.Write Platform.Contacts.Api.Read Platform.Accounts.Api.Read Mindbody.Api.Public.v6 offline_access" +
        "&nonce=10" +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}` +
        "&subscriberId=5736189";

      console.log("🟢 Iniciando fluxo OAuth");
      window.location.href = authUrl;
    }
  }, []);

  useEffect(() => {
    const storedService = localStorage.getItem("selectedService");
    if (storedService) {
      const serviceStoraged = JSON.parse(storedService);
      setServiceIdFromStorage(serviceStoraged.id);
      setServiceTitleFromStorage(serviceStoraged.title);
      setServicePriceFromStorage(serviceStoraged.price);
      setServiceCategoryFromStorage(serviceStoraged.category);
    }
  }, []);

  useEffect(() => {
    console.log("🔹 serviceTitleFromStorage mudou:", serviceTitleFromStorage);
    if (!serviceTitleFromStorage) return;
    const fetchData = async () => {
      try {
        console.log("🔹 Iniciando fetchData em BookService", serviceTitleFromStorage);

        setLoading(true);

        let serviceData = service;

        // Se ainda não temos serviceData, busca via title
        if (!serviceData) {
          if (!serviceTitleFromStorage) throw new Error("Title não definido para buscar serviço");

          const res = await fetch(
            `https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getAllSessionTypes?name=${encodeURIComponent(serviceTitleFromStorage)}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (!res.ok) throw new Error("Erro ao buscar serviço");
          const data = await res.json();
          if (!data) throw new Error("Serviço não encontrado");

          serviceData = data;
          setService(serviceData);
          console.log("✅ Serviço carregado via fetch:", serviceData);
        }

        // 🔹 Agora que serviceData existe, busca disponibilidades
        if (!serviceData.Id) throw new Error("serviceData.Id não definido");

        const resAvail = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getBookableItems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionTypeIds: [parseInt(serviceData.Id)] }),
        });

        if (!resAvail.ok) throw new Error("Erro ao buscar disponibilidades");

        const availData = await resAvail.json();
        setAvailabilities(availData.Availabilities || []);
        console.log("✅ Disponibilidades carregadas:", availData.Availabilities);
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceTitleFromStorage]);

  // Datas disponíveis para o calendário
  const availableDates = availabilities.map((a) => parseISO(a.StartDateTime)).filter((d) => !isNaN(d.getTime()));

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
      <CardContent className={`${isMobile ? "p-4" : "p-6"}`}>
        <div className="flex justify-between items-start mb-3">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {serviceCategoryFromStorage}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">£ {servicePriceFromStorage}</div>
            <div className="text-sm text-white/70"></div>
          </div>
        </div>
        <h1 className="font-serif text-2xl font-medium text-white mb-3">{serviceTitleFromStorage}</h1>
        <p className="text-white/70 leading-relaxed mb-4">{service?.description}</p>
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

    const sessionTypeId = service.Id;

    setStaffId(staffId);
    setLocationId(locationId);

    // Continuar workflow do Mindbody
    proceedMindbodyWorkflow(token, bookAbleDate, time, staffId, locationId, sessionTypeId, clientId);
    console.log(" 🔹 Agendando com:", bookAbleDate, time, staffId, locationId, sessionTypeId, clientId);
  };

  const proceedMindbodyWorkflow = async (
    token: string,
    date: Date,
    time: string,
    staffId: string,
    locationId: string,
    sessionTypeId: string,
    clientId: string,
  ) => {
    try {
      // 🔹 1. Obtém dados do usuário atual no Mindbody
      const meRes = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyMe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (meRes.status === 403) {
        localStorage.removeItem("access_token");
        navigate("/services");
        return;
      }

      if (meRes.status === 401) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          localStorage.removeItem("access_token");
          navigate("/services");
          return;
        }

        const refreshRes = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/refreshMindbodyToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshRes.ok) {
          localStorage.removeItem("access_token");
          navigate("/services");
          return;
        }

        const newTokens = await refreshRes.json();
        localStorage.setItem("access_token", newTokens.access_token);
        localStorage.setItem("refresh_token", newTokens.refresh_token);
      }

      if (!meRes.ok) {
        const errorText = await meRes.text();
        throw new Error(`Erro ao validar usuário Mindbody: ${errorText}`);
      }

      const { user } = await meRes.json();

      setUserIdFromProfile(user.id);

      if (!user.businessProfiles || user.businessProfiles.length === 0) {
        setShowProfileModal(true);
        toast.error("Complete your profile before continuing");
        return;
      }

      const userId = user.businessProfiles[0]?.profileId;

      // 🔹 Continua o fluxo normal: pega token staff, faz checkout etc.
      const getMindbodyToken = async () => {
        const res = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyStaffToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "henry@xeniasocial.com",
            password: "Loveablefix!",
            siteId: "5736189",
          }),
        });
        if (!res.ok) throw new Error("Erro ao obter token via Supabase");
        const { AccessToken: rawToken } = await res.json();
        return rawToken.replace(/\s+/g, "");
      };

      const mindbodyToken = await getMindbodyToken();

      // 🔹 2. Verifica se o cliente já tem cartões salvos no Mindbody
      const cardsRes = await fetch(
        `https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getMindbodyClients?clientID=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: mindbodyToken, // token do cliente (vem do login OAuth)
            // se o front enviar, substitua dinamicamente
          },
        },
      );

      const savedCards: ClientCreditCard[] = [];

      if (cardsRes.ok) {
        const data = await cardsRes.json();
        const clients = data.Clients ?? [];

        clients.forEach((client: any) => {
          if (client.ClientCreditCard && client.ClientCreditCard.CardNumber) {
            savedCards.push(client.ClientCreditCard as ClientCreditCard);
          }
        });

        setClientCardInfo(savedCards);
        toast.info(`We found ${savedCards.length} saved card(s).`);
      } else {
        toast.error("Error fetching saved cards.");
      }

      // 🔹 3. Agora só abre o modal SE não tiver cartões salvos
      const cardData = await new Promise<{
        creditCardNumber: string;
        expMonth: string;
        expYear: string;
        cvv: string;
        billingName: string;
        billingPostalCode: string;
        saveInfo: boolean;
        isStoredCard: boolean;
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

        root.render(
          <CardFormDialog
            amount={price}
            existingCards={savedCards} // 👈 injeta aqui os cartões carregados
            onCancel={handleClose}
            onSubmit={handleSubmit}
          />,
        );
      });

      const checkoutBody = {
        CartId: null,
        ClientId: userId,
        PayerClientId: "",
        Test: true,
        Items: [
          {
            Item: { Type: "Service", Metadata: { Id: productId } },
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
        Payments: cardData.isStoredCard
          ? [
              {
                Type: "StoredCard",
                Metadata: {
                  amount: price,
                },
              },
            ]
          : [
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
                  SaveInfo: cardData.saveInfo,
                },
              },
            ],
        SendEmail: false,
      };

      const checkoutRes = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyCheckout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: mindbodyToken.trim(),
        },
        body: JSON.stringify(checkoutBody),
      });

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
          businessId: "5736189", // coloque o real
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
        backgroundImage: `url('/lovable-uploads/8911d1ac-19d7-427a-9138-19c768396ea7.png')`,
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
              {!isMobile && <div className="animate-scale-in"></div>}

              {/* Service info always visible on desktop, only on mobile in step 1 or 0 */}
              {!isMobile && (
                <div
                  className={` flex justify-center flex-col mx-auto mb-8 animate-fade-in ${isMobile ? "max-w-sm px-4" : "max-w-lg"}`}
                >
                  {renderServiceInfo()}

                  <div className="relative min-h-[500px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {showCalendarView ? (
                        <motion.div
                          key="calendar"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute w-full"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {availableDates.length > 0 ? (
                            <div className="flex justify-center mx-auto min-w-[510px]">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  handleDateSelect(date);
                                  if (date) setShowCalendarView(false);
                                }}
                                disabled={(date) =>
                                  !availableDates.some(
                                    (d) =>
                                      d.getFullYear() === date.getFullYear() &&
                                      d.getMonth() === date.getMonth() &&
                                      d.getDate() === date.getDate(),
                                  )
                                }
                                className="text-white rounded-lg p-4 border border-white/20 glass-card w-full max-w-md flex flex-col items-center backdrop-blur-xl bg-white/10 shadow-xl"
                              />
                            </div>
                          ) : (
                            <p className="text-white text-center">Loading Calendar...</p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="times"
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: -90, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute w-full"
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          <div className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-6 shadow-xl max-w-md mx-auto">
                            <div className="flex items-center justify-between mb-6">
                              <Button
                                variant="ghost"
                                onClick={() => setShowCalendarView(true)}
                                className="text-white hover:bg-white/20 -ml-2"
                              >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to calendar
                              </Button>
                            </div>

                            {timeSlots.length > 0 ? (
                              <div>
                                <h2 className="text-xl text-white mb-4 font-semibold">
                                  Available times for {selectedDate && format(selectedDate, "MMM dd, yyyy")}
                                </h2>
                                <div className="grid grid-cols-3 gap-2">
                                  {timeSlots.map((t) => {
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

                                    const staffName = availability?.Staff?.DisplayName || "Unavailable";

                                    return (
                                      <Button
                                        key={t}
                                        variant={selectedTime === t ? "default" : "outline"}
                                        onClick={() => handleTimeSelect(t)}
                                        className="text-white flex flex-col border-white/30 hover:bg-white/20 transition-all"
                                      >
                                        <span>{t}</span>
                                        <span className="text-xs text-white/70">{staffName}</span>
                                      </Button>
                                    );
                                  })}
                                </div>

                                {selectedDate && selectedTime && (
                                  <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
                                    <p className="text-white text-center">
                                      <Check className="inline h-5 w-5 mr-2 text-green-400" />
                                      Selected: {format(selectedDate, "dd/MM/yyyy")} at {selectedTime}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-white text-center">No available times for this date.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
                <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </Button>
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
