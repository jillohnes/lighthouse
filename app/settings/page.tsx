import { AppShell } from "@/components/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <AppShell activeNav="Settings">
      <header className="shrink-0 border-b border-[#4A2C1A]/10 bg-[#F5F0E8] px-6 py-4">
        <h2 className="text-xl font-bold text-[#3B2314]">Settings</h2>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <SettingsForm />
      </main>
    </AppShell>
  );
}
