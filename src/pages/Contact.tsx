import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import { Helmet } from "react-helmet-async";
import contactBg from "@/assets/contact-bg.jpg";

const SITE_URL = "https://rebase-flow.lovable.app";

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "url": `${SITE_URL}/contact`,
  "name": "Contact Rebase Recovery",
  "description": "Get in touch with Rebase Recovery, London's premier wellness centre in Marylebone.",
  "mainEntity": {
    "@type": "LocalBusiness",
    "name": "Rebase Recovery",
    "email": "reception@rebaserecovery.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "London",
      "addressCountry": "GB"
    },
    "sameAs": ["https://instagram.com/rebaserecovery"]
  }
};

const Contact = () => {
  const Helmeted = (
    <Helmet>
      <title>Contact Us — Rebase Recovery London</title>
      <meta name="description" content="Contact Rebase Recovery in Marylebone for booking enquiries, membership questions and partnership opportunities. Email reception@rebaserecovery.com." />
      <link rel="canonical" href={`${SITE_URL}/contact`} />
      <meta property="og:title" content="Contact Us — Rebase Recovery London" />
      <meta property="og:description" content="Get in touch with Rebase Recovery, London's premier wellness centre in Marylebone." />
      <meta property="og:url" content={`${SITE_URL}/contact`} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Contact Us — Rebase Recovery London" />
      <meta name="twitter:description" content="Get in touch with Rebase Recovery, London's premier wellness centre in Marylebone." />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />
      <script type="application/ld+json">{JSON.stringify(contactSchema)}</script>
    </Helmet>
  );
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value;
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const subjectField = (form.elements.namedItem("subject") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;
    const subject = encodeURIComponent(subjectField || "Website enquiry");
    const body = encodeURIComponent(
      `${message}\n\n---\nFrom: ${firstName} ${lastName}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}`
    );
    window.location.href = `mailto:support@rebaserecovery.com?subject=${subject}&body=${body}`;
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      content: "1a St Vincent St\nLondon W1U 4DA, UK",
      href: "https://maps.google.com/?q=1a+St+Vincent+St,+London+W1U+4DA"
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+44 20 4553 5701",
      href: "tel:+442045535701"
    },
    {
      icon: Mail,
      title: "Email",
      content: "reception@rebaserecovery.com",
      href: "mailto:reception@rebaserecovery.com"
    },
    {
      icon: Instagram,
      title: "Instagram",
      content: "@rebaserecovery",
      href: "https://instagram.com/rebaserecovery"
    }
  ];

  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="bg-[#1a1a1a]">
      {Helmeted}
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative py-32 sm:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${contactBg})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#1a1a1a]" aria-hidden="true" />
          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-6xl font-serif font-light text-foreground mb-6">
              Get In <span className="text-primary text-glow">Touch</span>
            </h1>
            <p className="text-xl text-foreground/80 leading-relaxed">
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
                  <Link to="/faq">
                    <Button variant="outline" className="w-full btn-luxury">
                      More →
                    </Button>
                  </Link>
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