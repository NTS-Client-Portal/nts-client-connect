"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import {
  FileText,
  Package,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface DashboardNavProps {
  session: Session;
}

export default function DashboardNav({ session }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isNtsUser = session.user.userType === "nts_user";
  const isAdmin = session.user.role === "admin";

  const shipperLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/quotes", label: "Quotes", icon: FileText },
    { href: "/dashboard/orders", label: "Orders", icon: Package },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const brokerLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/dashboard/quotes", label: "Quotes", icon: FileText },
    { href: "/dashboard/orders", label: "Orders", icon: Package },
    ...(isAdmin
      ? [{ href: "/dashboard/companies", label: "Companies", icon: Building2 }]
      : []),
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const links = isNtsUser ? brokerLinks : shipperLinks;

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">
              NTS Logistics
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-500">
                {isNtsUser
                  ? isAdmin
                    ? "Admin"
                    : "Broker"
                  : "Shipper"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-50"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="px-4 mb-3">
                <p className="text-sm font-medium text-slate-900">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-500">
                  {isNtsUser
                    ? isAdmin
                      ? "Admin"
                      : "Broker"
                    : "Shipper"}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center space-x-2 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
