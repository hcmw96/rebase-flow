import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CardFormProps {
  amount: number;
  onSubmit: (metadata: {
    amount: number;
    creditCardNumber: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    billingName: string;
    billingPostalCode: string;
    saveInfo: boolean;
  }) => void;
  onCancel: () => void;
}

const CardFormDialog = ({ amount, onSubmit, onCancel }: CardFormProps) => {
  const [creditCardNumber, setCreditCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);

  const handleSubmit = () => {
    if (!creditCardNumber || !expMonth || !expYear || !cvv || !billingName || !billingPostalCode) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit({
      amount,
      creditCardNumber,
      expMonth,
      expYear,
      cvv,
      billingName,
      billingPostalCode,
      saveInfo,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Card Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p>Amount to pay: £{amount}</p>
          <Input placeholder="Cardholder name" value={billingName} onChange={(e) => setBillingName(e.target.value)} />
          <Input placeholder="Card number" value={creditCardNumber} onChange={(e) => setCreditCardNumber(e.target.value)} />
          <div className="flex gap-2">
            <Input placeholder="MM" value={expMonth} onChange={(e) => setExpMonth(e.target.value)} />
            <Input placeholder="YYYY" value={expYear} onChange={(e) => setExpYear(e.target.value)} />
          </div>
          <Input placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} />
          <Input placeholder="Postal code" value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} />
        </div>
        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Pay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CardFormDialog;
