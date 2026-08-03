import { SellerNav } from "@/components/cardbuy/SellerNav";
import { PageFooter } from "@/components/wireframe/PageFooter";

/**
 * Shell for the platform routes (shop, buylist, binder, submissions).
 *
 * These are no longer linked from the public site — `/` is the
 * marketing one-pager — but they remain fully functional at their own
 * URLs, with their own nav and footer.
 */
export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SellerNav />
      {children}
      <PageFooter />
    </>
  );
}
