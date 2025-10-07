import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ClientCreditCard {
  Address: string | null;
  CardHolder: string | null;
  CardNumber: string;
  CardType: string;
  City: string | null;
  ExpMonth: string;
  ExpYear: string;
  LastFour: string;
  PostalCode: string | null;
  State: string | null;
}

interface CardFormProps {
  amount: number;
  existingCards?: ClientCreditCard[];
  onSubmit: (metadata: {
    amount: number;
    creditCardNumber: string;
    expMonth: string;
    expYear: string;
    cvv?: string;
    billingName: string;
    billingPostalCode: string;
    saveInfo: boolean;
    isStoredCard: boolean;
  }) => void;
  onCancel: () => void;
}

const CardFormDialog = ({ amount, existingCards = [], onSubmit, onCancel }: CardFormProps) => {
  const [selectedCard, setSelectedCard] = useState<ClientCreditCard | null>(null);

  const [creditCardNumber, setCreditCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);

  const handleSubmit = () => {
    if (selectedCard) {
      onSubmit({
        amount,
        creditCardNumber: selectedCard.CardNumber,
        expMonth: selectedCard.ExpMonth,
        expYear: selectedCard.ExpYear,
        billingName: selectedCard.CardHolder || "",
        billingPostalCode: selectedCard.PostalCode || "",
        saveInfo: false,
        isStoredCard: true,
      });
      return;
    }

    if (!creditCardNumber || !expMonth || !expYear || !cvv || !billingName) {
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
      isStoredCard: false,
    });
  };

  // 🔹 Quando o usuário clica em um cartão salvo
  const handleSelectCard = (card: ClientCreditCard) => {
    setSelectedCard(card);
    setCreditCardNumber(card.CardNumber);
    setExpMonth(card.ExpMonth);
    setExpYear(card.ExpYear);
    setBillingName(card.CardHolder || "");
    setBillingPostalCode(card.PostalCode || "");
    setCvv("***"); // 👈 Mostra "***" visualmente
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-sm text-gray-600">
            Amount to pay: <strong>£{amount}</strong>
          </p>

          {/* 🔹 Cartões salvos */}
          {existingCards.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Saved Cards:</p>
              <div className="grid gap-2">
                {existingCards.map((card, idx) => (
                  <Card
                    key={idx}
                    onClick={() => handleSelectCard(card)}
                    className={`p-3 cursor-pointer border ${
                      selectedCard?.LastFour === card.LastFour ? "border-blue-500 shadow-md" : "border-gray-300"
                    } hover:border-blue-400`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{card.CardType}</span>
                      <span className="text-sm text-gray-600">{card.LastFour}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 🔹 Formulário */}
          <div className="space-y-3 mt-3">
            <Input
              placeholder="Cardholder name"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              disabled={!!selectedCard} // 👈 desativa se for cartão salvo
              className={selectedCard ? "bg-gray-100 text-gray-900 cursor-not-allowed" : ""}
            />
            <Input
              placeholder="Card number"
              value={creditCardNumber}
              onChange={(e) => setCreditCardNumber(e.target.value)}
              disabled={!!selectedCard} // 👈 desativa se for cartão salvo
              className={selectedCard ? "bg-gray-100 text-gray-900 cursor-not-allowed" : ""}
            />
            <div className="flex gap-2">
              <Input
                placeholder="MM"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                disabled={!!selectedCard} // 👈 desativa se for cartão salvo
                className={selectedCard ? "bg-gray-100 text-gray-900 cursor-not-allowed" : ""}
              />
              <Input
                placeholder="YYYY"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                disabled={!!selectedCard} // 👈 desativa se for cartão salvo
                className={selectedCard ? "bg-gray-100 text-gray-900 cursor-not-allowed" : ""}
              />
            </div>

            {/* 👇 Campo CVV modificado */}
            <Input
              placeholder="CVV"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              disabled={!!selectedCard} // 👈 desativa se for cartão salvo
              className={selectedCard ? "bg-gray-100 text-gray-900 cursor-not-allowed" : ""}
            />

            <Input
              placeholder="Postal code"
              value={billingPostalCode}
              onChange={(e) => setBillingPostalCode(e.target.value)}
              disabled={!!selectedCard} // 👈 desativa se for cartão salvo
              className={selectedCard ? "bg-gray-100 text-gray-900 cursor-not-allowed" : ""}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Pay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CardFormDialog;
