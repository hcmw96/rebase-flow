import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Widget } from './Widget';
import { WidgetConfig } from './context/WidgetContext';

// Import styles as string (will be inlined by build)
import widgetStyles from './styles.css?inline';

// Default production API URL
const DEFAULT_API_URL = 'https://ipmrdxtgrxvwzbrbiuvz.supabase.co';

class RebaseServicesWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;

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

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue !== newValue && this.mountPoint) {
      this.render();
    }
  }

  private getConfig(): WidgetConfig {
    return {
      theme: (this.getAttribute('theme') as 'dark' | 'light') || 'dark',
      apiUrl: this.getAttribute('api-url') || DEFAULT_API_URL,
      showBooking: this.getAttribute('show-booking') !== 'false',
      category: this.getAttribute('category') || null,
    };
  }

  private render() {
    // Inject styles if not already done
    if (!this.shadow.querySelector('style')) {
      const styleElement = document.createElement('style');
      styleElement.textContent = widgetStyles;
      this.shadow.appendChild(styleElement);
    }

    // Create mount point if not exists
    if (!this.mountPoint) {
      this.mountPoint = document.createElement('div');
      this.mountPoint.id = 'widget-root';
      this.shadow.appendChild(this.mountPoint);
    }

    // Get config from attributes
    const config = this.getConfig();

    // Create or update React root
    if (!this.root) {
      this.root = createRoot(this.mountPoint);
    }

    this.root.render(<Widget config={config} />);
  }
}

// Register the custom element
if (!customElements.get('rebase-services')) {
  customElements.define('rebase-services', RebaseServicesWidget);
}

// Export for programmatic use
export { RebaseServicesWidget };
export type { WidgetConfig };
