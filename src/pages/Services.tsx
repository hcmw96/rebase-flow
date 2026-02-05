import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ServiceCard, { ServiceVariant } from '@/components/ServiceCard';
import ServiceCardCompact from '@/components/ServiceCardCompact';
import CategoryFilter from '@/components/CategoryFilter';
import FeaturedServices from '@/components/FeaturedServices';
 import CategorySection from '@/components/CategorySection';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices, useHideServices } from '@/hooks/useHiddenServices';
import { useFeaturedServices, useAddFeaturedService, useRemoveFeaturedService } from '@/hooks/useFeaturedServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, X, EyeOff, Settings, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Fallback images for services without images
const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Classes': '/images/rebase-class.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

// Service-specific images (by canonicalized name)
const serviceImages: Record<string, string> = {
  'Cryotherapy': '/images/rebase-cryo.webp',
  'Infrared Sauna & Ice Bath': '/images/rebase-ice-sauna-new.webp',
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

// Service group mappings - similar services that should be grouped under one card
const serviceGroupMappings: Array<{ pattern: RegExp; groupName: string }> = [
  // Skin treatments
  { pattern: /^skin\s*rejuv(enation)?/i, groupName: 'Skin Rejuvenation' },
  { pattern: /^skin\s*peels?/i, groupName: 'Skin Peel' },
  { pattern: /^bio\s*stim(ulation)?/i, groupName: 'BioStimulation' },
  
  // All massage types grouped together
  { pattern: /^deep\s*tissue\s*massage/i, groupName: 'Massage' },
  { pattern: /^sports\s*massage/i, groupName: 'Massage' },
  { pattern: /massage/i, groupName: 'Massage' },
  
  // Recovery/Tech therapies
  { pattern: /cryo(therapy)?/i, groupName: 'Cryotherapy' },
  
  // Wellness services
  { pattern: /^hyperbaric\s*oxygen/i, groupName: 'Hyperbaric Oxygen' },
  { pattern: /^infrared\s*sauna/i, groupName: 'Infrared Sauna & Ice Bath' },
  { pattern: /^premium\s*suite/i, groupName: 'Premium Suite' },
  
  // Therapy services
  { pattern: /^structural\s*fascia/i, groupName: 'Structural Fascia Therapy' },
  { pattern: /^holistic\s*face\s*sculpt/i, groupName: 'Holistic Face Sculpting' },
  { pattern: /^divine\s*facial/i, groupName: 'Divine Facial Healing' },
  
  // Medical/Clinical
  { pattern: /^osteopathy/i, groupName: 'Osteopathy' },
  { pattern: /^(oxygen-?)?ozone/i, groupName: 'Ozone Therapy' },
  
  // Classes (group all class types)
  { pattern: /minute\s*classes$/i, groupName: 'Classes' },
  { pattern: /^all\s*classes$/i, groupName: 'Classes' },
];

// Canonicalize service name to group similar services together
function canonicalizeServiceName(baseName: string): string {
  for (const { pattern, groupName } of serviceGroupMappings) {
    if (pattern.test(baseName)) {
      return groupName;
    }
  }
  return baseName;
}

interface GroupedService {
  baseName: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

const Services = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  
  const { data: services, isLoading, error } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();
  const { data: featuredServicesData = [] } = useFeaturedServices();
  const hideServices = useHideServices();
  const addFeatured = useAddFeaturedService();
  const removeFeatured = useRemoveFeaturedService();
  const { toast } = useToast();

  // Get set of hidden service IDs and featured service IDs
  const hiddenServiceIds = useMemo(() => {
    return new Set(hiddenServices.map((h) => h.service_id));
  }, [hiddenServices]);

  const featuredServiceIds = useMemo(() => {
    return new Set(featuredServicesData.map((f) => f.service_id));
  }, [featuredServicesData]);

  // Group services by base name (without duration) and extract unique categories
  const { groupedServices, categories, servicesMap } = useMemo(() => {
    if (!services || services.length === 0) {
      return { groupedServices: [], categories: ['All'], servicesMap: new Map() };
    }

    // Filter out hidden services unless in edit mode
    const visibleServices = isEditMode 
      ? services 
      : services.filter((s) => !hiddenServiceIds.has(s.id));

    const groups = new Map<string, GroupedService>();

    for (const service of visibleServices) {
      const { baseName, duration } = extractDurationFromName(service.name);
      const canonicalName = canonicalizeServiceName(baseName);
      const category = service.programName || service.category || 'Wellness';
      const image = serviceImages[canonicalName] || categoryImages[service.programName] || categoryImages[service.category] || categoryImages['default'];

      if (!groups.has(canonicalName)) {
        groups.set(canonicalName, {
          baseName: canonicalName,
          description: service.onlineDescription || service.description || 'Experience our premium wellness service.',
          category,
          image,
          variants: [],
        });
      }

      groups.get(canonicalName)!.variants.push({
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
    
    // Custom sort order for specific services
    const serviceOrder: Record<string, number> = {
      'Infrared Sauna & Ice Bath': 0,
      'Premium Suite': 1,
      'Cryotherapy': 2,
    };
    
    grouped.sort((a, b) => {
      const orderA = serviceOrder[a.baseName] ?? 999;
      const orderB = serviceOrder[b.baseName] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.baseName.localeCompare(b.baseName);
    });

    // Extract unique categories
    const uniqueCategories = ['All', ...new Set(grouped.map(s => s.category))];

    return { groupedServices: grouped, categories: uniqueCategories, servicesMap: groups };
  }, [services, hiddenServiceIds, isEditMode]);

   // Group services by category for collapsible sections
   const servicesByCategory = useMemo(() => {
     const categoryMap = new Map<string, GroupedService[]>();
     
     // Filter by search first
     let filtered = groupedServices;
     if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase().trim();
       filtered = filtered.filter(service => 
         service.baseName.toLowerCase().includes(query) ||
         service.description.toLowerCase().includes(query)
       );
     }
     
     for (const service of filtered) {
       const cat = service.category;
       if (!categoryMap.has(cat)) {
         categoryMap.set(cat, []);
       }
       categoryMap.get(cat)!.push(service);
     }
     
     return categoryMap;
   }, [groupedServices, searchQuery]);
 
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

  const handleToggleFeatured = async (service: GroupedService) => {
    const firstVariantId = service.variants[0].id;
    const isFeatured = service.variants.some(v => featuredServiceIds.has(v.id));

    try {
      if (isFeatured) {
        // Find the featured service ID to remove
        const featuredToRemove = service.variants.find(v => featuredServiceIds.has(v.id));
        if (featuredToRemove) {
          await removeFeatured.mutateAsync(featuredToRemove.id);
          toast({
            title: 'Removed from popular',
            description: `${service.baseName} is no longer featured.`,
          });
        }
      } else {
        await addFeatured.mutateAsync({
          service_id: firstVariantId,
          service_name: service.baseName,
          label: 'Popular',
        });
        toast({
          title: 'Added to popular',
          description: `${service.baseName} is now featured.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update featured status.',
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

  const isServiceFeatured = (service: GroupedService) => {
    return service.variants.some((v) => featuredServiceIds.has(v.id));
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: "url('/images/services-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <Navigation />
      

      {/* Featured Services - Only on mobile when not in edit mode */}
      {isMobile && !isEditMode && featuredServicesData.length > 0 && (
        <FeaturedServices 
          featuredServices={featuredServicesData} 
          servicesMap={servicesMap}
        />
      )}

      {/* Edit Mode Toggle & Actions */}
      <section className="mt-16 border-b border-border sticky top-16 z-20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center">
              {isEditMode ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitEditMode}
                    className="h-12"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {selectedServices.size} selected
                  </span>
                </div>
              ) : (
                <div className="relative w-full flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full pl-11 text-base"
                  />
                </div>
              )}
            </div>
            
            {isEditMode && selectedServices.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleHideSelected}
                disabled={hideServices.isPending}
                className="h-8"
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Hide ({selectedServices.size})
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Category Filter - Horizontal scroll */}

      {/* Services List/Grid */}
      <section className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-8 w-32" />
                  <div className="flex gap-3">
                    <Skeleton className="h-[100px] w-[100px] rounded-xl" />
                    <Skeleton className="h-[100px] w-[100px] rounded-xl" />
                    <Skeleton className="h-[100px] w-[100px] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Unable to load services at the moment.</p>
              <p className="text-sm text-muted-foreground">Please try again later.</p>
            </div>
          ) : servicesByCategory.size === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery.trim() 
                  ? 'No services match your search.'
                  : 'No services available.'}
              </p>
            </div>
          ) : (
            /* Collapsible Category Sections */
            <div className="space-y-2">
              {Array.from(servicesByCategory.entries()).map(([category, categoryServices], index) => (
                <CategorySection
                  key={category}
                  category={category}
                  services={categoryServices}
                  defaultExpanded={index < 3}
                />
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
