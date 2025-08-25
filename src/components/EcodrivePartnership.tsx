import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Zap, Car, Heart } from "lucide-react";

const EcodrivePartnership = () => {
  const benefits = [
    {
      icon: <Leaf className="h-8 w-8" />,
      title: "Sustainable Transport",
      description: "Eco-friendly rides to and from your wellness sessions"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Carbon Neutral",
      description: "Zero emissions journey as part of your wellness experience"
    },
    {
      icon: <Car className="h-8 w-8" />,
      title: "Premium Comfort",
      description: "Luxurious electric vehicles for the ultimate arrival"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Wellness Aligned",
      description: "Extends your wellness journey from door to door"
    }
  ];

  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-5xl sm:text-6xl font-light text-foreground mb-6">
                  Partner with{" "}
                  <span className="text-primary text-glow">Ecodrive</span>
                </h2>
                <p className="text-xl text-foreground/80 leading-relaxed mb-8">
                  We've partnered with Ecodrive to offer you sustainable, premium transport 
                  that aligns with your wellness values. Arrive refreshed, leave renewed.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={benefit.title} className="card-luxury border-white/10 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-6">
                      <div className="text-primary mb-4">
                        {benefit.icon}
                      </div>
                      <h3 className="text-foreground font-medium mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-foreground/70 text-sm">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="btn-luxury text-lg px-8 py-4">
                  Book Ecodrive
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="btn-ghost-luxury text-lg px-8 py-4"
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="glass-card p-8 rounded-3xl">
                <div className="aspect-square bg-gradient-luxury rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Car className="h-24 w-24 text-white mx-auto mb-6" />
                    <h3 className="font-serif text-2xl text-white mb-4">
                      Ecodrive Partnership
                    </h3>
                    <p className="text-white/80">
                      Sustainable luxury transport for your wellness journey
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary/20 rounded-full animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>

          {/* Partnership Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-light text-primary mb-2">100%</div>
              <div className="text-foreground/70 text-sm">Carbon Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light text-primary mb-2">24/7</div>
              <div className="text-foreground/70 text-sm">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light text-primary mb-2">5★</div>
              <div className="text-foreground/70 text-sm">Premium Service</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light text-primary mb-2">Zero</div>
              <div className="text-foreground/70 text-sm">Emissions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-30 pointer-events-none"></div>
    </section>
  );
};

export default EcodrivePartnership;