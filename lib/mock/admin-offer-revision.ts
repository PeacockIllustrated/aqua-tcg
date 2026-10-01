import type { ConditionMultipliers } from "@/lib/mock/types";

type Condition = keyof ConditionMultipliers;

/**
 * Re-price a buylist line when the shop verifies a different condition
 * than the seller declared. The declared offer already carries the
 * market price, FX and margins from submission time, so the revision
 * only swaps the condition multiplier:
 *
 *   revised = declaredPer × mult[verified] / mult[declared]
 *
 * Pure and client-safe (the admin review screen previews it live; the
 * server action recomputes it before saving).
 */
export function revisedOfferPer(
  declaredPer: number,
  declared: Condition,
  verified: Condition,
  multipliers: ConditionMultipliers,
): number {
  const from = multipliers[declared] ?? 1;
  const to = multipliers[verified] ?? from;
  if (from <= 0) return declaredPer;
  return Math.round(((declaredPer * to) / from) * 100) / 100;
}
