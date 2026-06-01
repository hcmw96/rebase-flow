/** Canonical marketing site origin (SPA public routes). */
export const SITE_URL = "https://rebase.echo.london";

export const SITE_NAME = "Rebase Recovery";
export const SITE_TAGLINE = "Rebase Recovery London";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/rebase-private-suites.webp`;
export const TWITTER_HANDLE = "@rebaserecovery";

export const BUSINESS = {
  name: SITE_NAME,
  legalName: "Kula Recovery Limited",
  description:
    "Premium wellness and recovery studio in Marylebone, London — infrared sauna, cryotherapy, hyperbaric oxygen, ice bath, contrast therapy and massage.",
  email: "reception@rebaserecovery.com",
  membershipEmail: "membership@rebaserecovery.com",
  phone: "+442045535701",
  phoneDisplay: "+44 20 4553 5701",
  streetAddress: "1a St Vincent Street",
  addressLocality: "London",
  postalCode: "W1U 4DA",
  addressCountry: "GB",
  geo: {
    latitude: 51.5185,
    longitude: -0.1527,
  },
  openingHours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "21:00" },
    { days: ["Saturday", "Sunday"], opens: "08:00", closes: "20:00" },
  ],
  sameAs: [
    "https://www.instagram.com/rebaserecovery",
    "https://www.rebaserecovery.com",
  ],
  priceRange: "££",
} as const;

export const CORE_SERVICES = [
  {
    name: "Infrared Sauna & Ice Bath",
    description: "Private infrared heat and cold plunge contrast therapy in Marylebone.",
    image: `${SITE_URL}/images/rebase-infrared-suite.jpg`,
  },
  {
    name: "Cryotherapy",
    description: "Whole-body cryotherapy to reduce inflammation and accelerate recovery.",
    image: `${SITE_URL}/images/rebase-cryo.webp`,
  },
  {
    name: "Hyperbaric Oxygen Therapy",
    description: "Pressurised oxygen therapy (HBOT) for healing, performance and longevity.",
    image: `${SITE_URL}/images/rebase-hbot-treatment.webp`,
  },
  {
    name: "Ice Bath & Contrast Therapy",
    description: "Communal and private contrast experiences with ice bath and sauna.",
    image: `${SITE_URL}/images/rebase-ice-sauna-new.webp`,
  },
  {
    name: "Sports Massage",
    description: "Deep tissue, sports massage and recovery bodywork by expert therapists.",
    image: `${SITE_URL}/images/rebase-massage.jpg`,
  },
  {
    name: "Communal Contrast",
    description: "Shared ice baths, Finnish sauna and bucket showers for independent contrast sessions at Rebase Marylebone.",
    image: `${SITE_URL}/images/rebase-members-suite.jpg`,
  },
] as const;

export type BreadcrumbItem = { name: string; path: string };

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** Page title in format: "Topic | Rebase Recovery London" */
export function seoTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_TAGLINE}`;
}

export function truncateDescription(text: string, max = 160): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trimEnd() + "…";
}

export function postalAddressSchema() {
  return {
    "@type": "PostalAddress" as const,
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.addressLocality,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.addressCountry,
  };
}

export function localBusinessSchema(overrides?: { url?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": ["HealthClub", "DaySpa"],
    "@id": `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: overrides?.url ?? `${SITE_URL}/`,
    image: DEFAULT_OG_IMAGE,
    logo: `${SITE_URL}/lovable-uploads/6a377d49-6c42-49f6-a599-537d4243c812.png`,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    address: postalAddressSchema(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    openingHoursSpecification: BUSINESS.openingHours.flatMap(({ days, opens, closes }) =>
      days.map((day) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: day,
        opens,
        closes,
      })),
    ),
    sameAs: BUSINESS.sameAs,
    areaServed: {
      "@type": "City",
      name: "London",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Wellness & Recovery Services",
      itemListElement: CORE_SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: serviceSchema(service.name, service.description, service.image),
      })),
    },
  };
}

export function serviceSchema(name: string, description: string, image?: string) {
  return {
    "@type": "Service",
    name,
    description,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: "London, UK",
    ...(image ? { image } : {}),
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function itemListServicesSchema(
  path: string,
  listName: string,
  services: Array<{ name: string; description: string; image?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: absoluteUrl(path),
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: serviceSchema(service.name, service.description, service.image),
    })),
  };
}

/** Public marketing routes for sitemap generation */
export const WEBSITE_ROUTES: Array<{
  path: string;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/experiences", changefreq: "weekly", priority: 0.9 },
  { path: "/membership", changefreq: "monthly", priority: 0.8 },
  { path: "/contact", changefreq: "monthly", priority: 0.7 },
  { path: "/faq", changefreq: "monthly", priority: 0.7 },
  { path: "/privacy-policy", changefreq: "yearly", priority: 0.3 },
  { path: "/terms", changefreq: "yearly", priority: 0.3 },
  { path: "/cookie-policy", changefreq: "yearly", priority: 0.3 },
];
