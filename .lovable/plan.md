

# Fix: Use Short Hand-Written Descriptions for Service Cards

## Problem
The Mindbody API descriptions are long HTML blobs. Even with `line-clamp-2`, they just get truncated with "..." making them unreadable and pointless.

## Solution — `src/components/WebsiteServices.tsx`

Add a `shortDescriptions` map with concise, hand-written summaries (under ~80 chars) for each service group. Use these in the overlay instead of the API description. Fall back to a generic short string if a service isn't in the map.

```ts
const shortDescriptions: Record<string, string> = {
  'Infrared Sauna & Ice Bath': 'Detoxifying infrared heat followed by an invigorating ice bath.',
  'Premium Suite': 'Private suite with Finnish sauna, ice baths and bucket shower.',
  'Midday Reset': 'A restorative midday escape in our private wellness suite.',
  'Cryotherapy': 'Whole-body cold therapy to reduce inflammation and boost recovery.',
  'Hyperbaric Oxygen': 'Pressurised oxygen therapy to accelerate healing and recovery.',
  'IV Drip': 'Vitamin-rich IV infusions tailored to your wellness goals.',
  'NAD+': 'Cellular regeneration therapy to restore energy and vitality.',
  'Massage': 'Expert deep tissue and sports massage for total tension relief.',
  'Skin Rejuvenation': 'Advanced facial treatments for radiant, youthful skin.',
  'Skin Peel': 'Clinical-grade peels to resurface and refresh your complexion.',
  'BioStimulation': 'Targeted bio-electric therapy to stimulate tissue repair.',
  'Structural Fascia Therapy': 'Hands-on fascial release for posture and pain relief.',
  'Holistic Face Sculpting': 'Natural face-lift technique using sculpting massage.',
  'Divine Facial Healing': 'A deeply relaxing, restorative facial ritual.',
  'Osteopathy': 'Manual therapy to restore movement and relieve pain.',
  'Ozone Therapy': 'Medical-grade ozone to support detoxification and immunity.',
  'Brazilian Lymphatic': 'Specialised drainage massage to reduce fluid retention.',
  'Nutritional Therapy': 'Personalised nutrition guidance for optimal health.',
  'Myofascial Dry Needling': 'Precision needling to release deep muscular tension.',
};
```

Then in the overlay, replace `{desc}` with:

```ts
const shortDesc = shortDescriptions[service.baseName] || 'Experience our premium wellness service.';
```

And use `{shortDesc}` in the `<p>` tag. These are all ~60-80 chars and will comfortably fit on 2 lines at `text-xs`.

### Files to modify
- `src/components/WebsiteServices.tsx` — add `shortDescriptions` map, use it in overlay instead of `desc`

