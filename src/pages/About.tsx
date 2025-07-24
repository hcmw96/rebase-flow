import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Wellness Director",
      specialization: "Integrative Medicine & Recovery"
    },
    {
      name: "Marcus Chen",
      role: "Recovery Specialist",
      specialization: "Cryotherapy & Contrast Therapy"
    },
    {
      name: "Elena Rodriguez",
      role: "Breathwork Instructor",
      specialization: "Mindfulness & Meditation"
    },
    {
      name: "James Thompson",
      role: "Movement Therapist",
      specialization: "Yoga & Assisted Stretching"
    }
  ];

  const values = [
    {
      title: "Excellence",
      description: "We maintain the highest standards in every aspect of our service delivery."
    },
    {
      title: "Innovation",
      description: "Continuously evolving with cutting-edge wellness technologies and methodologies."
    },
    {
      title: "Community",
      description: "Building a supportive environment where wellness becomes a shared journey."
    },
    {
      title: "Holistic Care",
      description: "Addressing mind, body, and spirit through comprehensive wellness approaches."
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-6xl font-serif font-light text-foreground mb-6">
              About <span className="text-primary text-glow">Rebase</span>
            </h1>
            <p className="text-xl text-foreground/70 leading-relaxed">
              London's premier wellness destination, dedicated to providing exceptional care and 
              customized treatments tailored to your unique wellness journey.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-serif font-light text-foreground">
                  Our <span className="text-primary">Story</span>
                </h2>
                <div className="space-y-4 text-foreground/70 leading-relaxed">
                  <p>
                    Rebase Recovery was born from a vision to create London's most comprehensive wellness destination. 
                    We recognized the need for a space where cutting-edge recovery technologies meet ancient wellness practices, 
                    all delivered with the highest standards of luxury and care.
                  </p>
                  <p>
                    Our founders, drawing from decades of experience in wellness, recovery, and hospitality, 
                    created Rebase as more than just a wellness center—it's a sanctuary where members can truly 
                    elevate their physical and mental wellbeing.
                  </p>
                  <p>
                    Today, we're proud to serve a community of wellness enthusiasts, athletes, professionals, 
                    and anyone seeking to optimize their health through our unique approach to social wellness.
                  </p>
                </div>
              </div>
              <div className="card-luxury p-8">
                <h3 className="text-2xl font-serif font-medium text-foreground mb-6">Our Mission</h3>
                <p className="text-foreground/70 leading-relaxed mb-6">
                  "To provide a novel approach to lasting wellbeing through exceptional care, 
                  innovative treatments, and a supportive community environment that empowers 
                  every individual to achieve their wellness goals."
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">2023</div>
                    <div className="text-sm text-foreground/60">Founded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">5000+</div>
                    <div className="text-sm text-foreground/60">Members</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-light text-foreground mb-4">
                Our <span className="text-primary">Values</span>
              </h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                The principles that guide everything we do at Rebase Recovery.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="card-luxury p-6 text-center group">
                  <h3 className="text-xl font-serif font-medium text-foreground mb-4 group-hover:text-primary transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-light text-foreground mb-4">
                Meet Our <span className="text-primary">Team</span>
              </h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Our dedicated team of skilled professionals is committed to providing exceptional care.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={index} className="card-luxury p-6 text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {member.name}
                  </h3>
                  <p className="text-primary text-sm font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-foreground/60 text-sm">
                    {member.specialization}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-serif font-light text-foreground mb-6">
              Ready to Begin Your <span className="text-primary">Wellness Journey?</span>
            </h2>
            <p className="text-xl text-foreground/70 mb-8">
              Join our community and experience the Rebase difference today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book">
                <Button size="lg" className="btn-luxury">
                  Book Your First Session
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="btn-ghost-luxury">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;