const values = [
  {
    title: "Excellence",
    description: "We maintain the highest standards in every aspect of our service delivery.",
  },
  {
    title: "Innovation",
    description: "Continuously evolving with cutting-edge wellness technologies and methodologies.",
  },
  {
    title: "Community",
    description: "Building a supportive environment where wellness becomes a shared journey.",
  },
  {
    title: "Holistic Care",
    description: "Addressing mind, body, and spirit through comprehensive wellness approaches.",
  },
];

const AboutContent = () => {
  return (
    <section id="about" className="scroll-mt-20">
      {/* Story Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F9ECD9]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-serif font-light text-[#3B2712]">
                Our <span className="text-[#3B2712]/80">Story</span>
              </h2>
              <div className="space-y-4 text-[#3B2712]/70 leading-relaxed">
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
            <div className="bg-[#3B2712]/5 border border-[#3B2712]/10 rounded-lg p-8">
              <h3 className="text-2xl font-serif font-medium text-[#3B2712] mb-6">Our Mission</h3>
              <p className="text-[#3B2712]/70 leading-relaxed">
                "To provide a novel approach to lasting wellbeing through exceptional care,
                innovative treatments, and a supportive community environment that empowers
                every individual to achieve their wellness goals."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-[#3B2712]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-light text-[#F9ECD9] mb-4">
              Our Values
            </h2>
            <p className="text-xl text-[#F9ECD9]/60 max-w-2xl mx-auto">
              The principles that guide everything we do at Rebase Recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-[#F9ECD9]/5 border border-[#F9ECD9]/10 rounded-lg p-6 text-center group">
                <h3 className="text-xl font-serif font-medium text-[#F9ECD9] mb-4 group-hover:text-[#F9ECD9]/80 transition-colors">
                  {value.title}
                </h3>
                <p className="text-[#F9ECD9]/60 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutContent;
