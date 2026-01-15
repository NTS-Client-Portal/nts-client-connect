import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { FileText, Plus, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react";

export default async function QuotesPage() {
  const session = await auth();
  if (!session) return null;

  const isNtsUser = session.user.userType === "nts_user";
  const userId = session.user.id;

  // Get quotes based on user type
  const userQuotes = isNtsUser
    ? await db
        .select()
        .from(quotes)
        .orderBy(desc(quotes.createdAt))
        .limit(50)
    : await db
        .select()
        .from(quotes)
        .where(eq(quotes.shipperId, userId))
        .orderBy(desc(quotes.createdAt));

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    priced: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const statusIcons = {
    pending: Clock,
    priced: DollarSign,
    accepted: CheckCircle,
    rejected: XCircle,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quotes</h1>
          <p className="text-slate-600 mt-1">
            {isNtsUser
              ? "Manage and price quote requests"
              : "Request quotes and view pricing"}
          </p>
        </div>
        {!isNtsUser && (
          <Link
            href="/dashboard/quotes/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Request Quote</span>
          </Link>
        )}
      </div>

      {userQuotes.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No quotes yet
          </h3>
          <p className="text-slate-600 mb-6">
            {isNtsUser
              ? "Waiting for shippers to request quotes"
              : "Get started by requesting your first quote"}
          </p>
          {!isNtsUser && (
            <Link
              href="/dashboard/quotes/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Request Quote</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Freight Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {userQuotes.map((quote) => {
                  const StatusIcon = statusIcons[quote.status || "pending"];
                  return (
                    <tr
                      key={quote.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/dashboard/quotes/${quote.id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        #{quote.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {quote.originCity}, {quote.originState} →{" "}
                        {quote.destinationCity}, {quote.destinationState}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {quote.freightType || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {quote.price
                          ? `$${Number(quote.price).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[quote.status || "pending"]
                          }`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span className="capitalize">
                            {quote.status || "pending"}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
