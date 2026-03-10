import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
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
  const locationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const navItems = [
    { href: "/services", label: "Experiences" },
    { href: "/about", label: "About" },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={wordmark}
              alt="Rebase"
              className="h-5 w-auto brightness-0 invert opacity-90"
            />
          </Link>

          {/* Center nav links + location — desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Location dropdown — inline */}
            <div ref={locationRef} className="relative">
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.08em] uppercase text-foreground/60 hover:text-foreground transition-colors"
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

          {/* Right side buttons — desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/book">
              <Button
                variant="outline"
                className="text-[13px] tracking-[0.08em] uppercase px-6 h-10 border-foreground/20 text-foreground hover:bg-foreground/5 rounded-full"
              >
                Book Now
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button className="text-[13px] tracking-[0.08em] uppercase px-6 h-10 bg-foreground text-background hover:bg-foreground/90 rounded-full">
                Members
              </Button>
            </Link>
          </div>

          {/* Hamburger — mobile */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-border/40">
            <div className="py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "block px-3 py-2.5 text-sm font-medium uppercase tracking-wider transition-colors",
                    isActive(item.href) ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

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
                        ? "text-foreground"
                        : loc.active
                        ? "text-foreground/60"
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
                <Link to="/book" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full border-foreground/20 text-foreground uppercase tracking-wider text-sm">
                    Book Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link to="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button className="w-full rounded-full bg-foreground text-background uppercase tracking-wider text-sm">
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
