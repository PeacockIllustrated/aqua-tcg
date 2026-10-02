/**
 * Energy-type chip. Uses each type's own colour (not the shop's brand
 * colours) so it reads correctly under any white-label theme, and the
 * official-style type icon where we ship one in public/icons/types.
 *
 * Used for type badges on `/card/[id]` (md: icon + name) and for
 * attack energy-cost pips (sm: icon only).
 */

const TYPE_STYLE: Record<string, string> = {
  Fire: "bg-[#ef6a3a] text-paper-strong",
  Water: "bg-[#4a9be0] text-paper-strong",
  Grass: "bg-[#5bbf63] text-ink",
  Lightning: "bg-[#f5c832] text-ink",
  Psychic: "bg-[#b06ad8] text-paper-strong",
  Fighting: "bg-[#c7773a] text-paper-strong",
  Darkness: "bg-[#2f3a44] text-paper-strong",
  Metal: "bg-[#9aa3ad] text-ink",
  Dragon: "bg-[#c6a43a] text-ink",
  Fairy: "bg-[#ec8fc4] text-ink",
  Colorless: "bg-paper-strong text-ink",
};

const ICON: Record<string, string> = {
  Fire: "/icons/types/fire.svg",
  Water: "/icons/types/water.svg",
  Grass: "/icons/types/grass.svg",
  Lightning: "/icons/types/lightning.svg",
  Psychic: "/icons/types/psychic.svg",
  Fighting: "/icons/types/fighting.svg",
  Colorless: "/icons/types/colorless.svg",
};

type Props = {
  type: string;
  size?: "sm" | "md";
  className?: string;
};

export function EnergyChip({ type, size = "sm", className = "" }: Props) {
  const icon = ICON[type];
  if (size === "sm") {
    // Cost pip: the icon alone, or a coloured disc with the initial.
    return icon ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={type}
        title={type}
        className={`w-5 h-5 rounded-full border-2 border-ink ${className}`.trim()}
      />
    ) : (
      <span
        title={type}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-ink font-display text-[9px] ${TYPE_STYLE[type] ?? "bg-paper-strong text-ink"} ${className}`.trim()}
      >
        <span aria-hidden="true">{type.charAt(0)}</span>
        <span className="sr-only">{type}</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 border-2 border-ink rounded-full font-display text-[11px] tracking-wider uppercase ${TYPE_STYLE[type] ?? "bg-paper-strong text-ink"} ${className}`.trim()}
    >
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="w-[18px] h-[18px] rounded-full" />
      ) : null}
      {type}
    </span>
  );
}

export function EnergyCostRow({ cost }: { cost?: string[] }) {
  if (!cost || cost.length === 0) {
    return <span className="text-[10px] text-muted font-display tracking-wider">FREE</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {cost.map((t, i) => (
        <EnergyChip key={`${t}-${i}`} type={t} />
      ))}
    </span>
  );
}
