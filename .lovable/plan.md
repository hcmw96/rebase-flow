

## Embeddable Web Component: `<rebase-services>` 

### Overview

This plan creates a standalone, embeddable Web Component using the native Web Components API that packages your services listing and booking flow into a single `<rebase-services>` custom element. External websites can embed it with just:

```html
<rebase-services src="https://rebase-flow.lovable.app/widget.js"></rebase-services>
```

### Architecture

```text
External Website
+--------------------------------------------------+
|  <html>                                          |
|    <body>                                        |
|      <rebase-services                            |
|        src="https://rebase.../widget.js"         |
|      ></rebase-services>                         |
|                                                  |
|      +----------------------------------+        |
|      | #shadow-root (closed)            |        |
|      |   <style>/* Tailwind CSS */</style>       |
|      |   <div id="widget-root">          |       |
|      |     [React App Renders Here]      |       |
|      |   </div>                          |        |
|      +----------------------------------+        |
|    </body>                                       |
|  </html>                                         |
+--------------------------------------------------+
```

### Key Features

1. **Shadow DOM Isolation** - Styles are encapsulated, preventing conflicts with host website CSS
2. **Single Script Load** - Embed via `src` attribute that fetches the bundled JavaScript
3. **Self-Contained React** - Full React 18 renders inside the Shadow DOM
4. **Theming Support** - Optional attributes for customization (theme, API endpoint)
5. **Responsive** - Works across all screen sizes

### Configuration Options (HTML Attributes)

| Attribute | Default | Description |
|-----------|---------|-------------|
| `src` | Required | URL to the widget bundle |
| `theme` | `dark` | `dark` or `light` theme |
| `api-url` | Production URL | Override API endpoint |
| `show-booking` | `true` | Enable/disable booking flow |
| `category` | `null` | Filter to specific category |

Example:
```html
<rebase-services 
  src="https://rebase-flow.lovable.app/widget.js"
  theme="light"
  category="Recovery"
></rebase-services>
```

---

## Implementation Plan

### Phase 1: Create Widget Infrastructure

**1. Create widget entry point and registration**

Create a new entry point that:
- Defines the `<rebase-services>` custom element class
- Extends `HTMLElement` with Shadow DOM
- Handles `src` attribute to load the main bundle
- Injects styles and mounts React

**Files to create:**
- `src/widget/index.ts` - Custom element definition
- `src/widget/Widget.tsx` - Root React component for widget
- `src/widget/styles.css` - Compiled Tailwind for widget
- `src/widget/context/WidgetContext.tsx` - Widget-specific context

**2. Custom Element Class Structure:**

```typescript
// src/widget/index.ts
class RebaseServicesWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private root: Root | null = null;
  
  static get observedAttributes() {
    return ['theme', 'api-url', 'category', 'show-booking'];
  }
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'closed' });
  }
  
  connectedCallback() {
    this.render();
  }
  
  attributeChangedCallback() {
    this.render();
  }
  
  private render() {
    // Inject styles and mount React
  }
}

customElements.define('rebase-services', RebaseServicesWidget);
```

### Phase 2: Create Standalone Widget Components

**1. Widget-specific service components (simplified, no routing):**

- `src/widget/components/ServiceList.tsx` - Collapsible category sections
- `src/widget/components/ServiceChip.tsx` - Compact service cards
- `src/widget/components/BookingFlow.tsx` - Multi-step booking (modal-based, no navigation)
- `src/widget/components/BookingCalendar.tsx` - Calendar picker
- `src/widget/components/TimeSlots.tsx` - Time slot selection

**2. Key differences from main app:**
- No `react-router-dom` - all navigation is internal state
- Modal-based booking flow instead of page navigation
- Simplified authentication flow (popup-based OAuth)
- All API calls use provided `api-url` attribute or default

### Phase 3: Styling Strategy

**1. Shadow DOM CSS Injection:**

Since Tailwind uses global styles, we need to:
- Build a separate Tailwind bundle for the widget
- Inject all CSS into the Shadow DOM

**2. Add to vite.config.ts:**

```typescript
// Additional build config for widget
export default defineConfig({
  build: {
    lib: {
      entry: 'src/widget/index.ts',
      name: 'RebaseServicesWidget',
      fileName: 'widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        // Inline all CSS into JS
        inlineDynamicImports: true
      }
    }
  }
});
```

**3. Create widget-specific Tailwind config:**
- `src/widget/tailwind.widget.config.ts`
- Prefixes all classes to avoid conflicts

### Phase 4: Build Configuration

**1. Create separate Vite config for widget build:**

Create `vite.widget.config.ts`:
```typescript
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget/index.ts'),
      name: 'RebaseServicesWidget',
      formats: ['iife'],
      fileName: () => 'widget.js'
    },
    cssCodeSplit: false,
    outDir: 'dist-widget',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
});
```

**2. Add build scripts to package.json:**

```json
{
  "scripts": {
    "build:widget": "vite build --config vite.widget.config.ts",
    "build:all": "vite build && npm run build:widget"
  }
}
```

### Phase 5: API Integration

**1. Widget API client (no Vite env vars):**

```typescript
// src/widget/api/client.ts
export function createApiClient(baseUrl: string) {
  return {
    async getServices() {
      const res = await fetch(`${baseUrl}/functions/v1/mindbody-services`);
      return res.json();
    },
    async getAvailability(params) {
      // ...
    },
    async bookService(params) {
      // ...
    }
  };
}
```

**2. Authentication handling:**
- OAuth popup flow for Mindbody login
- Session stored in widget's isolated localStorage key
- Callback handled via postMessage

### Phase 6: Widget React Components

**1. Main Widget.tsx structure:**

```tsx
// src/widget/Widget.tsx
export function Widget({ config }: WidgetProps) {
  const [view, setView] = useState<'services' | 'booking'>('services');
  const [selectedService, setSelectedService] = useState(null);
  
  return (
    <WidgetProvider config={config}>
      <div className="rebase-widget">
        {view === 'services' && (
          <ServiceList onSelectService={(s) => {
            setSelectedService(s);
            setView('booking');
          }} />
        )}
        {view === 'booking' && (
          <BookingModal 
            service={selectedService}
            onClose={() => setView('services')}
          />
        )}
      </div>
    </WidgetProvider>
  );
}
```

**2. ServiceList (widget version):**
- Reuses CategorySection and ServiceChip patterns
- Horizontal scrolling categories
- Click triggers booking modal (not navigation)

**3. BookingModal:**
- Steps: Service Options > Date > Time > Confirm
- Renders as overlay within Shadow DOM
- Uses same BookingCalendar and TimeSlotPicker logic

---

## File Structure

```text
src/
├── widget/
│   ├── index.ts                    # Custom element registration
│   ├── Widget.tsx                  # Root React component
│   ├── styles.css                  # Widget Tailwind styles
│   ├── api/
│   │   └── client.ts               # API client (no env vars)
│   ├── components/
│   │   ├── ServiceList.tsx         # Category sections
│   │   ├── ServiceChip.tsx         # Compact service cards
│   │   ├── BookingModal.tsx        # Modal-based booking
│   │   ├── BookingCalendar.tsx     # Calendar (adapted)
│   │   ├── TimeSlotPicker.tsx      # Time slots (adapted)
│   │   └── ConfirmationStep.tsx    # Booking confirmation
│   └── context/
│       └── WidgetContext.tsx       # Config & state context
├── vite.widget.config.ts           # Widget build config
└── package.json                    # Updated scripts
```

---

## Hosting & Distribution

**1. After building, `widget.js` is served from:**
```
https://rebase-flow.lovable.app/widget.js
```

**2. Public serving:**
- Add `widget.js` to `public/` folder after build
- Or serve from CDN/separate hosting

**3. CORS configuration:**
- Edge functions already have `Access-Control-Allow-Origin: *`
- Widget script loads from any domain

---

## Usage Examples

**Basic embed:**
```html
<rebase-services src="https://rebase-flow.lovable.app/widget.js"></rebase-services>
```

**With custom options:**
```html
<rebase-services 
  src="https://rebase-flow.lovable.app/widget.js"
  theme="light"
  category="Recovery"
  show-booking="true"
></rebase-services>
```

**Programmatic control:**
```javascript
const widget = document.querySelector('rebase-services');
widget.setAttribute('category', 'Wellness'); // Filter changes
```

---

## Technical Considerations

1. **Bundle Size** - Target under 250KB gzipped by tree-shaking unused Radix/UI components
2. **Shadow DOM Limitations** - Some Radix components may need adaptation for Shadow DOM
3. **Date Picker** - react-day-picker works in Shadow DOM with injected styles
4. **Fonts** - Load fonts via link in Shadow DOM or use system fonts
5. **Framer Motion** - Works in Shadow DOM, animations preserved

---

## Summary

This implementation creates a production-ready Web Component that:
- Loads via a single `<script>` tag with `src` attribute
- Uses Shadow DOM for complete style isolation
- Renders the full services + booking flow inside any website
- Requires no npm installation or build setup from embedders
- Supports theming and configuration via HTML attributes

