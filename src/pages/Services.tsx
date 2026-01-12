import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';

// Static service data - will be replaced with API fetch once Mindbody integration is built
const staticServices = [
  {
    id: 'hbot-1',
    title: 'Hyperbaric Oxygen Therapy',
    description: 'Experience the healing power of pressurized oxygen therapy. Enhances recovery, reduces inflammation, and boosts cellular regeneration.',
    duration: '60 min',
    price: '£150',
    category: 'Recovery',
    image: '/images/rebase-hbot-new.png',
  },
  {
    id: 'cryo-1',
    title: 'Cryotherapy',
    description: 'Full-body cold therapy to reduce inflammation, boost metabolism, and accelerate muscle recovery.',
    duration: '3 min',
    price: '£65',
    category: 'Recovery',
    image: '/images/rebase-cryo.webp',
  },
  {
    id: 'ice-sauna-1',
    title: 'Ice & Sauna Circuit',
    description: 'Alternate between ice baths and infrared sauna for the ultimate contrast therapy experience.',
    duration: '45 min',
    price: '£85',
    category: 'Wellness',
    image: '/images/rebase-ice-sauna.webp',
  },
  {
    id: 'class-1',
    title: 'Recovery Class',
    description: 'Guided group sessions focusing on mobility, breathwork, and recovery techniques.',
    duration: '45 min',
    price: '£25',
    category: 'Classes',
    image: '/images/rebase-class.webp',
  },
  {
    id: 'suite-1',
    title: 'Private Suite',
    description: 'Book a private suite with access to sauna, ice bath, and relaxation amenities.',
    duration: '90 min',
    price: '£120',
    category: 'Private',
    image: '/images/rebase-private-suites.webp',
  },
];

const categories = ['All', 'Recovery', 'Wellness', 'Classes', 'Private'];

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredServices = activeCategory === 'All'
    ? staticServices
    : staticServices.filter(service => service.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-secondary/50 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Services
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover our range of recovery and wellness treatments designed to help you perform at your best.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <ServiceCard
                  id={service.id}
                  title={service.title}
                  description={service.description}
                  duration={service.duration}
                  price={service.price}
                  category={service.category}
                  image={service.image}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
