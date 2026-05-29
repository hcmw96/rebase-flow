import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Mail, MapPin, Phone, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/seo";
import { experiencesPathWithSlug } from "@/lib/experienceSlugs";

const MAPS_URL =
  "https://maps.google.com/?q=1a+St+Vincent+St,+London+W1U+4DA";

const services = [
  "Communal Contrast",
  "Signature Classes",
  "Private Suites",
  "Hyperbaric Oxygen",
  "Cryotherapy",
  "Massage Therapy",
  "IV Drips",
  "Regen and Manual Therapies",
] as const;

const quickLinks = [
  { href: "/", label: "Home", match: "/" },
  { href: "/experiences", label: "Services", match: "/experiences" },
  { href: "/experiences", label: "Book Now", match: "/experiences" },
  { href: "/membership", label: "Membership", match: "/membership" },
  { href: "/contact#faqs", label: "FAQ", match: "/contact", hash: "#faqs" },
  { href: "/contact", label: "Contact", match: "/contact" },
] as const;

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/cookie-policy", label: "Cookie Policy" },
] as const;

const linkClass =
  "text-foreground/70 hover:text-primary transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm";

const activeLinkClass = "text-primary font-medium";

function FooterNavLink({
  href,
  match,
  hash,
  children,
}: {
  href: string;
  match: string;
  hash?: string;
  children: ReactNode;
}) {
  const location = useLocation();
  const isActive = (() => {
    if (location.pathname !== match) return false;
    if (hash) return location.hash === hash;
    if (match === "/contact") return location.hash !== "#faqs";
    return true;
  })();

  if (href.includes("#")) {
    return (
      <Link
        to={href}
        className={cn(linkClass, isActive && activeLinkClass)}
        aria-current={isActive ? "page" : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <NavLink
      to={href}
      end={match === "/"}
      className={({ isActive: navActive }) =>
        cn(linkClass, (navActive || isActive) && activeLinkClass)
      }
    >
      {children}
    </NavLink>
  );
}

const Footer = () => {
  const addressLine = `${BUSINESS.streetAddress}, ${BUSINESS.addressLocality} ${BUSINESS.postalCode}`;

  return (
    <footer className="bg-background text-foreground border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
              aria-label="Rebase Recovery home"
            >
              <img
                src="/lovable-uploads/6a377d49-6c42-49f6-a599-537d4243c812.png"
                alt="Rebase Recovery — premium wellness studio London"
                className="h-12 w-auto"
                loading="lazy"
                width={120}
                height={48}
              />
            </Link>
            <p className="text-foreground/70 text-sm leading-relaxed">
              London&apos;s premier wellness centre offering luxury recovery and rejuvenation
              experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <FooterNavLink href={link.href} match={link.match} hash={"hash" in link ? link.hash : undefined}>
                    {link.label}
                  </FooterNavLink>
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
                    to={experiencesPathWithSlug(service)}
                    className={linkClass}
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
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(linkClass, "flex items-start gap-3 group")}
              >
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" aria-hidden />
                <span className="group-hover:underline">{addressLine}</span>
              </a>
              <a href={`tel:${BUSINESS.phone}`} className={cn(linkClass, "flex items-center gap-3")}>
                <Phone className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
                <span>{BUSINESS.phoneDisplay}</span>
              </a>
              <a
                href={`mailto:${BUSINESS.email}`}
                className={cn(linkClass, "flex items-center gap-3 break-all")}
              >
                <Mail className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
                <span>{BUSINESS.email}</span>
              </a>
              <a
                href={BUSINESS.sameAs[0]}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(linkClass, "flex items-center gap-3")}
              >
                <Instagram className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
                <span>@rebaserecovery</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-foreground/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-foreground/60 text-sm">
            © {new Date().getFullYear()} Rebase Recovery. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {legalLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-foreground/60 hover:text-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
