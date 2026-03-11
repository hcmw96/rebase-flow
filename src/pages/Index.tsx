import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import AboutContent from "@/components/AboutContent";

const Index = () => {
  return (
    <div className="min-h-screen overflow-y-auto" style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}>
      <Navigation />
      <Hero />
      <AboutSection />
      <AboutContent />
      <Footer />
    </div>
  );
};

export default Index;
