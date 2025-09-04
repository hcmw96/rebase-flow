import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { useMindbody } from "@/hooks/useMindbody";

interface ClientRegistrationProps {
  onClose: () => void;
  initialEmail?: string;
}

const ClientRegistration = ({ onClose, initialEmail = "" }: ClientRegistrationProps) => {
  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    Email: initialEmail,
    MobilePhone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createNewClient, error } = useMindbody();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.FirstName || !formData.LastName || !formData.Email) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createNewClient(formData);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card rounded-3xl border-white/10 animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-serif">Create New Account</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 glass-button text-white border-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-white/70 text-sm">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.FirstName}
                onChange={(e) => setFormData(prev => ({ ...prev, FirstName: e.target.value }))}
                className="glass-card bg-black/20 border-white/20 text-white placeholder:text-white/50 mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-white/70 text-sm">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.LastName}
                onChange={(e) => setFormData(prev => ({ ...prev, LastName: e.target.value }))}
                className="glass-card bg-black/20 border-white/20 text-white placeholder:text-white/50 mt-1"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email" className="text-white/70 text-sm">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.Email}
              onChange={(e) => setFormData(prev => ({ ...prev, Email: e.target.value }))}
              className="glass-card bg-black/20 border-white/20 text-white placeholder:text-white/50 mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-white/70 text-sm">Mobile Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.MobilePhone}
              onChange={(e) => setFormData(prev => ({ ...prev, MobilePhone: e.target.value }))}
              className="glass-card bg-black/20 border-white/20 text-white placeholder:text-white/50 mt-1"
              placeholder="Optional"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 glass-button text-white/70 border-white/20 hover:text-white hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 glass-button text-white bg-blue-500/30 border-blue-500/50 hover:bg-blue-500/40"
              disabled={isSubmitting || !formData.FirstName || !formData.LastName || !formData.Email}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientRegistration;