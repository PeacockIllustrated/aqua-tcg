import { DevBanner } from "@/components/wireframe/DevBanner";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import { AdminSidebar, type AdminNavCounts } from "@/components/admin/AdminSidebar";
import { getAdminSubmissionStats, isAdminPreview } from "@/app/_actions/admin";
import { listAdminOrders } from "@/app/_actions/admin-shop";

// Admin pages always reflect the current viewer (admin vs preview) and
// live queue counts — never prerender them.
export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

async function getNavCounts(): Promise<AdminNavCounts> {
  try {
    const [stats, orders] = await Promise.all([
      getAdminSubmissionStats(),
      listAdminOrders("all"),
    ]);
    const toPack = orders.filter(
      (o) => o.status === "paid" || o.status === "packing",
    ).length;
    const pendingPayment = orders.filter(
      (o) => o.status === "pending_payment",
    ).length;
    return {
      awaitingCards: stats.awaitingCards,
      toPack,
      pendingPayment,
    };
  } catch {
    return { awaitingCards: 0, toPack: 0, pendingPayment: 0 };
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [counts, preview] = await Promise.all([getNavCounts(), isAdminPreview()]);
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar counts={counts} />
      <div className="flex-1 min-w-0 flex flex-col">
        {preview ? (
          // Preview: the banner explains the sample data; the signed-in
          // admin strip would be misleading, so it's hidden.
          <PreviewBanner area="admin" next="/admin" />
        ) : (
          <div className="px-3 md:px-5 pt-3">
            <DevBanner />
          </div>
        )}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
