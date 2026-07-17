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
  onContinueAfterCard: () => void;
};

const MembershipPurchasePanel = ({
  plan,
  membershipData,
  membershipLoading = false,
  needsCardOnFile,
  cardSetupRetryHint = null,
  onSignIn,
  onContinueAfterCard,
}: MembershipPurchasePanelProps) => {
  const { isAuthenticated, isRedirecting, mbSession } = useAuth();
  const accountUrl = mindbodyClientAccountUrl();
  const checkoutInFlightRef = useRef(false);
  const [checkoutOpened, setCheckoutOpened] = useState(false);

  const sessionId = mbSession?.sessionId;
  const alreadyOwnsPlan = ownsMembershipPlan(membershipData, plan.id);

  useEffect(() => {
    if (!sessionId) return;
    setCheckoutOpened(Boolean(getMembershipCheckoutLock(sessionId, plan.id)));
  }, [sessionId, plan.id]);

  const openCheckoutOnce = useCallback(
    () => {
      if (!plan.monthlyCheckoutUrl || !sessionId) return false;
      if (checkoutInFlightRef.current) return false;
      if (alreadyOwnsPlan) return false;

      const existing = getMembershipCheckoutLock(sessionId, plan.id);
      if (existing) {
        setCheckoutOpened(true);
        return false;
      }

      const global = getActiveMembershipCheckoutLock(sessionId);
      if (global && global.planId !== plan.id) {
        return false;
      }

      checkoutInFlightRef.current = true;

      if (!tryClaimMembershipCheckout(sessionId, plan.id)) {
        checkoutInFlightRef.current = false;
        setCheckoutOpened(true);
        return false;
      }

      openMindbodyExternalUrl(plan.monthlyCheckoutUrl);
      setCheckoutOpened(true);

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
        <Button
          type="button"
          className="h-11 w-full rounded-none bg-[#F9ECD9] text-[#3B2712] hover:bg-[#F9ECD9]/90 text-xs uppercase tracking-[0.15em]"
          disabled={isRedirecting}
          onClick={onSignIn}
        >
          {isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing…
            </>
          ) : (
            'Apply for membership'
          )}
        </Button>
        <p className="text-center text-[10px] font-light leading-relaxed text-[#F9ECD9]/45">
          Sign in or create an account to complete your monthly membership.
        </p>
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
        <p className="text-[10px] text-[#F9ECD9]/45 text-center">
          If the checkout did not open, contact reception before trying again.
        </p>
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
        Apply for membership — {formatMembershipPrice(plan.monthlyPriceGbp)}/month
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
