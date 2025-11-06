import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Snowflake, Flame, Timer, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IceSauna = () => {
  const navigate = useNavigate();

  const variants = [
    {
      id: 1,
      title: "Infrared Sauna/Ice bath",
      duration: "45 Minutes",
      price: 190,
      description: "Infrared Sauna/Ice bath (45 Minutes)",
      sessionId: "ice-sauna-45"
    },
    {
      id: 2,
      title: "Infrared Sauna/Ice bath",
      duration: "90 Minutes",
      price: 330,
      description: "Infrared Sauna/Ice bath (90 Minutes)",
      sessionId: "ice-sauna-90"
    }
  ];

  const handleVariantBookNow = (variant: typeof variants[0]) => {
    localStorage.setItem(
      "selectedService",
      JSON.stringify({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        duration: variant.duration,
        category: "Private Suites",
        sessionId: variant.sessionId,
      }),
    );
    navigate(`/book/${variant.id}`);
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
                  onClick={() => document.querySelector('#booking-section')?.scrollIntoView({ behavior: 'smooth' })} 
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
      <section id="booking-section" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-light text-white text-center mb-12 tracking-wide">
            BOOK YOUR SESSION
          </h2>
          
          <Card className="glass-card rounded-3xl border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-serif font-medium text-foreground group-hover:text-primary transition-colors text-center">
                Ice & Sauna
              </CardTitle>
              <div className="flex justify-center">
                <Badge variant="secondary" className="bg-detail/10 text-detail border-detail/20">
                  Private Suites
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3 mb-4">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{variant.description}</div>
                          <div className="text-white/60 text-xs mt-1">{variant.duration}</div>
                        </div>
                        <div className="text-white font-medium text-sm">£{variant.price}</div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full glass-button text-white rounded-lg text-xs font-medium"
                        onClick={() => handleVariantBookNow(variant)}
                      >
                        Book Now
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
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
