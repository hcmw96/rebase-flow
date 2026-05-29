export interface FaqItem {
  q: string;
  a: string;
  email?: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Do I need to be a member to use the facility?",
    a: "Both membership and single-use passes are offered. Memberships (monthly, 6-month, or 12-month) provide the best value; single-use passes are available for non-members.",
  },
  {
    q: "How do I book an appointment?",
    a: "Via the website, mobile app, or by calling directly. Advance booking is recommended, especially weekends. Walk-ins accepted subject to availability.",
  },
  {
    q: "What are your hours of operation?",
    a: "Mon–Fri: 7am–9pm. Sat–Sun: 8am–8pm.",
  },
  {
    q: "Do I need to bring anything? What should I wear?",
    a: "Bring a swimsuit for ice baths and sauna (also available to purchase at reception). Light, loose clothing for other treatments. Robes, slippers, and all PPE for Cryotherapy are provided.",
  },
  {
    q: "Do you have changing rooms and showers?",
    a: "Yes — male and female changing rooms with showers, lockers, swimsuit drying facilities, and hair dryers.",
  },
  {
    q: "Private events and partnerships",
    a: "For private events or partnerships please email",
    email: "df@rebaserecovery.com",
  },
  {
    q: "Which services does Rebase offer?",
    a: "A comprehensive range including ice baths, saunas (traditional & infrared), contrast classes, breathwork, yoga, HBOT, cryotherapy, vitamin infusions, lymphatic drainage, and various recovery specialists.",
  },
  {
    q: "Are walk-in appointments accepted?",
    a: "Yes, subject to availability. Advance booking is recommended.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Minimum 24 hours' notice required to cancel or reschedule. Cancellations within that window may incur a fee.",
  },
  {
    q: "Are there age restrictions for certain services?",
    a: "Some services have age restrictions for safety reasons. Check with the team or service descriptions for specifics.",
  },
  {
    q: "Does Rebase offer gift certificates or vouchers?",
    a: "Yes — customisable gift options are available. Contact us directly to purchase.",
  },
  {
    q: "Can I purchase wellness products at Rebase?",
    a: "Yes, a curated selection of premium wellness products is available in-venue.",
  },
  {
    q: "Can I request a specific professional for my treatment?",
    a: "Requests are accommodated where possible, subject to availability. Specify your preference when booking.",
  },
  {
    q: "What is your Health and Safety policy?",
    a: "All treatments are administered by trained professionals to the highest standards. Clients are encouraged to discuss any health concerns with the team before booking.",
  },
];

export const FEATURED_FAQ_COUNT = 6;

export function faqItemsForSchema(items: FaqItem[] = FAQ_ITEMS) {
  return items.map((f) => ({
    question: f.q,
    answer: f.email ? `${f.a} ${f.email}.` : f.a,
  }));
}
