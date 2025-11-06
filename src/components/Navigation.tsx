import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/services" className="flex items-center">
            <img 
              src="/lovable-uploads/6a377d49-6c42-49f6-a599-537d4243c812.png" 
              alt="Rebase Recovery" 
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-sm font-medium tracking-wider uppercase transition-colors duration-300",
                  isActive(item.href) ? "text-white" : "text-white/70 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Book Button - desktop */}
          <div className="hidden md:block">
            <Link to="/book">
              <Button className="bg-white text-background hover:bg-white/90 uppercase tracking-wider text-sm px-8">
                Book
              </Button>
            </Link>
          </div>

          {/* Hamburger menu button - mobile only */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-white"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-white/20">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "block px-3 py-2 text-base font-medium uppercase tracking-wider transition-colors duration-300",
                    isActive(item.href) ? "text-white" : "text-white/80 hover:text-white"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-3 pt-4">
                <Link to="/book" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-white text-background hover:bg-white/90 uppercase tracking-wider">
                    Book
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