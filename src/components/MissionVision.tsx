const MissionVision = () => {
  return (
    <section 
      className="relative py-10 md:py-14 px-4 sm:px-6 lg:px-8 mx-4 sm:mx-6 lg:mx-8 rounded-2xl overflow-hidden"
      style={{
        backgroundImage: 'url(/images/sky-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40 rounded-2xl" />
      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
          {/* Our Mission */}
          <div>
            <h3 className="text-white text-lg md:text-xl font-light tracking-[0.2em] mb-4">
              OUR MISSION
            </h3>
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              To help boost your baseline and achieve elemental balance through a bespoke programme of precision treatments, structured classes and shared experience.
            </p>
          </div>
          
          {/* Our Vision */}
          <div>
            <h3 className="text-white text-lg md:text-xl font-light tracking-[0.2em] mb-4">
              OUR VISION
            </h3>
            <div className="text-white/90 text-sm md:text-base leading-relaxed space-y-4">
              <p>
                It seems at times that modern life is at odds with healthy living. Habitual screen-use and the struggle to strike the right work/life balance have disrupted our natural health and how hard it is to find time to relax and recharge.
              </p>
              <p>
                That's the bad news. The good news is we're here to change all that.
              </p>
              <p>
                Years of evolution have taught our bodies to respond to controlled stressors, like the cold and heat, and to reset our systems with the power of our breath. Contemporary studies have long shown the massive positive impact that social wellness can have on all our areas of our lives, from mental clarity and focus to more energy, better sleep and enhanced resilience.
              </p>
              <p>
                Rebase is our vision for a recalibrated social space, where health and happiness are no longer at odds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVision;
