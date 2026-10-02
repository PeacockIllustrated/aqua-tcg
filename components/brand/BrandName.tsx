"use client";

import { brand } from "@/lib/brand";
import { useCustomBrand } from "@/lib/brand-custom";

function split(full: string): [string, string] {
  const i = full.lastIndexOf(" ");
  return i === -1 ? [full, ""] : [full.slice(0, i), full.slice(i + 1)];
}

/**
 * The shop name, honouring a visitor's "Pick your colours" override.
 * `part` picks the full name or one half of the two-tone wordmark.
 */
export function BrandName({ part = "full" }: { part?: "full" | "first" | "last" }) {
  const custom = useCustomBrand();
  const name = custom?.name?.trim() || brand.name;
  if (part === "full") return <>{name}</>;
  const [first, last] = split(name);
  return <>{part === "first" ? first : last}</>;
}

/** Two-tone wordmark: first words in the current colour, last word in
 *  `lastClassName`. Line break between them when `stacked`. */
export function BrandWordmark({
  lastClassName,
  stacked = false,
}: {
  lastClassName: string;
  stacked?: boolean;
}) {
  const custom = useCustomBrand();
  const [first, last] = split(custom?.name?.trim() || brand.name);
  return (
    <>
      {first}
      {last ? (
        <>
          {stacked ? <br /> : " "}
          <span className={lastClassName}>{last}</span>
        </>
      ) : null}
    </>
  );
}
