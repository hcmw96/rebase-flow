import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - integrate with backend service
    console.log("Form submitted");
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      content: "Central London\nUnited Kingdom",
      href: "https://maps.google.com"
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+44 (0) 20 XXXX XXXX",
      href: "tel:+44..."
    },
    {
      icon: Mail,
      title: "Email",
      content: "reception@rebaserecovery.com",
      href: "mailto:reception@rebaserecovery.com"
    },
    {
      icon: Clock,
      title: "Hours",
      content: "Mon-Fri: 6AM - 10PM\nSat-Sun: 7AM - 9PM",
      href: null
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-6xl font-serif font-light text-foreground mb-6">
              Get In <span className="text-primary text-glow">Touch</span>
            </h1>
            <p className="text-xl text-foreground/70 leading-relaxed">
              Have questions about our services or ready to book your wellness experience? 
              We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="card-luxury text-center group">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-medium text-foreground">
                      {info.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {info.href ? (
                      <a 
                        href={info.href}
                        className="text-foreground/70 hover:text-primary transition-colors whitespace-pre-line"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-foreground/70 whitespace-pre-line">
                        {info.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & FAQ */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-serif font-light text-foreground mb-8">
                  Send Us a <span className="text-primary">Message</span>
                </h2>
                
                <Card className="card-luxury">
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                          <Input 
                            id="firstName"
                            placeholder="Your first name"
                            className="bg-input border-border/50 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                          <Input 
                            id="lastName"
                            placeholder="Your last name"
                            className="bg-input border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">Email</Label>
                        <Input 
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          className="bg-input border-border/50 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">Phone (Optional)</Label>
                        <Input 
                          id="phone"
                          type="tel"
                          placeholder="+44 (0) 20 XXXX XXXX"
                          className="bg-input border-border/50 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-foreground">Subject</Label>
                        <Input 
                          id="subject"
                          placeholder="How can we help you?"
                          className="bg-input border-border/50 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-foreground">Message</Label>
                        <Textarea 
                          id="message"
                          placeholder="Tell us more about your inquiry..."
                          rows={5}
                          className="bg-input border-border/50 focus:border-primary resize-none"
                        />
                      </div>
                      
                      <Button type="submit" className="w-full btn-luxury">
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* FAQ */}
              <div>
                <h2 className="text-3xl font-serif font-light text-foreground mb-8">
                  Frequently Asked <span className="text-primary">Questions</span>
                </h2>
                
                <div className="space-y-6">
                  {[
                    {
                      question: "Do I need to book in advance?",
                      answer: "Yes, we recommend booking in advance to secure your preferred time slot. You can book online through our website or call us directly."
                    },
                    {
                      question: "What should I bring for my first visit?",
                      answer: "We provide towels, robes, and all necessary equipment. Just bring comfortable clothes and an open mind for your wellness journey."
                    },
                    {
                      question: "Are there any health restrictions?",
                      answer: "Some treatments may have restrictions. We'll discuss your health history during booking to ensure the safest and most effective experience."
                    },
                    {
                      question: "Can I cancel or reschedule my appointment?",
                      answer: "Yes, you can cancel or reschedule up to 24 hours before your appointment through your account or by contacting us directly."
                    },
                    {
                      question: "Do you offer membership packages?",
                      answer: "Yes, we offer Base, Resident, and Ultimate membership tiers with different benefits and pricing. Contact us to find the best option for you."
                    }
                  ].map((faq, index) => (
                    <Card key={index} className="card-luxury">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium text-foreground mb-3">
                          {faq.question}
                        </h3>
                        <p className="text-foreground/70 leading-relaxed">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;