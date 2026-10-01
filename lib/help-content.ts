/**
 * Customer help / policy pages (/help/[slug]). Template copy — each
 * shop reviews and edits this before launch. Legal pages in particular
 * are a starting point, not legal advice.
 */
export type HelpPage = {
  title: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

export const HELP_PAGES: Record<string, HelpPage> = {
  selling: {
    title: "How selling works",
    intro:
      "Sell your Pokémon cards to us in four steps. You see the offer before you send anything.",
    sections: [
      {
        heading: "1 · Get an offer",
        body: [
          "Search for each card, pick its condition and add it to your sale. The offer you see is what we'll pay if the card arrives in the condition you picked.",
        ],
      },
      {
        heading: "2 · Send your cards",
        body: [
          "Submit your sale to get a reference number. Pack each card in a sleeve and toploader, write the reference on a slip of paper, and post it to the address on your confirmation page. Use a tracked service for anything over £50.",
        ],
      },
      {
        heading: "3 · We check them",
        body: [
          "We grade every card against the condition you picked, usually within two working days of arrival. If a card comes in below that condition, we'll offer a revised price, and you can accept it or have that card sent back free.",
        ],
      },
      {
        heading: "4 · Get paid",
        body: [
          "Once you approve the final total, we pay out by PayPal, usually within three days of your cards arriving.",
        ],
      },
    ],
  },
  shipping: {
    title: "Shipping & returns",
    intro: "How we send orders out, and what to do if something isn't right.",
    sections: [
      {
        heading: "Dispatch",
        body: [
          "Orders are dispatched within one working day. Every single is sleeved and toploadered, and slabs are bubble-wrapped.",
        ],
      },
      {
        heading: "Delivery",
        body: [
          "Royal Mail Tracked 48 as standard. Free tracked delivery on orders over £250. Special Delivery is available at checkout for high-value orders.",
        ],
      },
      {
        heading: "Returns",
        body: [
          "If a card isn't as described, tell us within 14 days of delivery and we'll refund it in full, including return postage. Sealed product can be returned unopened within 14 days.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    intro:
      "Template terms. The shop should review these, and ideally have them checked, before going live.",
    sections: [
      {
        heading: "Who we are",
        body: [
          "This site is run by the shop named at the top of the page. We buy cards from, and sell cards to, customers in the UK.",
        ],
      },
      {
        heading: "Offers to buy your cards",
        body: [
          "Offers are based on current market prices and are valid for 14 days from submission. The final amount depends on our condition check when the cards arrive.",
        ],
      },
      {
        heading: "Orders",
        body: [
          "Every listing is a single physical item. An order is confirmed once payment clears. If an item can't be supplied, we'll refund it in full.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy",
    intro:
      "Template privacy notice. The shop should review this before going live.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Your name, email, postal address and payout details, used to process your orders and sales. If you use the binder, we also store your collection and wishlist.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "From Account & privacy you can choose whether we use your wishlist to source cards for you, and you can permanently delete your account and data at any time.",
        ],
      },
    ],
  },
};
