"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import {
  ACTIVATION_TYPES,
  BUDGET_LABELS,
  DEFAULT_PROGRAM_SETTINGS,
  METRIC_DISPLAY,
  TARGET_MODES,
  TARGET_SCOPE_LABELS,
  type ActivationType,
  type ActivationTypeSettings,
  type MetricKey,
  type ProgramSettings,
} from "@/lib/settings";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function parseNumber(value: string): number {
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

interface SettingsFieldProps {
  label: string;
  hint?: string;
  value: number;
  prefix?: string;
  onChange: (value: number) => void;
}

function SettingsField({ label, hint, value, prefix, onChange }: SettingsFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#3B2314]">{label}</label>
      {hint && <p className="mb-1.5 text-[10px] text-[#4A2C1A]/50">{hint}</p>}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4A2C1A]/50">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={formatNumber(value)}
          onChange={(e) => onChange(parseNumber(e.target.value))}
          className={`h-9 w-full rounded-md border border-[#4A2C1A]/15 bg-white text-sm text-[#3B2314] focus:border-[#4A2C1A]/40 focus:outline-none focus:ring-2 focus:ring-[#4A2C1A]/10 ${
            prefix ? "pl-7 pr-3" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}

interface ActivationSettingsCardProps {
  type: ActivationType;
  settings: ActivationTypeSettings;
  onChange: (settings: ActivationTypeSettings) => void;
}

function ActivationSettingsCard({
  type,
  settings,
  onChange,
}: ActivationSettingsCardProps) {
  function updateField<K extends keyof ActivationTypeSettings>(
    field: K,
    value: ActivationTypeSettings[K],
  ) {
    onChange({ ...settings, [field]: value });
  }

  const scopeLabel = TARGET_SCOPE_LABELS[TARGET_MODES[type]];
  const budgetHint =
    type === "Digital Sampling"
      ? "Total program budget for all Digital Sampling activations"
      : "Target average cost per activation";

  return (
    <div className="rounded-lg border border-[#4A2C1A]/8 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-bold text-[#3B2314]">{type}</h3>
      <p className="mb-4 text-xs text-[#4A2C1A]/50">
        {type === "Digital Sampling" ? "Off Premise" : "On Premise"} · {scopeLabel} targets
      </p>

      <div className="grid grid-cols-2 gap-4">
        {(["reach", "impact", "result"] as MetricKey[]).map((metric) => {
          const display = METRIC_DISPLAY[type][metric];
          const label = display.label;

          return (
            <SettingsField
              key={metric}
              label={label}
              hint={display.hint}
              value={settings[metric]}
              prefix={display.format === "currency" ? "$" : undefined}
              onChange={(v) => updateField(metric, v)}
            />
          );
        })}
        <SettingsField
          label={BUDGET_LABELS[type]}
          hint={budgetHint}
          value={settings.budget}
          prefix="$"
          onChange={(v) => updateField("budget", v)}
        />
      </div>
    </div>
  );
}

export function SettingsForm() {
  const [settings, setSettings] = useState<ProgramSettings>(DEFAULT_PROGRAM_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.settings) setSettings(json.settings);
      })
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  function updateTypeSettings(type: ActivationType, config: ActivationTypeSettings) {
    setSettings((prev) => ({
      ...prev,
      activationTypes: { ...prev.activationTypes, [type]: config },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to save settings.");
        return;
      }

      if (json.settings) setSettings(json.settings);
      setMessage("Settings saved successfully.");
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#4A2C1A]/60">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#3B2314]">Program Targets & Budget</h2>
          <p className="mt-1 text-sm text-[#4A2C1A]/60">
            HTC and Brand Experience targets are per activation. Digital Sampling targets
            are total program. Budget uses total cost for Digital Sampling and average
            activation cost for HTC and Brand Experience.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex shrink-0 items-center gap-2 rounded-md bg-[#4A2C1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#3B2314] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-5">
        {ACTIVATION_TYPES.map((type) => (
          <ActivationSettingsCard
            key={type}
            type={type}
            settings={settings.activationTypes[type]}
            onChange={(config) => updateTypeSettings(type, config)}
          />
        ))}
      </div>
    </div>
  );
}
