import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PaymentCardSetupStep from '@/components/payment/PaymentCardSetupStep';
import { useAuth } from '@/contexts/AuthContext';
import { mindbodyClientAccountUrl } from '@/lib/mindbodyAuth';
import { openMindbodyExternalUrl } from '@/lib/mobileBrowser';
import { cn } from '@/lib/utils';
import type { MembershipPlan } from '@/config/membershipPlans';
import { formatMembershipPrice } from '@/config/membershipPlans';
import {
  getActiveMembershipCheckoutLock,
  getMembershipCheckoutLock,
  msUntilCheckoutRetryAllowed,
  clearMembershipCheckoutLock,
  tryClaimMembershipCheckout,
} from '@/lib/membershipCheckoutGuard';
import { ownsMembershipPlan } from '@/lib/membershipOwnership';
import type { MembershipData } from '@/hooks/useMindbodyMembership';

type MembershipPurchasePanelProps = {
  plan: MembershipPlan;
  membershipData?: MembershipData;
  membershipLoading?: boolean;
  needsCardOnFile: boolean;
  cardSetupRetryHint?: string | null;
  onSignIn: () => void;
  onCreateAccount: () => void;
  onContactStudio: () => void;
  onContinueAfterCard: () => void;
};

const MembershipPurchasePanel = ({
  plan,
  membershipData,
  membershipLoading = false,
  needsCardOnFile,
  cardSetupRetryHint = null,
  onSignIn,
  onCreateAccount,
  onContactStudio,
  onContinueAfterCard,
}: MembershipPurchasePanelProps) => {
  const { isAuthenticated, isRedirecting, mbSession } = useAuth();
  const accountUrl = mindbodyClientAccountUrl();
  const checkoutInFlightRef = useRef(false);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [retryCooldownMs, setRetryCooldownMs] = useState(0);

  const sessionId = mbSession?.sessionId;
  const alreadyOwnsPlan = ownsMembershipPlan(membershipData, plan.id);

  const syncLockState = useCallback(() => {
    if (!sessionId) return;
    const lock = getMembershipCheckoutLock(sessionId, plan.id);
    setCheckoutOpened(Boolean(lock));
    setRetryCooldownMs(msUntilCheckoutRetryAllowed(lock));
  }, [sessionId, plan.id]);

  useEffect(() => {
    syncLockState();
  }, [syncLockState]);

  useEffect(() => {
    if (!checkoutOpened || retryCooldownMs <= 0) return;
    const timer = window.setInterval(() => {
      if (!sessionId) return;
      const lock = getMembershipCheckoutLock(sessionId, plan.id);
      setRetryCooldownMs(msUntilCheckoutRetryAllowed(lock));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [checkoutOpened, retryCooldownMs, sessionId, plan.id]);

  const openCheckoutOnce = useCallback(
    (options?: { forceRetry?: boolean }) => {
      if (!plan.monthlyCheckoutUrl || !sessionId) return false;
      if (checkoutInFlightRef.current) return false;
      if (alreadyOwnsPlan) return false;

      if (options?.forceRetry) {
        clearMembershipCheckoutLock(sessionId, plan.id);
      } else {
        const existing = getMembershipCheckoutLock(sessionId, plan.id);
        if (existing) {
          setCheckoutOpened(true);
          return false;
        }

        const global = getActiveMembershipCheckoutLock(sessionId);
        if (global && global.planId !== plan.id) {
          return false;
        }
      }

      checkoutInFlightRef.current = true;

      if (!tryClaimMembershipCheckout(sessionId, plan.id)) {
        checkoutInFlightRef.current = false;
        setCheckoutOpened(true);
        return false;
      }

      openMindbodyExternalUrl(plan.monthlyCheckoutUrl);
      setCheckoutOpened(true);
      setRetryCooldownMs(msUntilCheckoutRetryAllowed(getMembershipCheckoutLock(sessionId, plan.id)));

      window.setTimeout(() => {
        checkoutInFlightRef.current = false;
      }, 5000);

      return true;
    },
    [plan.monthlyCheckoutUrl, plan.id, sessionId, alreadyOwnsPlan],
  );

  if (membershipLoading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#F9ECD9]/60">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Checking membership…
      </div>
    );
  }

  if (isAuthenticated && alreadyOwnsPlan) {
    return (
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-8 w-8 text-[#F9ECD9]" aria-hidden />
        </div>
        <p className="text-sm font-light text-[#F9ECD9]/85">
          You already have an active {plan.name} membership on your account.
        </p>
        <Button
          asChild
          variant="outline"
          className="h-11 w-full rounded-none border-[#F9ECD9]/30 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10 text-xs uppercase tracking-[0.15em]"
        >
          <Link to="/members">View member area</Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-light leading-relaxed text-[#F9ECD9]/70">
          Monthly subscriptions ({formatMembershipPrice(plan.monthlyPriceGbp)}/month) are purchased
          online via Mindbody. Sign in with your Mindbody account — we&apos;ll open Mindbody in a new
          window, then bring you back here to start your subscription.
        </p>
        <Button
          type="button"
          className="h-11 w-full rounded-none bg-[#F9ECD9] text-[#3B2712] hover:bg-[#F9ECD9]/90 text-xs uppercase tracking-[0.15em]"
          disabled={isRedirecting}
          onClick={onSignIn}
        >
          {isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening Mindbody…
            </>
          ) : (
            'Sign in to subscribe monthly'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-none border-[#F9ECD9]/30 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10 text-xs uppercase tracking-[0.15em]"
          onClick={onCreateAccount}
        >
          Create Mindbody account
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full rounded-none text-[#F9ECD9]/50 hover:text-[#F9ECD9]/80 hover:bg-transparent text-[10px] uppercase tracking-[0.12em]"
          onClick={onContactStudio}
        >
          Contact studio for annual membership
        </Button>
      </div>
    );
  }

  const otherTierCheckoutActive =
    sessionId &&
    (() => {
      const global = getActiveMembershipCheckoutLock(sessionId);
      return Boolean(global && global.planId !== plan.id);
    })();

  if (needsCardOnFile) {
    return (
      <div className="space-y-3">
        <PaymentCardSetupStep
          variant="offer"
          accountUrl={accountUrl}
          onContinue={() => {
            onContinueAfterCard();
            openCheckoutOnce();
          }}
          isRetrying={checkoutInFlightRef.current}
          continueLabel="I've added my card — continue"
          description="Add a payment card to your Mindbody account to complete your monthly membership subscription."
          retryingLabel="Opening checkout…"
          footerNote="Mindbody opens once in a new tab. Do not tap again — multiple checkouts can charge you more than once."
          retryHint={cardSetupRetryHint}
        />
      </div>
    );
  }

  if (checkoutOpened) {
    return (
      <div className="space-y-3">
        <p
          className={cn(
            'text-xs rounded-lg px-3 py-2.5 leading-relaxed',
            'text-[#F9ECD9]/90 bg-amber-500/10 border border-amber-500/25',
          )}
        >
          <strong className="font-medium">Checkout opened — do not tap again.</strong> Complete your
          monthly {plan.name} subscription in the Mindbody window only. Tapping again can open another
          checkout and charge you twice.
        </p>
        <p className="text-xs text-[#F9ECD9]/65 leading-relaxed">
          This checkout is for the monthly plan (
          {formatMembershipPrice(plan.monthlyPriceGbp)}/month). For annual membership (
          {formatMembershipPrice(plan.annualPriceGbp)}/year), contact the studio.
        </p>
        {retryCooldownMs > 0 ? (
          <p className="text-[10px] text-[#F9ECD9]/45 text-center">
            Retry available in {Math.ceil(retryCooldownMs / 1000)}s if the window didn&apos;t open
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full rounded-none border-[#F9ECD9]/20 bg-transparent text-[#F9ECD9]/70 hover:bg-[#F9ECD9]/5 text-[10px] uppercase tracking-[0.12em]"
            disabled={checkoutInFlightRef.current}
            onClick={() => openCheckoutOnce({ forceRetry: true })}
          >
            Checkout didn&apos;t open? Try once more
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {otherTierCheckoutActive && (
        <p className="text-xs text-[#F9ECD9]/60 leading-relaxed">
          Finish or close your other membership checkout before starting this tier.
        </p>
      )}

      <Button
        type="button"
        className="h-11 w-full rounded-none bg-[#F9ECD9] text-[#3B2712] hover:bg-[#F9ECD9]/90 text-xs uppercase tracking-[0.15em]"
        disabled={checkoutInFlightRef.current || Boolean(otherTierCheckoutActive)}
        aria-busy={checkoutInFlightRef.current}
        onClick={() => openCheckoutOnce()}
      >
        <ExternalLink className="mr-2 h-3.5 w-3.5" aria-hidden />
        Subscribe monthly — {formatMembershipPrice(plan.monthlyPriceGbp)}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-none border-[#F9ECD9]/30 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10 text-xs uppercase tracking-[0.15em]"
        onClick={onContactStudio}
      >
        Contact studio for annual — {formatMembershipPrice(plan.annualPriceGbp)}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="h-9 w-full rounded-none text-[#F9ECD9]/50 hover:text-[#F9ECD9]/80 hover:bg-transparent text-[10px] uppercase tracking-[0.12em]"
        onClick={() => openMindbodyExternalUrl(accountUrl)}
      >
        Add or update card on file
      </Button>
    </div>
  );
};

export default MembershipPurchasePanel;
