import { useEffect } from 'react';
import { isExternalHttpUrl } from '@/lib/externalLinks';

/**
 * Ensure off-site http(s) links (Instagram, Maps, etc.) always open in a new tab,
 * even when individual anchors omit target="_blank".
 */
const EnsureExternalLinksNewTab = () => {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!isExternalHttpUrl(href)) return;

      // Already targeting a new browsing context — leave it alone.
      if (anchor.target && anchor.target !== '_self') return;

      event.preventDefault();
      window.open(href!, '_blank', 'noopener,noreferrer');
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
};

export default EnsureExternalLinksNewTab;
