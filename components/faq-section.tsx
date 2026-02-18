"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Script from "next/script";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title: string;
  subtitle?: string;
  items: FaqItem[];
}

export function FaqSection({ title, subtitle, items }: FaqSectionProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-20 border-t bg-muted/40 py-20 sm:py-24">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mt-4 mb-10 max-w-xl text-center text-muted-foreground">
            {subtitle}
          </p>
        )}
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-base font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
