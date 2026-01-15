import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes, orders, shippers, companies } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { FileText, Package, Clock, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const isNtsUser = session.user.userType === "nts_user";
  const userId = session.user.id;

  let stats;

  if (isNtsUser) {
    // Broker stats: get assigned companies
    const assignedCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.assignedBrokerId, userId));

    const companyIds = assignedCompanies.map((c) => c.id);

    // Get quote counts
    const [pendingQuotesCount] = await db
      .select({ count: count() })
      .from(quotes)
      .where(
        and(
          eq(quotes.status, "pending"),
          companyIds.length > 0
            ? // @ts-ignore
              quotes.companyId.in(companyIds)
            : eq(quotes.companyId, "none")
        )
      );

    const [activeOrdersCount] = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.status, "in_transit"),
          companyIds.length > 0
            ? // @ts-ignore
              orders.companyId.in(companyIds)
            : eq(orders.companyId, "none")
        )
      );

    stats = {
      assignedCompanies: assignedCompanies.length,
      pendingQuotes: pendingQuotesCount?.count || 0,
      activeOrders: activeOrdersCount?.count || 0,
    };
  } else {
    // Shipper stats
    const [pendingQuotesCount] = await db
      .select({ count: count() })
      .from(quotes)
      .where(
        and(eq(quotes.shipperId, userId), eq(quotes.status, "pending"))
      );

    const [pricedQuotesCount] = await db
      .select({ count: count() })
      .from(quotes)
      .where(and(eq(quotes.shipperId, userId), eq(quotes.status, "priced")));

    const [activeOrdersCount] = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(eq(orders.shipperId, userId), eq(orders.status, "in_transit"))
      );

    stats = {
      pendingQuotes: pendingQuotesCount?.count || 0,
      pricedQuotes: pricedQuotesCount?.count || 0,
      activeOrders: activeOrdersCount?.count || 0,
    };
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {session.user.name?.split(" ")[0]}!
        </h1>
        <p className="text-slate-600 mt-2">
          {isNtsUser
            ? "Manage your assigned companies and quotes"
            : "Track your shipments and request new quotes"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isNtsUser ? (
          <>
            <StatCard
              icon={Building2}
              label="Assigned Companies"
              value={stats.assignedCompanies}
              color="blue"
            />
            <StatCard
              icon={Clock}
              label="Pending Quotes"
              value={stats.pendingQuotes}
              color="yellow"
            />
            <StatCard
              icon={Package}
              label="Active Orders"
              value={stats.activeOrders}
              color="green"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={Clock}
              label="Pending Quotes"
              value={stats.pendingQuotes}
              color="yellow"
            />
            <StatCard
              icon={FileText}
              label="Priced Quotes"
              value={stats.pricedQuotes}
              color="blue"
            />
            <StatCard
              icon={Package}
              label="Active Orders"
              value={stats.activeOrders}
              color="green"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isNtsUser ? (
            <>
              <ActionButton
                href="/dashboard/quotes"
                label="View Pending Quotes"
                description="Review and price quote requests"
              />
              <ActionButton
                href="/dashboard/orders"
                label="Manage Orders"
                description="Track and update order status"
              />
            </>
          ) : (
            <>
              <ActionButton
                href="/dashboard/quotes/new"
                label="Request a Quote"
                description="Get pricing for your shipment"
              />
              <ActionButton
                href="/dashboard/orders"
                label="Track Orders"
                description="View your active shipments"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: "blue" | "yellow" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="block p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
    >
      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 mb-1">
        {label}
      </h3>
      <p className="text-sm text-slate-600">{description}</p>
    </a>
  );
}

// Need to import Building2
import { Building2 } from "lucide-react";
