"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Ship,
  Anchor,
  TrendingUp,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { signOutAction } from "@/app/dashboard/actions";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/boats", icon: Ship, label: "Boats" },
  { href: "/dashboard/trips", icon: Anchor, label: "Trips" },
  { href: "/dashboard/revenue", icon: TrendingUp, label: "Revenue" },
  { href: "/dashboard/guests", icon: Users, label: "Guests" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
] as const;

interface SidebarProps {
  operatorName: string;
  operatorEmail: string;
}

export function Sidebar({ operatorName, operatorEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-[240px] md:fixed md:inset-y-0 bg-white border-r border-border z-40">
      {/* Logo */}
      <div className="px-page py-section">
        <div className="flex items-center gap-2">
          <span className="text-[20px] text-navy">⚓</span>
          <span className="text-[16px] font-bold text-navy">BoatCheckin</span>
        </div>
        <p className="text-caption text-grey-text mt-micro truncate">
          {operatorName}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-tight mt-tight">
        <ul className="space-y-[2px]">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-standard px-page py-[10px] rounded-[8px] text-[15px] transition-colors",
                    isActive
                      ? "bg-light-blue text-navy font-medium"
                      : "text-grey-text hover:bg-off-white"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: operator info + sign out */}
      <div className="px-page py-section border-t border-border">
        <p className="text-label text-dark-text truncate">{operatorName}</p>
        <p className="text-caption text-grey-text truncate">{operatorEmail}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-tight mt-standard text-micro text-grey-text hover:text-error-text transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
