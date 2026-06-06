import { CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PaymentCardSetupStep from '@/components/payment/PaymentCardSetupStep';
import { useAuth } from '@/contexts/AuthContext';
import { mindbodyClientAccountUrl } from '@/lib/mindbodyAuth';
import { cn } from '@/lib/utils';

type ContrastPassPurchasePanelProps = {
  displayPrice: number;
  productName?: string | null;
  isLoadingProduct: boolean;
  isPurchasing: boolean;
  purchaseComplete: boolean;
  error: string | null;
  needsCardOnFile: boolean;
  cardSetupRetryHint?: string | null;
  onSignIn: () => void;
  onCreateAccount: () => void;
  onPurchase: () => void;
  onContinueAfterCard: () => void;
};

const ContrastPassPurchasePanel = ({
  displayPrice,
  productName,
  isLoadingProduct,
  isPurchasing,
  purchaseComplete,
  error,
  needsCardOnFile,
  cardSetupRetryHint = null,
  onSignIn,
  onCreateAccount,
  onPurchase,
  onContinueAfterCard,
}: ContrastPassPurchasePanelProps) => {
  const { isAuthenticated, isRedirecting } = useAuth();
  const accountUrl = mindbodyClientAccountUrl();

  if (purchaseComplete) {
    return (
      <div className="space-y-4 text-center py-2">
        <div className="flex justify-center">
          <div className="rounded-full bg-[#F9ECD9]/15 p-3">
            <CheckCircle className="h-8 w-8 text-[#F9ECD9]" aria-hidden />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-xl text-[#F9ECD9]">Pass purchased</h2>
          <p className="text-sm font-light leading-relaxed text-[#F9ECD9]/75">
            Your pass is on your Mindbody account with a 14-day validity from today and one communal
            contrast session per day. Book on Rebase — we apply your pass and Mindbody tracks usage
            against those terms.
          </p>
        </div>
        <Button
          asChild
          className="h-12 w-full rounded-none bg-[#F9ECD9] text-[#3B2712] hover:bg-[#F9ECD9]/90"
        >
          <Link to="/experiences#communal-contrast">Book your first session</Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-[#F9ECD9]">Get your pass</h2>
        <p className="text-sm font-light leading-relaxed text-[#F9ECD9]/75">
          Sign in with your Mindbody account to buy on Rebase — we&apos;ll open Mindbody in a new
          window, then bring you back here to pay. Booking sessions stays on our website.
        </p>
        <Button
          type="button"
          className="h-12 w-full rounded-none bg-[#F9ECD9] text-[#3B2712] hover:bg-[#F9ECD9]/90"
          disabled={isRedirecting}
          onClick={onSignIn}
        >
          {isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening Mindbody…
            </>
          ) : (
            'Sign in to buy'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-none border-[#F9ECD9]/30 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10"
          onClick={onCreateAccount}
        >
          Create Mindbody account
        </Button>
      </div>
    );
  }

  if (needsCardOnFile) {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-[#F9ECD9]">Almost there</h2>
        <PaymentCardSetupStep
          variant="offer"
          accountUrl={accountUrl}
          onContinue={onContinueAfterCard}
          isRetrying={isPurchasing}
          continueLabel="I've added my card — continue"
          description="Add a payment card to your Mindbody account to complete your purchase."
          retryingLabel="Processing your purchase…"
          footerNote="Mindbody opens in a new tab. Return here when you're done — we'll finish your purchase on Rebase."
          retryHint={cardSetupRetryHint}
        />
        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-none border-[#F9ECD9]/30 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10"
        >
          <Link to="/experiences#communal-contrast">How to book sessions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl text-[#F9ECD9]">Get your pass</h2>

      <div className="rounded-lg border border-[#F9ECD9]/15 bg-[#F9ECD9]/5 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <CreditCard className="h-4 w-4 text-[#F9ECD9]/80 shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-[#F9ECD9]">Pay on Rebase</p>
            <p className="text-[#F9ECD9]/75 leading-relaxed">
              We&apos;ll charge{' '}
              <span className="font-medium text-[#F9ECD9]">£{displayPrice}</span> to the card saved
              on your Mindbody account
              {productName ? (
                <>
                  {' '}
                  for <span className="text-[#F9ECD9]/90">{productName}</span>
                </>
              ) : (
                '.'
              )}{' '}
              You won&apos;t leave this page.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p
          className={cn(
            'text-sm rounded-lg px-3 py-2.5 leading-relaxed',
            'text-foreground/90 bg-amber-500/10 border border-amber-500/25 text-[#F9ECD9]',
          )}
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          className="h-12 flex-1 rounded-none bg-[#F9ECD9] px-8 text-[#3B2712] hover:bg-[#F9ECD9]/90"
          disabled={isLoadingProduct || isPurchasing || !productName}
          onClick={onPurchase}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            `Pay £${displayPrice} & get your pass`
          )}
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 flex-1 rounded-none border-[#F9ECD9]/30 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10"
        >
          <Link to="/experiences#communal-contrast">How to book sessions</Link>
        </Button>
      </div>
    </div>
  );
};

export default ContrastPassPurchasePanel;
