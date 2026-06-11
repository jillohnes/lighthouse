"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  Newspaper,
  Settings,
  Sparkles,
  Store,
  Target,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "On Premise", icon: Building2, href: "/on-premise" },
  { label: "Content", icon: Newspaper, href: "/content" },
  { label: "Off Premise", icon: Store, href: "#" },
  { label: "Business Impact", icon: TrendingUp, href: "/business-impact" },
  { label: "Targets & Pacing", icon: Target, href: "#" },
  { label: "Reports", icon: FileText, href: "#" },
  { label: "AI Insights", icon: Sparkles, href: "#" },
  { label: "Alerts", icon: Bell, href: "#" },
  { label: "Setting", icon: Settings, href: "/settings" },
];

interface SidebarProps {
  activeNav: string;
}

export function Sidebar({ activeNav }: SidebarProps) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-brand-darker text-white shadow-lg">
      <div className="border-b border-white/10 px-5 py-5">
        <h1 className="text-sm font-bold tracking-[0.15em]">PROOF & POUR</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.label === activeNav;
            const className = `flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-brown font-medium text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`;

            return (
              <li key={item.label}>
                {item.href === "#" ? (
                  <button type="button" className={className}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </button>
                ) : (
                  <Link href={item.href} className={className}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
