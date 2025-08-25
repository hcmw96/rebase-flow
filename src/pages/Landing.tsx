import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoHero from "@/components/VideoHero";
import ServicesWheel from "@/components/ServicesWheel";
import EcodrivePartnership from "@/components/EcodrivePartnership";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <VideoHero />
      <ServicesWheel />
      <EcodrivePartnership />
      <Footer />
    </div>
  );
};

export default Landing;