import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "rebase-cookie-consent";

interface CookiePreferences {
  necessary: boolean;
  analytical: boolean;
  functionality: boolean;
  targeting: boolean;
}

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytical: false,
    functionality: false,
    targeting: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const save = (p: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setVisible(false);
  };

  const acceptAll = () =>
    save({ necessary: true, analytical: true, functionality: true, targeting: true });

  const rejectAll = () =>
    save({ necessary: true, analytical: false, functionality: false, targeting: false });

  const savePreferences = () => save(prefs);

  if (!visible) return null;

  const categories = [
    { key: "necessary" as const, label: "Strictly necessary cookies", fixed: true },
    { key: "analytical" as const, label: "Analytical / performance cookies", fixed: false },
    { key: "functionality" as const, label: "Functionality cookies", fixed: false },
    { key: "targeting" as const, label: "Targeting cookies", fixed: false },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="dark fixed bottom-4 left-4 z-50 w-[min(400px,calc(100vw-2rem))] rounded-xl border border-[#F9ECD9]/10 bg-[#1A1A1A] p-5 shadow-2xl"
      >
        <button
          onClick={rejectAll}
          className="absolute right-3 top-3 text-[#F9ECD9]/40 hover:text-[#F9ECD9] transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-sm font-medium text-[#F9ECD9] mb-2">Cookie Policy</h3>

        {!expanded ? (
          <>
            <p className="text-xs leading-relaxed text-[#F9ECD9]/60 mb-4">
              We use cookies to improve your experience. You can manage your preferences or accept all cookies.{" "}
              <Link to="/cookie-policy" className="underline underline-offset-2 text-[#F9ECD9]/80 hover:text-[#F9ECD9]">
                Learn more
              </Link>
            </p>
            <div className="flex gap-2">
              <Button onClick={acceptAll} size="sm" className="flex-1 bg-[#F9ECD9] text-[#1A1A1A] hover:bg-[#F9ECD9]/90 text-xs h-8">
                Accept All
              </Button>
              <Button onClick={() => setExpanded(true)} variant="outline" size="sm" className="flex-1 border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/10 text-xs h-8">
                Manage
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-4 mt-1">
              {categories.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-xs text-[#F9ECD9]/70">{c.label}</span>
                  {c.fixed ? (
                    <span className="text-[10px] uppercase tracking-wider text-[#F9ECD9]/40">Always on</span>
                  ) : (
                    <Switch
                      checked={prefs[c.key]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [c.key]: v }))}
                      className="data-[state=checked]:bg-[#F9ECD9] data-[state=unchecked]:bg-[#F9ECD9]/20 h-5 w-9"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={savePreferences} size="sm" className="flex-1 bg-[#F9ECD9] text-[#1A1A1A] hover:bg-[#F9ECD9]/90 text-xs h-8">
                Save
              </Button>
              <Button onClick={acceptAll} variant="outline" size="sm" className="flex-1 border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/10 text-xs h-8">
                Accept All
              </Button>
              <Button onClick={rejectAll} variant="outline" size="sm" className="flex-1 border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-[#F9ECD9]/10 text-xs h-8">
                Reject All
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent;
