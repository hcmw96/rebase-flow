import { Link } from "react-router-dom";
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
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-black/35 to-black/10"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-0 h-1/3 pointer-events-none bg-gradient-to-b from-black/45 to-transparent"
        aria-hidden
      />

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
            asChild
            className="bg-[#F9ECD9]/10 backdrop-blur-md border border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/20 text-sm uppercase tracking-[0.1em] px-8 h-12 rounded-none"
          >
            <Link to="/experiences" aria-label="Book a wellness treatment — view our treatments">
              Book Now
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Bottom-left subtitle */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 sm:px-10 pb-12 pt-16 bg-gradient-to-t from-black/80 via-black/50 to-transparent max-w-2xl">
        <p className="text-[#F9ECD9]/90 text-sm sm:text-base font-light leading-relaxed">
          Experience a novel approach to lasting wellbeing at Rebase, London&apos;s Home of Social Wellness.
        </p>
      </div>
    </section>
  );
};

export default Hero;
