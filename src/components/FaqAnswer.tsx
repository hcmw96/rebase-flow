import type { FaqItem } from "@/content/faqs";

interface FaqAnswerProps {
  faq: FaqItem;
  className?: string;
}

const FaqAnswer = ({ faq, className = "text-foreground/70 leading-relaxed" }: FaqAnswerProps) => {
  if (faq.email) {
    return (
      <p className={className}>
        {faq.a}{" "}
        <a href={`mailto:${faq.email}`} className="text-primary hover:underline">
          {faq.email}
        </a>
        .
      </p>
    );
  }
  return <p className={className}>{faq.a}</p>;
};

export default FaqAnswer;
