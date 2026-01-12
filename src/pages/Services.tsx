import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceCard, { ServiceVariant } from '@/components/ServiceCard';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices, useHideServices } from '@/hooks/useHiddenServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fallback images for services without images
const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Classes': '/images/rebase-class.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

// Extract duration from service name like "Service Name (45 mins)" or "(90 min)"
function extractDurationFromName(name: string): { baseName: string; duration: number | null } {
  const durationMatch = name.match(/\((\d+)\s*(?:mins?|minutes?)\)/i);
  if (durationMatch) {
    const duration = parseInt(durationMatch[1], 10);
    const baseName = name.replace(durationMatch[0], '').trim();
    return { baseName, duration };
  }
  return { baseName: name, duration: null };
}

interface GroupedService {
  baseName: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

const Services = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  
  const { data: services, isLoading, error } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();
  const hideServices = useHideServices();
  const { toast } = useToast();

  // Get set of hidden service IDs
  const hiddenServiceIds = useMemo(() => {
    return new Set(hiddenServices.map((h) => h.service_id));
  }, [hiddenServices]);

  // Group services by base name (without duration) and extract unique categories
  const { groupedServices, categories } = useMemo(() => {
    if (!services || services.length === 0) {
      return { groupedServices: [], categories: ['All'] };
    }

    // Filter out hidden services unless in edit mode
    const visibleServices = isEditMode 
      ? services 
      : services.filter((s) => !hiddenServiceIds.has(s.id));

    const groups = new Map<string, GroupedService>();

    for (const service of visibleServices) {
      const { baseName, duration } = extractDurationFromName(service.name);
      const category = service.programName || service.category || 'Wellness';
      const image = categoryImages[service.programName] || categoryImages[service.category] || categoryImages['default'];

      if (!groups.has(baseName)) {
        groups.set(baseName, {
          baseName,
          description: service.onlineDescription || service.description || 'Experience our premium wellness service.',
          category,
          image,
          variants: [],
        });
      }

      groups.get(baseName)!.variants.push({
        id: service.id,
        duration: duration ?? service.defaultTimeLength,
        price: service.price,
        name: service.name,
      });
    }

    // Sort variants by duration within each group
    for (const group of groups.values()) {
      group.variants.sort((a, b) => (a.duration ?? 0) - (b.duration ?? 0));
    }

    const grouped = Array.from(groups.values());

    // Extract unique categories
    const uniqueCategories = ['All', ...new Set(grouped.map(s => s.category))];

    return { groupedServices: grouped, categories: uniqueCategories };
  }, [services, hiddenServiceIds, isEditMode]);

  const filteredServices = activeCategory === 'All'
    ? groupedServices
    : groupedServices.filter(service => service.category === activeCategory);

  const toggleServiceSelection = (baseName: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(baseName)) {
      newSelected.delete(baseName);
    } else {
      newSelected.add(baseName);
    }
    setSelectedServices(newSelected);
  };

  const handleHideSelected = async () => {
    // Get all variant IDs for selected services
    const servicesToHide: { id: string; name: string }[] = [];
    
    for (const service of groupedServices) {
      if (selectedServices.has(service.baseName)) {
        for (const variant of service.variants) {
          if (!hiddenServiceIds.has(variant.id)) {
            servicesToHide.push({ id: variant.id, name: variant.name });
          }
        }
      }
    }

    if (servicesToHide.length === 0) {
      toast({
        title: 'No services to hide',
        description: 'Selected services are already hidden.',
      });
      return;
    }

    try {
      await hideServices.mutateAsync(servicesToHide);
      toast({
        title: 'Services hidden',
        description: `${servicesToHide.length} service(s) have been hidden from the website.`,
      });
      setSelectedServices(new Set());
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to hide services. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setSelectedServices(new Set());
  };

  const isServiceHidden = (service: GroupedService) => {
    return service.variants.every((v) => hiddenServiceIds.has(v.id));
  };

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

      {/* Edit Mode Toggle & Actions */}
      <section className="py-4 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isEditMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitEditMode}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedServices.size} selected
                  </span>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Manage Services
                </Button>
              )}
            </div>
            
            {isEditMode && selectedServices.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleHideSelected}
                disabled={hideServices.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hide Selected ({selectedServices.size})
              </Button>
            )}
          </div>
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
                  key={service.baseName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative"
                >
                  {isEditMode && (
                    <div 
                      className={`absolute -top-2 -left-2 z-10 flex items-center gap-2 ${
                        isServiceHidden(service) ? 'opacity-50' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedServices.has(service.baseName)}
                        onCheckedChange={() => toggleServiceSelection(service.baseName)}
                        className="h-6 w-6 bg-background border-2"
                      />
                      {isServiceHidden(service) && (
                        <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                  )}
                  <div className={`${isEditMode && isServiceHidden(service) ? 'opacity-50' : ''}`}>
                    <ServiceCard
                      id={service.variants[0].id}
                      title={service.baseName}
                      description={service.description}
                      category={service.category}
                      image={service.image}
                      variants={service.variants}
                    />
                  </div>
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
