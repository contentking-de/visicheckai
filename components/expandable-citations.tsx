"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface ExpandableCitationsProps {
  citations: string[];
  ownDomainCited: boolean;
  count: number;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ExpandableCitations({
  citations,
  ownDomainCited,
  count,
}: ExpandableCitationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (citations.length === 0) {
    return <span className="text-muted-foreground text-xs">–</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 group cursor-pointer"
      >
        <span
          className={`inline-flex items-center justify-center h-5 min-w-[20px] rounded-full px-1.5 text-xs font-medium ${
            ownDomainCited
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          }`}
        >
          {count}
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>

      {expanded && (
        <ul className="mt-2 space-y-1">
          {citations.map((url, i) => (
            <li key={i}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline break-all leading-snug"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[260px]" title={url}>
                  {extractDomain(url)}
                  {(() => {
                    try {
                      const p = new URL(url);
                      return p.pathname === "/" ? "" : p.pathname;
                    } catch {
                      return "";
                    }
                  })()}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
