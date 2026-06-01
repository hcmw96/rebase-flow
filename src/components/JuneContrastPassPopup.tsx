import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CONTRAST_PASS_OFFER } from '@/config/contrastPassOffer';
import { useContrastPassOffer } from '@/hooks/useContrastPassOffer';

const DISMISS_SESSION_KEY = 'rebase-june-contrast-pass-popup-dismissed';

const JuneContrastPassPopup = () => {
  const { saleActive, displayPrice } = useContrastPassOffer();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!saleActive) return;
    if (sessionStorage.getItem(DISMISS_SESSION_KEY)) return;
    const id = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(id);
  }, [saleActive]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_SESSION_KEY, '1');
    setOpen(false);
  };

  if (!saleActive) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(true);
      }}
    >
      <DialogContent
        className="z-[70] max-w-md gap-0 overflow-hidden rounded-lg border-[#F9ECD9]/20 bg-[#2a2018] p-0 text-[#F9ECD9] sm:max-w-lg"
        onPointerDownOutside={dismiss}
        onEscapeKeyDown={dismiss}
      >
        <div className="relative aspect-[16/9] w-full">
          <img
            src={CONTRAST_PASS_OFFER.image}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a2018] via-black/40 to-transparent" />
          <p className="absolute left-4 top-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#F9ECD9]/80">
            June only
          </p>
        </div>

        <div className="space-y-4 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-serif text-2xl font-normal leading-snug text-[#F9ECD9]">
              {CONTRAST_PASS_OFFER.headline}
            </DialogTitle>
            <p className="text-xl font-light text-[#F9ECD9]">£{displayPrice}</p>
            <DialogDescription className="text-sm font-light leading-relaxed text-[#F9ECD9]/75">
              {CONTRAST_PASS_OFFER.summary} Valid for 14 days from purchase — buy by 30 June and
              your pass still runs into July.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              className="h-11 flex-1 rounded-none bg-[#F9ECD9] text-[#3B2712] hover:bg-[#F9ECD9]/90"
            >
              <Link to={CONTRAST_PASS_OFFER.path} onClick={dismiss}>
                View offer
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-none border-[#F9ECD9]/25 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10"
              onClick={dismiss}
            >
              Not now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JuneContrastPassPopup;
