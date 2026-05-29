import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import BackgroundVideo from "@/components/BackgroundVideo";

const Hero = () => {
  return (
    <section
      className="relative h-screen flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <BackgroundVideo />

      {/* Center content */}
      <div className="relative z-10 text-center px-6">
        <h1
          id="hero-heading"
          className="font-serif text-4xl sm:text-5xl lg:text-7xl font-light text-[#F9ECD9] tracking-tight leading-tight"
        >
          Elevate your wellness
        </h1>
        <div className="mt-10">
          <Button
            className="bg-[#F9ECD9]/10 backdrop-blur-md border border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/20 text-sm uppercase tracking-[0.1em] px-8 h-12 rounded-none"
            aria-label="Book a wellness treatment — scroll to services"
            onClick={() => {
              document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Book Now
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom-left subtitle */}
      <div className="absolute bottom-12 left-6 sm:left-10 z-10 max-w-md">
        <p className="text-[#F9ECD9]/70 text-sm sm:text-base font-light leading-relaxed">
          Experience a novel approach to lasting wellbeing at Rebase, London&apos;s Home of Social Wellness.
        </p>
      </div>
    </section>
  );
};

export default Hero;
