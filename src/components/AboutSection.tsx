import { Link } from "react-router-dom";
import MissionVision from "./MissionVision";
import ServicesAccordion from "./ServicesAccordion";

const services = [
  {
    id: "ice-sauna",
    title: "CONTRAST STUDIO",
    subtitle: "Ice Bath & Infrared Sauna",
    description: "Reduced inflammation. Increased focus. Alternate between extreme cold and deep heat to unlock your body's natural recovery.",
    image: "/images/rebase-ice-sauna-new.webp",
    link: "/ice-sauna",
  },
  {
    id: "classes",
    title: "SIGNATURE CLASSES",
    subtitle: "Movement & Breathwork",
    description: "A wide range of classes led by our experts. From reformer pilates to breathwork, find your practice.",
    image: "/images/rebase-class.webp",
    link: null,
  },
  {
    id: "recovery",
    title: "RECOVERY TREATMENTS",
    subtitle: "Specialist Therapies",
    description: "A wide range of recovery specialists. From sports massage to osteopathy, tailored to your needs.",
    image: "/images/rebase-suite.webp",
    link: null,
  },
  {
    id: "private-suites",
    title: "PRIVATE SUITES",
    subtitle: "Exclusive Wellness Rooms",
    description: "Your own private sanctuary. Fully equipped recovery suites for an uninterrupted, personalised experience.",
    image: "/images/rebase-private-suites.webp",
    link: null,
  },
  {
    id: "hbot",
    title: "HYPERBARIC OXYGEN",
    subtitle: "Pressurised O₂ Therapy",
    description: "Accelerate healing and enhance cognitive performance with medical-grade hyperbaric oxygen therapy.",
    image: "/images/rebase-hbot-treatment.webp",
    link: "/experiences",
  },
  {
    id: "cryo",
    title: "CRYOTHERAPY",
    subtitle: "Whole-Body Cold Therapy",
    description: "Three minutes at −110°C. Reduce pain, boost endorphins, and accelerate muscle recovery.",
    image: "/images/rebase-cryo.webp",
    link: null,
  },
];

const ServiceCard = ({ service }: { service: (typeof services)[0] }) => {
  const inner = (
    <div className="group relative h-[520px] overflow-hidden rounded-lg cursor-pointer">
      <img
        src={service.image}
        alt={service.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* Default gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {/* Title & subtitle — always visible */}
        <h3 className="text-[#F9ECD9] text-xl font-light tracking-[0.08em] mb-1">
          {service.title}
        </h3>
        <p className="text-white/60 text-sm tracking-wider mb-0 group-hover:mb-4 transition-all duration-500">
          {service.subtitle}
        </p>

        {/* Hover-reveal content */}
        <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-500 ease-out">
          <p className="text-white/80 text-sm leading-relaxed mb-5">
            {service.description}
          </p>
          <button className="w-full py-3 backdrop-blur-md bg-white/10 border border-white/20 text-white text-sm tracking-[0.15em] hover:bg-white/20 transition-colors">
            RESERVE
          </button>
        </div>
      </div>
    </div>
  );

  if (service.link) {
    return <Link to={service.link} className="block">{inner}</Link>;
  }
  return inner;
};

const AboutSection = () => {
  return (
    <>
      <section
        className="relative py-24 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: "url('/images/section-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Tagline */}
          <p className="text-center text-white/90 text-lg sm:text-xl md:text-2xl font-light italic leading-relaxed max-w-3xl mx-auto mb-16">
            Boost your baseline and achieve elemental balance through our curated
            recovery, movement and wellness experiences.
          </p>

          {/* Service Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>
      <ServicesAccordion />
      <div className="h-6" />
      <MissionVision />
    </>
  );
};

export default AboutSection;
