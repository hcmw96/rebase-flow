import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { Skeleton } from '@/components/ui/skeleton';

// Fallback images for services without images
const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Classes': '/images/rebase-class.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const { data: services, isLoading, error } = useMindbodyServices();

  // Transform Mindbody services to our format and extract unique categories
  const { transformedServices, categories } = useMemo(() => {
    if (!services || services.length === 0) {
      return { transformedServices: [], categories: ['All'] };
    }

    const transformed = services.map((service) => ({
      id: service.id,
      title: service.name,
      description: service.onlineDescription || service.description || 'Experience our premium wellness service.',
      duration: service.defaultTimeLength ? `${service.defaultTimeLength} min` : null,
      price: typeof service.price === 'number' ? `£${service.price.toFixed(2)}` : 'Contact for pricing',
      category: service.programName || service.category || 'Wellness',
      image: categoryImages[service.programName] || categoryImages[service.category] || categoryImages['default'],
      programId: service.programId,
    }));

    // Extract unique categories
    const uniqueCategories = ['All', ...new Set(transformed.map(s => s.category))];

    return { transformedServices: transformed, categories: uniqueCategories };
  }, [services]);

  const filteredServices = activeCategory === 'All'
    ? transformedServices
    : transformedServices.filter(service => service.category === activeCategory);

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
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Unable to load services at the moment.</p>
              <p className="text-sm text-muted-foreground">Please try again later.</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services available in this category.</p>
            </div>
          ) : (
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
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
