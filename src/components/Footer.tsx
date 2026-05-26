import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";

const services = [
  "Communal Contrast",
  "Signature Classes",
  "Private Suites",
  "Hyperbaric Oxygen",
  "Cryotherapy",
  "Massage Therapy",
  "IV Drips",
  "Regen and Manual Therapies",
];

const quickLinks = [
  { href: "/website", label: "Home" },
  { href: "/experiences", label: "Services" },
  { href: "/experiences", label: "Book Now" },
  { href: "/membership", label: "Membership" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const Footer = () => {
  return (
    <footer className="bg-background text-foreground border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/website" className="inline-block">
              <img
                src="/lovable-uploads/6a377d49-6c42-49f6-a599-537d4243c812.png"
                alt="Rebase Recovery"
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-foreground/70 text-sm leading-relaxed">
              London's premier wellness centre offering luxury recovery and rejuvenation experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    to={link.href}
                    className="text-foreground/70 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/experiences"
                    className="text-foreground/70 hover:text-primary transition-colors text-sm"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-foreground/70 text-sm">
                  London, United Kingdom
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a
                  href="mailto:reception@rebaserecovery.com"
                  className="text-foreground/70 hover:text-primary transition-colors text-sm"
                >
                  reception@rebaserecovery.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-foreground/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-foreground/60 text-sm">
            © {new Date().getFullYear()} Rebase Recovery. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link to="/privacy-policy" className="text-foreground/60 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-foreground/60 hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/cookie-policy" className="text-foreground/60 hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
