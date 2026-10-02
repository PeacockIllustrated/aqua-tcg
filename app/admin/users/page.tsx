import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { listAdminUsers } from "@/app/_actions/admin";
import { formatGBP } from "@/lib/mock/mock-offer";

export const metadata = {
  title: "Users",
};

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminUsersPage() {
  const users = await listAdminUsers();
  const admins = users.filter((u) => u.role === "admin");
  const sellers = users.filter((u) => u.role === "seller");
  const totalCommitted = users.reduce((s, u) => s + u.total_offered, 0);

  return (
    <div className="px-4 md:px-6 py-6 max-w-[1400px] mx-auto flex flex-col gap-6">
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin" },
          { label: "People" },
          { label: "Users" },
        ]}
        title="Users"
        kicker={{ label: "ACCOUNTS", tone: "tint" }}
        subtitle="Everyone with an account — buyers, sellers and staff — with their buylist history at a glance."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Accounts" value={users.length} />
        <StatCard label="Customers" value={sellers.length} />
        <StatCard label="Staff" value={admins.length} />
        <StatCard label="Lifetime buylist £" value={formatGBP(totalCommitted)} />
      </section>

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH className="text-right">Submissions</TH>
            <TH className="text-right">Lifetime £</TH>
            <TH>Last submission</TH>
            <TH>Joined</TH>
          </TR>
        </THead>
        <TBody>
          {users.length === 0 ? (
            <TR>
              <TD colSpan={7} className="text-center text-secondary py-6">
                No accounts yet. Customers appear here as soon as they sign up.
              </TD>
            </TR>
          ) : (
            users.map((u) => (
              <TR key={u.id} id={u.id} className="target:bg-highlight/30">
                <TD>
                  <div className="font-display text-[13px] tracking-tight">
                    {u.full_name ?? "—"}
                  </div>
                  {u.postcode ? (
                    <div className="text-[11px] text-muted">
                      {u.postcode}, {u.country ?? "GB"}
                    </div>
                  ) : null}
                </TD>
                <TD className="text-[12px] break-all">{u.email}</TD>
                <TD>
                  <span
                    className={`border-2 border-ink px-1.5 py-0.5 font-display text-[9px] tracking-wider rounded-sm ${
                      u.role === "admin"
                        ? "bg-brand text-ink"
                        : "bg-paper-strong text-ink"
                    }`}
                  >
                    {u.role === "admin" ? "STAFF" : "CUSTOMER"}
                  </span>
                </TD>
                <TD className="text-right tabular-nums font-display">
                  {u.submission_count}
                </TD>
                <TD className="text-right tabular-nums font-display">
                  {formatGBP(u.total_offered)}
                </TD>
                <TD className="text-[11px] text-muted tabular-nums font-mono">
                  {formatDateTime(u.latest_submission_at)}
                </TD>
                <TD className="text-[11px] text-muted tabular-nums font-mono">
                  {formatDate(u.created_at)}
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>

      <p className="text-[11px] text-muted font-display tracking-wider">
        Need to give a colleague admin access? Ask your site administrator to
        upgrade their account to staff.
      </p>
    </div>
  );
}

