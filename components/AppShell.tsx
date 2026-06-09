import { Sidebar } from "@/components/dashboard/Sidebar";

interface AppShellProps {
  activeNav: string;
  children: React.ReactNode;
}

export function AppShell({ activeNav, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar activeNav={activeNav} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
