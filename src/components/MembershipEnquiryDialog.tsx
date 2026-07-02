import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS } from "@/lib/seo";
import { MEMBERSHIP_PLANS } from "@/config/membershipPlans";

const MEMBERSHIP_EMAIL = BUSINESS.membershipEmail;

interface MembershipEnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierName?: string;
  billingPeriod?: 'annual';
  showTierSelect?: boolean;
}

const MembershipEnquiryDialog = ({
  open,
  onOpenChange,
  tierName,
  billingPeriod,
  showTierSelect = false,
}: MembershipEnquiryDialogProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim();
    const selectedTier = showTierSelect
      ? (form.elements.namedItem("tier") as HTMLSelectElement).value.trim()
      : tierName?.trim();
    const resolvedTier = selectedTier || 'Membership';

    const subject = encodeURIComponent(
      billingPeriod === 'annual'
        ? `Annual membership enquiry: ${resolvedTier}`
        : `Membership enquiry: ${resolvedTier}`,
    );
    const body = encodeURIComponent(
      [
        billingPeriod === 'annual'
          ? message || 'I would like to enquire about annual membership.'
          : message || 'I would like to enquire about membership.',
        "",
        "---",
        `Membership tier: ${resolvedTier}`,
        billingPeriod === 'annual' ? 'Billing: Annual' : null,
        `Name: ${firstName} ${lastName}`.trim(),
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );

    const mailto = `mailto:${MEMBERSHIP_EMAIL}?subject=${subject}&body=${body}`;
    const link = document.createElement("a");
    link.href = mailto;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[#F9ECD9]/15 bg-[#1a1a1a] text-[#F9ECD9] sm:rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-light tracking-wide text-[#F9ECD9]">
            {billingPeriod === 'annual'
              ? tierName
                ? `Annual ${tierName} membership`
                : 'Annual membership'
              : `Enquire about ${tierName}`}
          </DialogTitle>
          <DialogDescription className="text-[#F9ECD9]/50 font-light">
            {billingPeriod === 'annual'
              ? "Annual memberships are arranged with the studio. Share your details and we'll get back to you at "
              : "Share your details and we'll get back to you at "}
            <a
              href={`mailto:${MEMBERSHIP_EMAIL}`}
              className="text-[#F9ECD9]/80 underline underline-offset-2 hover:text-[#F9ECD9]"
            >
              {MEMBERSHIP_EMAIL}
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <form key={tierName ?? 'annual'} onSubmit={handleSubmit} className="space-y-4 pt-2">
          {showTierSelect && (
            <div className="space-y-2">
              <Label htmlFor="membership-tier" className="text-[#F9ECD9]/70 text-xs uppercase tracking-wider">
                Membership tier
              </Label>
              <select
                id="membership-tier"
                name="tier"
                required
                defaultValue=""
                className="flex h-10 w-full rounded-none border border-[#F9ECD9]/20 bg-white/[0.04] px-3 py-2 text-sm text-[#F9ECD9] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F9ECD9]/30"
              >
                <option value="" disabled className="bg-[#1a1a1a]">
                  Select a tier
                </option>
                {MEMBERSHIP_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.name} className="bg-[#1a1a1a]">
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="membership-firstName" className="text-[#F9ECD9]/70 text-xs uppercase tracking-wider">
                First name
              </Label>
              <Input
                id="membership-firstName"
                name="firstName"
                required
                placeholder="First name"
                className="rounded-none border-[#F9ECD9]/20 bg-white/[0.04] text-[#F9ECD9] placeholder:text-[#F9ECD9]/30 focus-visible:ring-[#F9ECD9]/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="membership-lastName" className="text-[#F9ECD9]/70 text-xs uppercase tracking-wider">
                Last name
              </Label>
              <Input
                id="membership-lastName"
                name="lastName"
                required
                placeholder="Last name"
                className="rounded-none border-[#F9ECD9]/20 bg-white/[0.04] text-[#F9ECD9] placeholder:text-[#F9ECD9]/30 focus-visible:ring-[#F9ECD9]/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-email" className="text-[#F9ECD9]/70 text-xs uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="membership-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="rounded-none border-[#F9ECD9]/20 bg-white/[0.04] text-[#F9ECD9] placeholder:text-[#F9ECD9]/30 focus-visible:ring-[#F9ECD9]/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-phone" className="text-[#F9ECD9]/70 text-xs uppercase tracking-wider">
              Phone <span className="normal-case tracking-normal text-[#F9ECD9]/40">(optional)</span>
            </Label>
            <Input
              id="membership-phone"
              name="phone"
              type="tel"
              placeholder="+44 ..."
              className="rounded-none border-[#F9ECD9]/20 bg-white/[0.04] text-[#F9ECD9] placeholder:text-[#F9ECD9]/30 focus-visible:ring-[#F9ECD9]/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-message" className="text-[#F9ECD9]/70 text-xs uppercase tracking-wider">
              Message <span className="normal-case tracking-normal text-[#F9ECD9]/40">(optional)</span>
            </Label>
            <Textarea
              id="membership-message"
              name="message"
              rows={4}
              placeholder={
                billingPeriod === 'annual'
                  ? 'Tell us about your goals and preferred start date...'
                  : 'Tell us about your wellness goals...'
              }
              className="resize-none rounded-none border-[#F9ECD9]/20 bg-white/[0.04] text-[#F9ECD9] placeholder:text-[#F9ECD9]/30 focus-visible:ring-[#F9ECD9]/30"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-none uppercase tracking-[0.2em] text-sm font-light h-12 bg-[#F9ECD9] text-[#1a1a1a] hover:bg-[#F9ECD9]/90"
          >
            Send enquiry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipEnquiryDialog;
