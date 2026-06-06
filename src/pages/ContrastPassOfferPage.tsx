import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SeoHead from '@/components/seo/SeoHead';
import ContrastPassPurchasePanel from '@/components/offers/ContrastPassPurchasePanel';
import { CONTRAST_PASS_OFFER } from '@/config/contrastPassOffer';
import { useContrastPassOffer } from '@/hooks/useContrastPassOffer';
import { usePurchaseContrastPass } from '@/hooks/usePurchaseContrastPass';
import { useAuth } from '@/contexts/AuthContext';
import { BookingMutationError } from '@/lib/bookingMutationError';
import {
  clearSessionNeedsPaymentCard,
  markSessionNeedsPaymentCard,
  sessionNeedsPaymentCard,
} from '@/lib/paymentCardSetupStorage';
import { breadcrumbSchema, seoTitle, truncateDescription } from '@/lib/seo';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_DESCRIPTION =
  'June offer: 2 Week Unlimited Communal Contrast Pass at Rebase Recovery, Marylebone — £130. One session per day for 14 days from purchase.';

const ContrastPassOfferPage = () => {
  const { saleActive, displayPrice, isLoading, product } = useContrastPassOffer();
  const { login, openMindbodySignUp, isAuthenticated, mbSession } = useAuth();
  const purchaseMutation = usePurchaseContrastPass();

  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [needsCardOnFile, setNeedsCardOnFile] = useState(false);
  const [cardSetupRetryHint, setCardSetupRetryHint] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && sessionNeedsPaymentCard(mbSession?.sessionId)) {
      setNeedsCardOnFile(true);
    }
  }, [isAuthenticated, mbSession?.sessionId]);

  const handlePurchase = async () => {
    if (!product?.id) {
      toast.error('Pass is not available right now. Please try again shortly.');
      return;
    }

    setPurchaseError(null);
    setCardSetupRetryHint(null);
    if (!needsCardOnFile) {
      setNeedsCardOnFile(false);
    }

    try {
      const result = await purchaseMutation.mutateAsync(product.id);
      setPurchaseComplete(true);
      setNeedsCardOnFile(false);
      clearSessionNeedsPaymentCard();
      toast.success(`Pass purchased — £${result.amountGbp}`);
    } catch (error: unknown) {
      if (error instanceof BookingMutationError) {
        if (error.flags.noStoredCard) {
          if (mbSession?.sessionId) {
            markSessionNeedsPaymentCard(mbSession.sessionId);
          }
          setNeedsCardOnFile(true);
          setPurchaseError(null);
          if (needsCardOnFile) {
            setCardSetupRetryHint(
              "We still couldn't find a card on your account. Add one in Mindbody, then tap continue again.",
            );
          }
          if (error.flags.requiresLogin) {
            login();
          }
          return;
        }
        setNeedsCardOnFile(false);
        setCardSetupRetryHint(null);
        clearSessionNeedsPaymentCard();
        setPurchaseError(error.message);
        if (error.flags.requiresLogin) {
          login();
        }
        return;
      }
      setPurchaseError(error instanceof Error ? error.message : 'Purchase failed. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#1a1a1a]"
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <SeoHead
        title={seoTitle(CONTRAST_PASS_OFFER.headline)}
        description={truncateDescription(PAGE_DESCRIPTION)}
        path={CONTRAST_PASS_OFFER.path}
        jsonLd={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: CONTRAST_PASS_OFFER.headline, path: CONTRAST_PASS_OFFER.path },
        ])}
      />
      <Navigation variant="dark" />

      <main id="main-content" className="pt-24 pb-16">
        <div className="relative mx-auto max-w-4xl px-6">
          <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-lg">
            <img
              src={CONTRAST_PASS_OFFER.image}
              alt="Communal contrast suite at Rebase Recovery"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              {saleActive && (
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#F9ECD9]/80">
                  Available throughout June 2026
                </p>
              )}
              <h1 className="font-serif text-3xl text-[#F9ECD9] sm:text-4xl lg:text-5xl">
                {CONTRAST_PASS_OFFER.headline}
              </h1>
              <p className="mt-2 text-2xl font-light text-[#F9ECD9]">£{displayPrice}</p>
            </div>
          </div>

          <div className="space-y-10 text-[#F9ECD9]/90">
            <section className="space-y-4">
              <p className="text-base font-light leading-relaxed sm:text-lg">
                {CONTRAST_PASS_OFFER.summary}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  `${CONTRAST_PASS_OFFER.validityDays} days from date of purchase`,
                  `${CONTRAST_PASS_OFFER.sessionsPerDay} session per day`,
                  'Ice baths, sauna & bucket showers',
                  'Book sessions on our website after purchase',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F9ECD9]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-[#F9ECD9]/15 bg-[#F9ECD9]/5 p-6 sm:p-8">
              {saleActive ? (
                <ContrastPassPurchasePanel
                  displayPrice={displayPrice}
                  productName={product?.name}
                  isLoadingProduct={isLoading}
                  isPurchasing={purchaseMutation.isPending}
                  purchaseComplete={purchaseComplete}
                  error={purchaseError}
                  needsCardOnFile={needsCardOnFile}
                  cardSetupRetryHint={cardSetupRetryHint}
                  onSignIn={() => login()}
                  onCreateAccount={openMindbodySignUp}
                  onPurchase={handlePurchase}
                  onContinueAfterCard={handlePurchase}
                />
              ) : (
                <>
                  <h2 className="font-serif text-xl text-[#F9ECD9]">Offer ended</h2>
                  <p className="mt-2 text-sm font-light leading-relaxed text-[#F9ECD9]/75">
                    This pass was available to purchase throughout June 2026 only. If you already
                    bought a pass, your 14-day validity runs from your purchase date — book communal
                    contrast on our{' '}
                    <a
                      href="/experiences#communal-contrast"
                      className="underline underline-offset-4 text-[#F9ECD9]"
                    >
                      experiences page
                    </a>
                    .
                  </p>
                  <p className="mt-4 text-sm text-[#F9ECD9]/60">
                    Questions?{' '}
                    <a
                      href="mailto:reception@rebaserecovery.com"
                      className="text-[#F9ECD9] underline underline-offset-4"
                    >
                      reception@rebaserecovery.com
                    </a>
                  </p>
                </>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-xl text-[#F9ECD9]">Terms &amp; conditions</h2>
              <ul className="list-disc space-y-3 pl-5 text-sm font-light leading-relaxed text-[#F9ECD9]/80">
                {CONTRAST_PASS_OFFER.terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
            </section>

            {saleActive && isAuthenticated && !purchaseComplete && (
              <p className="text-xs text-[#F9ECD9]/50">
                Payment is processed securely through Mindbody on your behalf. You stay on
                rebaserecovery.com for sign-in, payment, and booking.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContrastPassOfferPage;
