export const FUNNEL_PHASES = [
  "awareness",
  "consideration",
  "decision",
  "trust",
  "usage",
] as const;

export type FunnelPhase = (typeof FUNNEL_PHASES)[number];

export const PHASE_SUBCATEGORIES: Record<FunnelPhase, string[]> = {
  awareness: ["general_info", "trends", "company"],
  consideration: ["comparison", "evaluation", "use_cases", "target_groups"],
  decision: ["recommendations", "sentiment"],
  trust: ["reputation", "security"],
  usage: ["howto", "integrations"],
};

export const ALL_SUBCATEGORY_IDS = Object.values(PHASE_SUBCATEGORIES).flat();

export function getPhaseForSubcategory(subId: string): FunnelPhase | undefined {
  for (const [phase, subs] of Object.entries(PHASE_SUBCATEGORIES)) {
    if (subs.includes(subId)) return phase as FunnelPhase;
  }
  return undefined;
}

/**
 * AI-facing context per subcategory: intent description + example query patterns.
 * Used to steer the LLM when generating prompts for a selected category.
 */
const SUBCATEGORY_AI_CONTEXT: Record<
  string,
  { intent: string; patterns: string[] }
> = {
  general_info: {
    intent: "Users want general, factual information about a topic",
    patterns: [
      "What is X?",
      "How does X work?",
      "Overview of X",
      "Explain X",
    ],
  },
  trends: {
    intent:
      "Users want current news, trends, and market developments",
    patterns: [
      "Latest trends in X",
      "News about X",
      "Market developments in X",
      "Which providers in X are growing right now?",
    ],
  },
  company: {
    intent: "Users want to understand a specific company or brand in depth",
    patterns: [
      "What does company X do?",
      "Who founded X?",
      "History of X",
      "How big is company X?",
      "Key customers of X",
    ],
  },
  comparison: {
    intent: "Users want to compare options, competitors, and alternatives",
    patterns: [
      "X vs Y",
      "Alternatives to X",
      "Best tool for X",
      "Comparison of X and Y",
    ],
  },
  evaluation: {
    intent:
      "Mid-funnel: users are evaluating whether something fits their needs",
    patterns: [
      "Is X good for small businesses?",
      "Pros and cons of X",
      "Is X worth it?",
      "Experiences with X",
    ],
  },
  use_cases: {
    intent: "Users want inspiration, concrete use cases, and application examples",
    patterns: [
      "What can you do with X?",
      "Examples of X in practice",
      "Use cases for X",
      "Creative applications of X",
    ],
  },
  target_groups: {
    intent:
      "Users want to know if something is suitable for their specific audience or segment",
    patterns: [
      "Best X for freelancers",
      "X for agencies",
      "Solutions for SMBs",
      "Enterprise use cases for X",
    ],
  },
  recommendations: {
    intent: "Users want specific product or service recommendations",
    patterns: [
      "Best X for Y",
      "Which X should I use?",
      "Top X providers",
      "Recommended X tools",
    ],
  },
  sentiment: {
    intent:
      "Users want aggregated opinions, sentiment, and public perception about brands or products",
    patterns: [
      "What do people think about X?",
      "Is X trustworthy?",
      "Why is X criticized?",
      "Most popular providers for X",
    ],
  },
  reputation: {
    intent: "Users want to understand brand reputation and credibility",
    patterns: [
      "Is X reliable?",
      "Reviews of X",
      "Reputation of X",
      "Can you trust X?",
    ],
  },
  security: {
    intent:
      "Users want to assess trust, security, data privacy, and compliance aspects",
    patterns: [
      "Is X GDPR compliant?",
      "How secure is X?",
      "Data privacy at X",
      "Certifications of X",
    ],
  },
  howto: {
    intent: "Users have a concrete problem or goal and want step-by-step guidance",
    patterns: [
      "How do I set up X?",
      "How to fix X?",
      "Steps for X",
      "Best practices for X",
    ],
  },
  integrations: {
    intent:
      "Users want to know about integrations, APIs, and ecosystem compatibility",
    patterns: [
      "X integration with Y",
      "Does X have an API?",
      "Is X compatible with Y?",
      "Plugins for X",
    ],
  },
};

/**
 * Build a text block describing selected subcategories for the AI system prompt.
 */
export function buildCategoryPromptContext(
  subcategoryIds: string[]
): string {
  return subcategoryIds
    .filter((id) => SUBCATEGORY_AI_CONTEXT[id])
    .map((id) => {
      const ctx = SUBCATEGORY_AI_CONTEXT[id];
      const label = id.replace(/_/g, " ");
      const examples = ctx.patterns.map((p) => `"${p}"`).join(", ");
      return `- ${label}: ${ctx.intent}. Example query patterns: ${examples}`;
    })
    .join("\n");
}
