const AboutSection = () => {
  return (
    <section className="bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <p className="text-white/70 text-base sm:text-lg leading-relaxed text-center mb-12">
          At its core, Rebase is a social space with healthy living as its heartbeat; a place to share with friends where feeling good always comes first. For friends and founders Alex and Waldo, this concept is deeply personal. Six years ago, following a near-death experience, Alex was forced to rebuild his health from the ground up. His journey back to fighting fitness took them both around the world, discovering the science behind the cultural treasures held up around the world as the foundations of good health. From ice baths in the arctic and breathwork in India, to sauna in Finland and Te Mescal in Mexico, our founders were amazed by the incredible resilience woven into our DNA over thousands of years of evolution. Combining this knowledge with the latest research in sports recovery, longevity and nutrition; Rebase was born: an urban home for ancient practice, built on a solid foundation of cutting edge science.
        </p>
        
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
        <div className="mt-20">
          <h2 className="text-3xl sm:text-4xl font-light text-white text-center mb-12">
            MOST POPULAR
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Ice & Sauna */}
            <div className="relative h-[400px] rounded-lg overflow-hidden group cursor-pointer">
              <img 
                src="/images/rebase-class.webp"
                alt="Ice & Sauna"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-end p-6 pb-8">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 w-full">
                  <div className="h-16 flex items-center justify-center mb-4">
                    <h3 className="text-white text-xl sm:text-2xl font-light text-center tracking-wide">
                      ICE & SAUNA
                    </h3>
                  </div>
                  <button className="w-full px-6 py-3 backdrop-blur-sm bg-white/20 border border-white/40 text-white text-sm tracking-wider hover:bg-white/30 transition-all">
                    BOOK NOW
                  </button>
                </div>
              </div>
            </div>

            {/* Private Suites */}
            <div className="relative h-[400px] rounded-lg overflow-hidden group cursor-pointer">
              <img 
                src="/images/rebase-suite.webp"
                alt="Private Suites"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-end p-6 pb-8">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 w-full">
                  <div className="h-16 flex items-center justify-center mb-4">
                    <h3 className="text-white text-xl sm:text-2xl font-light text-center tracking-wide">
                      PRIVATE SUITES
                    </h3>
                  </div>
                  <button className="w-full px-6 py-3 backdrop-blur-sm bg-white/20 border border-white/40 text-white text-sm tracking-wider hover:bg-white/30 transition-all">
                    BOOK NOW
                  </button>
                </div>
              </div>
            </div>

            {/* Cryo */}
            <div className="relative h-[400px] rounded-lg overflow-hidden group cursor-pointer">
              <img 
                src="/images/rebase-hbot.webp"
                alt="Cryotherapy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-end p-6 pb-8">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 w-full">
                  <div className="h-16 flex items-center justify-center mb-4">
                    <h3 className="text-white text-xl sm:text-2xl font-light text-center tracking-wide">
                      CRYO
                    </h3>
                  </div>
                  <button className="w-full px-6 py-3 backdrop-blur-sm bg-white/20 border border-white/40 text-white text-sm tracking-wider hover:bg-white/30 transition-all">
                    BOOK NOW
                  </button>
                </div>
              </div>
            </div>

            {/* IV Therapy */}
            <div className="relative h-[400px] rounded-lg overflow-hidden group cursor-pointer">
              <img 
                src="/images/rebase-suite.webp"
                alt="IV Therapy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-end p-6 pb-8">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 w-full">
                  <div className="h-16 flex items-center justify-center mb-4">
                    <h3 className="text-white text-xl sm:text-2xl font-light text-center tracking-wide">
                      IV THERAPY
                    </h3>
                  </div>
                  <button className="w-full px-6 py-3 backdrop-blur-sm bg-white/20 border border-white/40 text-white text-sm tracking-wider hover:bg-white/30 transition-all">
                    BOOK NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
