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

const SUPPORT_EMAIL = "support@rebaserecovery.com";

interface MembershipEnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierName: string;
}

const MembershipEnquiryDialog = ({
  open,
  onOpenChange,
  tierName,
}: MembershipEnquiryDialogProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim();

    const subject = encodeURIComponent(`Membership enquiry: ${tierName}`);
    const body = encodeURIComponent(
      [
        message || "I would like to enquire about membership.",
        "",
        "---",
        `Membership tier: ${tierName}`,
        `Name: ${firstName} ${lastName}`.trim(),
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[#F9ECD9]/15 bg-[#1a1a1a] text-[#F9ECD9] sm:rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-light tracking-wide text-[#F9ECD9]">
            Enquire about {tierName}
          </DialogTitle>
          <DialogDescription className="text-[#F9ECD9]/50 font-light">
            Share your details and we&apos;ll get back to you at {SUPPORT_EMAIL}.
          </DialogDescription>
        </DialogHeader>

        <form key={tierName} onSubmit={handleSubmit} className="space-y-4 pt-2">
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
              placeholder="Tell us about your wellness goals..."
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
