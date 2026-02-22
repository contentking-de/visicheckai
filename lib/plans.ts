import type { PlanId } from "@/lib/schema";

export const TRIAL_PROMPTS_PER_MONTH = 25;

export type Plan = {
  id: PlanId;
  stripePriceId: string;
  priceMonthly: number;
  promptsPerMonth: number;
  maxTeamMembers: number | null; // null = unlimited
};

/**
 * Stripe Price IDs need to be created in the Stripe Dashboard and placed here.
 * Use `stripe products create` and `stripe prices create` to set them up.
 */
export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    stripePriceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
    priceMonthly: 69,
    promptsPerMonth: 50,
    maxTeamMembers: 3,
  },
  team: {
    id: "team",
    stripePriceId: process.env.STRIPE_PRICE_TEAM || "price_team",
    priceMonthly: 99,
    promptsPerMonth: 100,
    maxTeamMembers: null,
  },
  professional: {
    id: "professional",
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL || "price_professional",
    priceMonthly: 249,
    promptsPerMonth: 300,
    maxTeamMembers: null,
  },
};

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return Object.values(PLANS).find((p) => p.stripePriceId === priceId);
}
