/**
 * The three ways to deal with Aqua TCG, as pop-art blocks.
 *
 * Every panel is static — no forms, no instant-offer flow. The public
 * site's job is to explain the proposition and get people through the
 * shop door, not to run a transaction.
 */

const PANELS = [
  {
    key: "trade.buy_body",
    kicker: "Buy",
    title: "Cards picked by collectors.",
    bg: "bg-wave",
  },
  {
    key: "trade.sell_body",
    kicker: "Sell",
    title: "Bring it in, get an offer.",
    bg: "bg-sun",
  },
  {
    key: "trade.trade_body",
    kicker: "Trade",
    title: "Swap what you're done with.",
    bg: "bg-paper-strong",
  },
] as const;

export function TradeTriptych({
  content,
}: {
  content: Record<string, string>;
}) {
  return (
    <section
      id="trade"
      className="bg-paper scroll-mt-24 border-b-[3px] border-ink"
    >
      <div className="max-w-[1300px] mx-auto px-5 md:px-6 py-12 md:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-3 max-w-[62ch]">
          <span className="bg-ink text-paper-strong px-2 py-1 w-fit font-display text-[10px] tracking-wider">
            Buy · sell · trade
          </span>
          <h2 className="font-display text-[30px] sm:text-[40px] md:text-[52px] leading-[0.95] tracking-tight">
            Priced off live eBay UK data.
          </h2>
          <p className="text-[14px] md:text-[15px] text-secondary">
            {content["trade.intro"]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PANELS.map((panel) => (
            <div
              key={panel.key}
              className={`pop-block ${panel.bg} rounded-lg p-5 md:p-6 flex flex-col gap-3`}
            >
              <span className="bg-ink text-paper-strong px-2 py-1 w-fit font-display text-[10px] tracking-wider">
                {panel.kicker}
              </span>
              <h3 className="font-display text-[22px] md:text-[26px] leading-[0.98] tracking-tight">
                {panel.title}
              </h3>
              <p className="text-[13px] md:text-[14px] text-secondary">
                {content[panel.key]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
