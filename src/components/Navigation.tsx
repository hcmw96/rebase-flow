import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import wordmark from "@/assets/rebase-wordmark.png";

const locations = [
  { name: "Marylebone High St.", active: true },
  { name: "Chelsea", active: false },
  { name: "The Strand", active: false },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [scrolled, setScrolled] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleBookNow = () => {
    setIsOpen(false);
    if (location.pathname === '/website') {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/website#services');
    }
  };

  const navItems = [
    { href: "/website#services", label: "Experiences" },
    { href: "/membership", label: "Membership" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) => location.pathname === href;

  // Close location dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll listener
  useEffect(() => {
    const container = document.querySelector<HTMLElement>('[style*="position: fixed"][style*="overflow"]') ||
      document.querySelector<HTMLElement>('[style*="overflowY: auto"]');
    const onScroll = () => {
      const scrollTop = window.scrollY || (container?.scrollTop ?? 0);
      setScrolled(scrollTop > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    container?.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      container?.removeEventListener("scroll", onScroll);
    };
  }, []);

  const textColor = "text-[#F9ECD9]";
  const textMuted = "text-[#F9ECD9]/60";
  const borderColor = "border-[#F9ECD9]/20";

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isOpen
          ? "bg-[#3B2712] border-[#F9ECD9]/10"
          : scrolled
            ? "bg-black/40 backdrop-blur-xl border-[#F9ECD9]/10"
            : "bg-transparent border-white/10"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className={cn("flex justify-between items-center transition-all duration-300", scrolled ? "h-14" : "h-20")}>
          {/* Logo */}
          <Link to="/website" className="flex-shrink-0">
            <img
              src={wordmark}
              alt="Rebase"
              className={cn(
                "w-auto transition-all duration-300",
                "h-12 brightness-0 invert"
              )}
            />
          </Link>

          {/* Right side: nav links + location + buttons — desktop */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-8">
            {navItems.map((item) => {
              if (item.href.includes("#")) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      const hash = item.href.split("#")[1];
                      const el = document.getElementById(hash);
                      if (el) {
                        e.preventDefault();
                        el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className={cn(
                      "text-[13px] font-medium tracking-[0.08em] transition-colors duration-300",
                      `${textMuted} hover:${textColor}`
                    )}
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "text-[13px] font-medium tracking-[0.08em] transition-colors duration-300",
                    isActive(item.href) ? textColor : `${textMuted} hover:${textColor}`
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Location dropdown */}
            <div ref={locationRef} className="relative">
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className={cn(
                  "flex items-center gap-1.5 text-[13px] font-medium tracking-[0.08em] transition-colors",
                  textMuted
                )}
              >
                {selectedLocation.name}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", locationOpen && "rotate-180")} />
              </button>
              {locationOpen && (
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 min-w-[220px] bg-background/95 backdrop-blur-xl border border-border rounded-lg py-2 shadow-luxury">
                  {locations.map((loc) => (
                    <button
                      key={loc.name}
                      disabled={!loc.active}
                      onClick={() => {
                        if (loc.active) {
                          setSelectedLocation(loc);
                          setLocationOpen(false);
                        }
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        loc.active
                          ? "text-foreground hover:bg-accent cursor-pointer"
                          : "text-muted-foreground cursor-default"
                      )}
                    >
                      <span>{loc.name}</span>
                      {!loc.active && (
                        <span className="ml-2 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            {/* Buttons */}
            <Button
              variant="outline"
              onClick={handleBookNow}
              className={cn(
                "text-[13px] tracking-[0.08em] px-6 h-10 backdrop-blur-md rounded-none transition-all duration-300",
                "border-[#F9ECD9]/20 bg-[#F9ECD9]/10 text-[#F9ECD9] hover:bg-[#F9ECD9]/20"
              )}
            >
              Book Now
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <Link to="/account">
              <Button
                className={cn(
                  "text-[13px] tracking-[0.08em] px-6 h-10 backdrop-blur-md border rounded-none transition-all duration-300",
                  scrolled
                    ? "bg-black/40 border-[#F9ECD9]/10 text-[#F9ECD9] hover:bg-black/60"
                    : "bg-black/40 border-[#F9ECD9]/10 text-[#F9ECD9] hover:bg-black/60"
                )}
              >
                Members
              </Button>
            </Link>
          </div>

          {/* Mobile: Book Now + Hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookNow}
              className="text-[11px] tracking-[0.08em] px-3 h-8 rounded-none border-[#F9ECD9]/20 bg-[#F9ECD9]/10 text-[#F9ECD9] hover:bg-[#F9ECD9]/20"
            >
              Book Now
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className={textColor}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-[#F9ECD9]/10 bg-[#3B2712] min-h-[calc(100vh-3.5rem)]">
            <div className="py-4 space-y-1">
              {navItems.map((item) => {
                if (item.href.includes("#")) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        const hash = item.href.split("#")[1];
                        const el = document.getElementById(hash);
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                        setIsOpen(false);
                      }}
                      className={cn(
                        "block px-3 py-2.5 text-sm font-medium tracking-wider transition-colors",
                        `${textMuted} hover:${textColor}`
                      )}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "block px-3 py-2.5 text-sm font-medium tracking-wider transition-colors",
                      isActive(item.href) ? textColor : `${textMuted} hover:${textColor}`
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile location */}
              <div className="px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Location</p>
                {locations.map((loc) => (
                  <button
                    key={loc.name}
                    disabled={!loc.active}
                    onClick={() => {
                      if (loc.active) setSelectedLocation(loc);
                    }}
                    className={cn(
                      "block w-full text-left py-1.5 text-sm",
                      loc.active && selectedLocation.name === loc.name
                        ? textColor
                        : loc.active
                        ? textMuted
                        : "text-muted-foreground/40"
                    )}
                  >
                    {loc.name}
                    {!loc.active && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground/40">
                        Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 px-3 pt-3">
                <Button variant="outline" onClick={handleBookNow} className={cn("flex-1 rounded-none tracking-wider text-sm", borderColor, textColor)}>
                  Book Now <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
                <Link to="/account" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button className={cn("w-full rounded-none tracking-wider text-sm", scrolled ? "bg-[#3B2712] text-[#F9ECD9]" : "bg-[#F9ECD9] text-[#3B2712]")}>
                    Members
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
