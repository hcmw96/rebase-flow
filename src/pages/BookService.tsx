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
import { format, parseISO, set, startOfMonth, endOfMonth, startOfDay } from "date-fns";
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
  const [serviceSessionIdFromStorage, setServiceSessionIdFromStorage] = useState<string | null>(null);
  const [serviceTitleFromStorage, setServiceTitleFromStorage] = useState<string | null>(null);
  const [servicePriceFromStorage, setServicePriceFromStorage] = useState<number | null>(null);
  const [serviceCategoryFromStorage, setServiceCategoryFromStorage] = useState<string | null>(null);
  const [showCalendarView, setShowCalendarView] = useState(true);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [showPreviewCard, setShowPreviewCard] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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
    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");
    const refreshToken = params.get("refresh_token");

    // 🔸 Handle OAuth callback: save tokens and check profile
    if (accessToken || refreshToken) {
      if (accessToken) localStorage.setItem("access_token", accessToken);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
      if (idToken) {
        localStorage.setItem("id_token", idToken);
        const decoded = parseJwt(idToken);
        localStorage.setItem("clientId", decoded?.sub);
      }

      // Remove tokens from URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      console.log("✅ Tokens stored, checking profile...");

      // Check if user has a business profile
      checkUserProfile(accessToken);
      return;
    }
  }, []);

  const checkUserProfile = async (token: string) => {
    try {
      const meRes = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/mindbodyMe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ token }),
      });

      if (!meRes.ok) {
        toast.error("Error checking profile");
        return;
      }

      const { user } = await meRes.json();
      setUserInfo(user);
      setUserIdFromProfile(user.id);

      if (!user.businessProfiles || user.businessProfiles.length === 0) {
        setShowProfileModal(true);
        toast.error("Please complete your profile to continue");
      } else {
        setShowPreviewCard(true);
        setShowSummaryCard(false);
        toast.success("Profile verified!");
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      toast.error("Failed to verify profile");
    }
  };

  const handleMindbodyAuth = () => {
    const currentPath = window.location.pathname;
    const redirectUri = "https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/teste";
    const state = JSON.stringify({ from: currentPath });

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

    console.log("🟢 Starting OAuth flow");
    window.location.href = authUrl;
  };

  useEffect(() => {
    const storedService = localStorage.getItem("selectedService");
    if (storedService) {
      const serviceStoraged = JSON.parse(storedService);
      setServiceIdFromStorage(serviceStoraged.id);
      setServiceSessionIdFromStorage(serviceStoraged.sessionId);
      setServiceTitleFromStorage(serviceStoraged.title);
      setServicePriceFromStorage(serviceStoraged.price);
      setServiceCategoryFromStorage(serviceStoraged.category);
    }

    console.log("🔹 serviceSessionIdFromStorage:", serviceSessionIdFromStorage);

    // Restore booking state if user is returning from auth
    const storedTime = localStorage.getItem("selectedTime");
    const storedDate = localStorage.getItem("selectedDate");
    const storedStaffId = localStorage.getItem("staffId");
    const storedLocationId = localStorage.getItem("locationId");

    if (storedTime) setSelectedTime(storedTime);
    if (storedDate) setSelectedDate(new Date(storedDate));
    if (storedStaffId) setStaffId(storedStaffId);
    if (storedLocationId) setLocationId(storedLocationId);
  }, [serviceSessionIdFromStorage]);

  useEffect(() => {
    console.log("🔹 serviceSessionIdFromStorage mudou:", serviceSessionIdFromStorage);
    if (!serviceSessionIdFromStorage) return;

    const fetchAvailabilitiesForMonth = async () => {
      try {
        const today = startOfDay(new Date());
        const monthStart = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()
          ? today
          : startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        console.log(`🗓️ Fetching availabilities from ${format(monthStart, "yyyy-MM-dd")} to ${format(monthEnd, "yyyy-MM-dd")}`);

        const resAvail = await fetch("https://wdgyuxkqqmtxcltsfkel.supabase.co/functions/v1/getBookableItems", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            sessionTypeIds: [parseInt(serviceSessionIdFromStorage)],
            startDate: format(monthStart, "yyyy-MM-dd"),
            endDate: format(monthEnd, "yyyy-MM-dd")
          }),
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

    fetchAvailabilitiesForMonth();
  }, [serviceSessionIdFromStorage, currentMonth]);


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

    // Find the corresponding availability
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
      toast.error("Availability not found");
      return;
    }

    const staffId = availability.Staff?.Id;
    if (!availability.Location?.Id) {
      toast.error("Class location not found");
      return;
    }
    const locationId = availability.Location?.Id;

    setStaffId(staffId);
    setLocationId(locationId);

    // Save to localStorage to persist across auth redirect
    localStorage.setItem("selectedTime", time);
    localStorage.setItem("selectedDate", selectedDate.toISOString());
    localStorage.setItem("staffId", staffId);
    localStorage.setItem("locationId", locationId);

    // Show summary card instead of immediately proceeding
    setShowSummaryCard(true);
    setShowCalendarView(false);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
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
            Authorization: mindbodyToken,

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
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "X-Mindbody-Token": mindbodyToken.trim(),
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

  const handleProceedToPayment = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please authenticate first");
      handleMindbodyAuth();
      return;
    }

    const availability = availabilities.find((a) => {
      const start = parseISO(a.StartDateTime);
      return (
        format(start, "HH:mm") === selectedTime &&
        selectedDate &&
        start.getFullYear() === selectedDate.getFullYear() &&
        start.getMonth() === selectedDate.getMonth() &&
        start.getDate() === selectedDate.getDate()
      );
    });

    if (!availability) {
      toast.error("Please select a time slot");
      return;
    }

    const bookAbleDate = availability.BookableEndDateTime;
    const clientId = localStorage.getItem("clientId");
    const sessionTypeId = service.Id;

    proceedMindbodyWorkflow(token, bookAbleDate, selectedTime, staffId, locationId, sessionTypeId, clientId);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
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

                  {!showSummaryCard && !showPreviewCard && (
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
                                  onMonthChange={(month) => {
                                    setCurrentMonth(month);
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
                                    staff                                   </h2>
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
                                          variant="ghost"
                                          onClick={() => handleTimeSelect(t)}
                                          className={`text-white backdrop-blur-sm border border-white/30 hover:bg-white/20 transition-all ${selectedTime === t ? "bg-white/30" : "bg-white/10"
                                            }`}
                                        >
                                          {t}
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
                  )}

                  {showSummaryCard && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-6 shadow-xl"
                    >
                      <h2 className="text-2xl font-semibold text-white mb-6">Booking Summary</h2>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-start">
                          <span className="text-white/70">Service</span>
                          <span className="text-white font-medium text-right">{serviceTitleFromStorage}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Category</span>
                          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                            {serviceCategoryFromStorage}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Duration</span>
                          <span className="text-white">{duration} minutes</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Date & Time</span>
                          <div className="text-right">
                            <div className="text-white">{selectedDate && format(selectedDate, "MMM d, yyyy")}</div>
                            <div className="text-white/80 text-sm">{selectedTime}</div>
                          </div>
                        </div>

                        <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                          <span className="text-white font-semibold text-lg">Total Price</span>
                          <span className="text-white font-bold text-2xl">£{servicePriceFromStorage}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowSummaryCard(false);
                          }}
                          className="flex-1 text-white border border-white/30 hover:bg-white/10"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleProceedToPayment}
                          className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30"
                        >
                          Next
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {showPreviewCard && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-6 shadow-xl"
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <Check className="w-6 h-6 text-green-400" />
                        <h2 className="text-2xl font-semibold text-white">Ready to Book</h2>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-start">
                          <span className="text-white/70">Service</span>
                          <span className="text-white font-medium text-right">{serviceTitleFromStorage}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Date & Time</span>
                          <div className="text-right">
                            <div className="text-white">{selectedDate && format(selectedDate, "MMM d, yyyy")}</div>
                            <div className="text-white/80 text-sm">{selectedTime}</div>
                          </div>
                        </div>

                        <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                          <span className="text-white font-semibold text-lg">Total Price</span>
                          <span className="text-white font-bold text-2xl">£{servicePriceFromStorage}</span>
                        </div>
                      </div>

                      <Button
                        onClick={handleProceedToPayment}
                        className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                      >
                        Proceed to Payment
                      </Button>
                    </motion.div>
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
