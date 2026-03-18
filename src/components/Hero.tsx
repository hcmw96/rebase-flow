import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/vids2/REBASE - HERO FILM - 03.01.mp4`;

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          ref={(el) => {
            if (el) {
              el.setAttribute("playsinline", "");
              el.play().catch(() => {});
            }
          }}
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = 5;
          }}
          onTimeUpdate={(e) => {
            const vid = e.currentTarget;
            if (vid.duration && vid.currentTime >= vid.duration - 7) {
              vid.currentTime = 5;
            }
          }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Center content */}
      <div className="relative z-10 text-center px-6">
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-light text-[#F9ECD9] tracking-tight leading-tight">
          Elevate your wellness
        </h1>
        <div className="mt-10">
          <Button
            className="bg-[#F9ECD9]/10 backdrop-blur-md border border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/20 text-sm uppercase tracking-[0.1em] px-8 h-12 rounded-none"
            onClick={() => {
              document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Book Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom-left subtitle */}
      <div className="absolute bottom-12 left-6 sm:left-10 z-10 max-w-md">
        <p className="text-[#F9ECD9]/70 text-sm sm:text-base font-light leading-relaxed">
          Experience a novel approach to lasting wellbeing at Rebase, London's Home of Social Wellness.
        </p>
      </div>
    </section>
  );
};

export default Hero;
