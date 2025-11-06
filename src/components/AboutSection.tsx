const AboutSection = () => {
  return (
    <section className="bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <p className="text-white/70 text-base sm:text-lg leading-relaxed text-center mb-12">
          At its core, Rebase is a social space with healthy living as its heartbeat; a place to share with friends where feeling good always comes first. For friends and founders Alex and Waldo, this concept is deeply personal. Six years ago, following a near-death experience, Alex was forced to rebuild his health from the ground up. His journey back to fighting fitness took them both around the world, discovering the science behind the cultural treasures held up around the world as the foundations of good health. From ice baths in the arctic and breathwork in India, to sauna in Finland and Te Mescal in Mexico, our founders were amazed by the incredible resilience woven into our DNA over thousands of years of evolution. Combining this knowledge with the latest research in sports recovery, longevity and nutrition; Rebase was born: an urban home for ancient practice, built on a solid foundation of cutting edge science.
        </p>
        
        {/* Collage Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          {/* Large image on the left */}
          <div className="md:row-span-2">
            <img 
              src="/images/rebase-hbot.webp"
              alt="Hyperbaric oxygen therapy at Rebase"
              className="w-full h-full object-cover rounded-lg"
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
      </div>
    </section>
  );
};

export default AboutSection;
