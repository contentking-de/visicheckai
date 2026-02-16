"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ExpandableResponse({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 150;

  if (!isLong) {
    return <span className="text-muted-foreground">{text}</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full cursor-pointer items-start gap-2 text-left"
      >
        <span
          className={`text-muted-foreground transition-colors group-hover:text-foreground ${
            expanded ? "whitespace-pre-wrap" : "line-clamp-2"
          }`}
        >
          {expanded ? text : `${text.slice(0, 150)}…`}
        </span>
        <span className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>
    </div>
  );
}
