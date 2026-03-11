import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";

const Index = () => {
  return (
    <div className="min-h-screen overflow-y-auto" style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}>
      <Navigation />
      <Hero />
      <Footer />
    </div>
  );
};

export default Index;
