import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FaqAnswer from "@/components/FaqAnswer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import SeoHead from "@/components/seo/SeoHead";
import {
  breadcrumbSchema,
  BUSINESS,
  faqPageSchema,
  localBusinessSchema,
  postalAddressSchema,
  seoTitle,
  truncateDescription,
} from "@/lib/seo";
import { FAQ_ITEMS, FEATURED_FAQ_COUNT, faqItemsForSchema } from "@/content/faqs";
import contactBg from "@/assets/contact-bg.jpg";

const CONTACT_DESCRIPTION =
  "Contact Rebase Recovery in Marylebone, London for bookings, membership and partnerships. Call, email or visit our St Vincent Street studio.";

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: "https://rebase.echo.london/contact",
  name: "Contact Rebase Recovery",
  description: CONTACT_DESCRIPTION,
  mainEntity: {
    ...localBusinessSchema(),
    "@type": ["HealthClub", "DaySpa"],
    address: postalAddressSchema(),
  },
};

const featuredFaqs = FAQ_ITEMS.slice(0, FEATURED_FAQ_COUNT);
const moreFaqs = FAQ_ITEMS.slice(FEATURED_FAQ_COUNT);

const Contact = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#faqs") return;
    const el = document.getElementById("faqs");
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.hash]);

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
      content: `${BUSINESS.streetAddress}\n${BUSINESS.addressLocality} ${BUSINESS.postalCode}, UK`,
      href: "https://maps.google.com/?q=1a+St+Vincent+St,+London+W1U+4DA"
    },
    {
      icon: Phone,
      title: "Phone",
      content: BUSINESS.phoneDisplay,
      href: `tel:${BUSINESS.phone}`
    },
    {
      icon: Mail,
      title: "Email",
      content: BUSINESS.email,
      href: `mailto:${BUSINESS.email}`
    },
    {
      icon: Instagram,
      title: "Instagram",
      content: "@rebaserecovery",
      href: "https://instagram.com/rebaserecovery"
    }
  ];

  return (
    <div style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="dark bg-[#1a1a1a]">
      <SeoHead
        title={seoTitle("Contact Us")}
        description={truncateDescription(CONTACT_DESCRIPTION)}
        path="/contact"
        jsonLd={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
          contactSchema,
          faqPageSchema(faqItemsForSchema()),
        ]}
      />
      <Navigation />
      
      <main id="main-content" className="pt-20">
        {/* Hero Section */}
        <section className="relative py-32 sm:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-labelledby="contact-heading">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${contactBg})` }}
            role="img"
            aria-label="Rebase Recovery wellness studio interior"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#1a1a1a]" aria-hidden="true" />
          <div className="relative max-w-4xl mx-auto text-center">
            <h1 id="contact-heading" className="text-4xl sm:text-6xl font-serif font-light text-foreground mb-6">
              Get In <span className="text-primary text-glow">Touch</span>
            </h1>
            <p className="text-xl text-foreground/80 leading-relaxed">
              Have questions about our services or ready to book your wellness experience? 
              We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Info */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20" aria-labelledby="contact-details-heading">
          <h2 id="contact-details-heading" className="sr-only">Contact details</h2>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info) => (
                <Card key={info.title} className="card-luxury text-center group">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <info.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg font-medium text-foreground">
                      {info.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {info.href ? (
                      <a 
                        href={info.href}
                        {...(info.href.startsWith('http')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
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
            <p className="text-center text-foreground/60 text-sm sm:text-base font-light mt-10 max-w-2xl mx-auto leading-relaxed">
              For private events or partnerships please email{" "}
              <a
                href="mailto:df@rebaserecovery.com"
                className="text-primary hover:underline"
              >
                df@rebaserecovery.com
              </a>
              .
            </p>
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
                    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Contact form">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                          <Input 
                            id="firstName"
                            name="firstName"
                            autoComplete="given-name"
                            placeholder="Your first name"
                            className="bg-input border-border/50 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                          <Input 
                            id="lastName"
                            name="lastName"
                            autoComplete="family-name"
                            placeholder="Your last name"
                            className="bg-input border-border/50 focus:border-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">Email</Label>
                        <Input 
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="your.email@example.com"
                          className="bg-input border-border/50 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">Phone (Optional)</Label>
                        <Input 
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+44 (0) 20 XXXX XXXX"
                          className="bg-input border-border/50 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-foreground">Subject</Label>
                        <Input 
                          id="subject"
                          name="subject"
                          placeholder="How can we help you?"
                          className="bg-input border-border/50 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-foreground">Message</Label>
                        <Textarea 
                          id="message"
                          name="message"
                          placeholder="Tell us more about your inquiry..."
                          rows={5}
                          className="bg-input border-border/50 focus:border-primary resize-none"
                        />
                      </div>
                      
                      <Button type="submit" className="w-full btn-luxury" aria-label="Send message by email">
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* FAQs */}
              <div id="faqs" className="scroll-mt-28">
                <h2 className="text-3xl font-serif font-light text-foreground mb-8">
                  Frequently Asked <span className="text-primary">Questions</span>
                </h2>

                <div className="space-y-4 mb-6">
                  {featuredFaqs.map((faq) => (
                    <Card key={faq.q} className="card-luxury">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium text-foreground mb-3">{faq.q}</h3>
                        <FaqAnswer faq={faq} />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {moreFaqs.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="more-faqs"
                      className="border border-foreground/10 rounded-lg px-5 bg-card/50"
                    >
                      <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline py-5">
                        More frequently asked questions ({moreFaqs.length})
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <Accordion type="single" collapsible className="w-full space-y-2">
                          {moreFaqs.map((faq, i) => (
                            <AccordionItem
                              key={faq.q}
                              value={`more-${i}`}
                              className="border border-foreground/10 rounded-lg px-4 bg-card/30"
                            >
                              <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-foreground hover:no-underline py-4">
                                {faq.q}
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <FaqAnswer faq={faq} className="text-foreground/75 text-sm leading-relaxed" />
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
