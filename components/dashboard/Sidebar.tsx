"use client";

import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  Database,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Sparkles,
  Store,
  Target,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "On Premise", icon: Building2, active: false },
  { label: "Off Premise", icon: Store, active: false },
  { label: "Targets & Pacing", icon: Target, active: false },
  { label: "Performance Drilldown", icon: TrendingUp, active: false },
  { label: "Historical Results", icon: BarChart3, active: false },
  { label: "AI Insights", icon: Sparkles, active: false, badge: "New" },
  { label: "Reports", icon: FileText, active: false },
  { label: "Data Explorer", icon: Database, active: false },
  { label: "Alerts", icon: Bell, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function Sidebar() {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-[#3B2314] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <h1 className="text-sm font-bold tracking-[0.15em]">PROOF & POUR</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  item.active
                    ? "bg-[#5C3D2E] font-medium text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-[#B5455C] px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/50">
          Permissions
        </p>
        <div className="space-y-2">
          {[
            { label: "View As Role", value: "Market Manager" },
            { label: "Market", value: "All" },
            { label: "Channel", value: "All" },
          ].map((field) => (
            <div key={field.label}>
              <label className="mb-1 block text-[10px] text-white/50">{field.label}</label>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded border border-white/20 bg-white/5 px-2 py-1.5 text-xs text-white/80"
              >
                {field.value}
                <ChevronDown className="h-3 w-3 text-white/50" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-white/40">
          <span>Data refreshed Jun 1, 2024 8:30 AM</span>
          <RefreshCw className="h-3 w-3" />
        </div>
      </div>
    </aside>
  );
}
