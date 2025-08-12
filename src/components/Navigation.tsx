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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 glass-morphism rounded-b-2xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/services" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/6a377d49-6c42-49f6-a599-537d4243c812.png" 
              alt="Rebase Recovery" 
              className="h-20 w-auto"
            />
          </Link>

          {/* Hamburger menu button - all screen sizes */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="glass-button text-white border-white/20"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation Menu - all screen sizes */}
        {isOpen && (
          <div>
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-white/20 glass-morphism backdrop-blur-xl">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "block px-3 py-2 text-base font-medium transition-colors duration-300",
                    isActive(item.href) ? "text-white" : "text-white/80 hover:text-white"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-3 pt-4 space-y-2">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full glass-button text-white border-white/20">
                    Login
                  </Button>
                </Link>
                <Link to="/book" onClick={() => setIsOpen(false)}>
                  <Button className="w-full glass-button text-white">
                    Book Now
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