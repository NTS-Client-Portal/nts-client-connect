import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav session={session} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
