import { Link } from "react-router-dom";
import ServicesAccordion from "./ServicesAccordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const popularServices = [
  {
    id: "ice-sauna",
    title: "ICE & SAUNA",
    image: "/images/rebase-ice-sauna.webp",
    alt: "Ice & Sauna",
    link: "/ice-sauna",
    objectPosition: "center",
  },
  {
    id: "private-suites",
    title: "PRIVATE SUITES",
    image: "/images/rebase-private-suites.webp",
    alt: "Private Suites",
    link: null,
    objectPosition: "center",
  },
  {
    id: "cryo",
    title: "CRYO",
    image: "/images/rebase-cryo.webp",
    alt: "Cryotherapy",
    link: null,
    objectPosition: "left",
  },
  {
    id: "hbot",
    title: "HBOT",
    image: "/images/rebase-hbot-new.png",
    alt: "HBOT",
    link: "/book/101264",
    objectPosition: "center",
  },
];

const ServiceCard = ({ service }: { service: typeof popularServices[0] }) => {
  const CardContent = (
    <>
      <img
        src={service.image}
        alt={service.alt}
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`}
        style={{ objectPosition: service.objectPosition }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-end p-6 pb-8">
        <div className="h-16 flex items-center justify-center mb-4">
          <h3 className="text-white text-xl sm:text-2xl font-light text-center tracking-wide">
            {service.title}
          </h3>
        </div>
        <button className="w-full px-6 py-3 backdrop-blur-sm bg-white/20 border border-white/40 text-white text-sm tracking-wider hover:bg-white/30 transition-all">
          RESERVE
        </button>
      </div>
    </>
  );

  if (service.link) {
    return (
      <Link
        to={service.link}
        className="relative h-[400px] rounded-lg overflow-hidden group cursor-pointer block"
      >
        {CardContent}
      </Link>
    );
  }

  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden group cursor-pointer">
      {CardContent}
    </div>
  );
};

const AboutSection = () => {
  return (
    <>
      <section className="bg-background py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Collage Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto items-end">
            {/* Large image on the left */}
            <div className="h-[500px] md:h-[608px]">
              <img
                src="/images/rebase-hbot.webp"
                alt="Hyperbaric oxygen therapy at Rebase"
                className="w-full h-full object-cover object-center rounded-lg"
              />
            </div>

            {/* Two stacked images on the right */}
            <div className="space-y-4">
              <img
                src="/images/rebase-suite.webp"
                alt="Rebase recovery suite"
                className="w-full h-[250px] md:h-[300px] object-cover rounded-lg"
              />
              <img
                src="/images/rebase-class.webp"
                alt="Wellness class at Rebase"
                className="w-full h-[250px] md:h-[300px] object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Most Popular Section */}
          <div id="most-popular" className="mt-20">
            <h2 className="text-xl sm:text-2xl font-light text-white text-center mb-12 tracking-widest">
              MOST POPULAR
            </h2>
          </div>
        </div>

        {/* Full Width Carousel */}
        <div className="w-full">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {popularServices.map((service) => (
                <CarouselItem key={service.id} className="pl-4 basis-[85%]">
                  <ServiceCard service={service} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-white/20 border-white/40 text-white hover:bg-white/30" />
            <CarouselNext className="right-4 bg-white/20 border-white/40 text-white hover:bg-white/30" />
          </Carousel>
        </div>
      </section>
      <ServicesAccordion />
    </>
  );
};

export default AboutSection;
