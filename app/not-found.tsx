import { LinkButton } from "@/components/ui/Form";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display text-[clamp(80px,18vw,180px)] leading-none tracking-tight text-ink">
        404
      </p>
      <h1 className="font-display uppercase tracking-wider text-2xl mt-4 text-ink">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted">
        That page has wandered off. Try the shopfront, sell your cards,
        or head home.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <LinkButton href="/" variant="primary">Home</LinkButton>
        <LinkButton href="/shop" variant="secondary">Browse shop</LinkButton>
        <LinkButton href="/submission" variant="secondary">Sell cards</LinkButton>
      </div>
    </section>
  );
}
