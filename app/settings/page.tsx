import { AppShell } from "@/components/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <AppShell activeNav="Settings">
      <header className="shrink-0 border-b border-brand/10 bg-surface px-6 py-4">
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <SettingsForm />
      </main>
    </AppShell>
  );
}
