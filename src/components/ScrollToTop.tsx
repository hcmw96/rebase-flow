import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reset = () => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      // Reset any in-page fixed scroll containers used by informational pages
      document
        .querySelectorAll<HTMLElement>('[style*="position: fixed"][style*="overflowY"]')
        .forEach((el) => {
          el.scrollTop = 0;
        });
    };

    reset();
    const timeoutId = setTimeout(reset, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

