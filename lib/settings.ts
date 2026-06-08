export const ACTIVATION_TYPES = [
  "HTC",
  "Brand Experience",
  "Digital Sampling",
] as const;

export type ActivationType = (typeof ACTIVATION_TYPES)[number];

export type BudgetMode = "avg_cost" | "total_cost";
export type TargetMode = "per_activation" | "total_program";

export interface ActivationTypeSettings {
  reach: number;
  impact: number;
  result: number;
  budget: number;
}

export interface ProgramSettings {
  activationTypes: Record<ActivationType, ActivationTypeSettings>;
}

export const TARGET_MODES: Record<ActivationType, TargetMode> = {
  HTC: "per_activation",
  "Brand Experience": "per_activation",
  "Digital Sampling": "total_program",
};

export const BUDGET_MODES: Record<ActivationType, BudgetMode> = {
  HTC: "avg_cost",
  "Brand Experience": "avg_cost",
  "Digital Sampling": "total_cost",
};

export const BUDGET_LABELS: Record<ActivationType, string> = {
  HTC: "Avg Activation Cost",
  "Brand Experience": "Avg Activation Cost",
  "Digital Sampling": "Total Cost Budget",
};

export const TARGET_SCOPE_LABELS: Record<TargetMode, string> = {
  per_activation: "Per Activation",
  total_program: "Total Program",
};

export type MetricKey = "reach" | "impact" | "result";
export type MetricFormat = "number" | "currency" | "compact";

export interface MetricDisplayConfig {
  label: string;
  hint: string;
  format: MetricFormat;
}

export const METRIC_DISPLAY: Record<
  ActivationType,
  Record<MetricKey, MetricDisplayConfig>
> = {
  HTC: {
    reach: {
      label: "Reach (People Engaged)",
      hint: "Target people engaged per activation",
      format: "number",
    },
    impact: {
      label: "Impact (People Sampled)",
      hint: "Target people sampled per activation",
      format: "number",
    },
    result: {
      label: "Results (Sales During Activation)",
      hint: "Target sales per activation in dollars",
      format: "currency",
    },
  },
  "Brand Experience": {
    reach: {
      label: "Reach (People Engaged)",
      hint: "Target people engaged per activation",
      format: "number",
    },
    impact: {
      label: "Impact (People Sampled)",
      hint: "Target people sampled per activation",
      format: "number",
    },
    result: {
      label: "Results (Sales During Activation)",
      hint: "Target sales per activation in dollars",
      format: "currency",
    },
  },
  "Digital Sampling": {
    reach: {
      label: "Reach (QR Code Scans)",
      hint: "Total program QR code scans goal",
      format: "number",
    },
    impact: {
      label: "Impact (Redemptions)",
      hint: "Total program redemptions goal",
      format: "number",
    },
    result: {
      label: "Results (Sales)",
      hint: "Total program sales goal in dollars",
      format: "currency",
    },
  },
};

export function getMetricLabel(
  type: ActivationType,
  metric: MetricKey,
  includeScope = false,
): string {
  const display = METRIC_DISPLAY[type][metric];
  if (!includeScope) return display.label;

  const scope = TARGET_SCOPE_LABELS[TARGET_MODES[type]];
  return `${display.label} (${scope})`;
}

export const DEFAULT_PROGRAM_SETTINGS: ProgramSettings = {
  activationTypes: {
    HTC: { reach: 1_200, impact: 350, result: 150_000, budget: 2_500 },
    "Brand Experience": {
      reach: 1_800,
      impact: 450,
      result: 220_000,
      budget: 4_500,
    },
    "Digital Sampling": {
      reach: 1_500_000,
      impact: 500_000,
      result: 1_500_000,
      budget: 500_000,
    },
  },
};

function slugify(type: ActivationType): string {
  return type.toLowerCase().replace(/\s+/g, "_");
}

export function settingsToRows(
  settings: ProgramSettings,
): { metric_key: string; target_value: number; label: string }[] {
  const rows: { metric_key: string; target_value: number; label: string }[] = [];

  for (const type of ACTIVATION_TYPES) {
    const slug = slugify(type);
    const config = settings.activationTypes[type];
    const scope = TARGET_SCOPE_LABELS[TARGET_MODES[type]];
    rows.push(
      {
        metric_key: `${slug}_reach`,
        target_value: config.reach,
        label: `${getMetricLabel(type, "reach")} (${scope})`,
      },
      {
        metric_key: `${slug}_impact`,
        target_value: config.impact,
        label: `${getMetricLabel(type, "impact")} (${scope})`,
      },
      {
        metric_key: `${slug}_result`,
        target_value: config.result,
        label: `${getMetricLabel(type, "result")} (${scope})`,
      },
      {
        metric_key: `${slug}_budget`,
        target_value: config.budget,
        label: BUDGET_LABELS[type],
      },
    );
  }

  return rows;
}

export function rowsToSettings(
  rows: { metric_key: string; target_value: number }[],
): ProgramSettings {
  const settings = structuredClone(DEFAULT_PROGRAM_SETTINGS);
  const lookup = new Map(rows.map((r) => [r.metric_key, Number(r.target_value)]));

  for (const type of ACTIVATION_TYPES) {
    const slug = slugify(type);
    const reach = lookup.get(`${slug}_reach`);
    const impact = lookup.get(`${slug}_impact`);
    const result = lookup.get(`${slug}_result`);
    const budget = lookup.get(`${slug}_budget`);

    if (reach !== undefined) settings.activationTypes[type].reach = reach;
    if (impact !== undefined) settings.activationTypes[type].impact = impact;
    if (result !== undefined) settings.activationTypes[type].result = result;
    if (budget !== undefined) settings.activationTypes[type].budget = budget;
  }

  return settings;
}

export function getApplicableTypes(
  selectedTypes: string[],
): ActivationType[] {
  if (selectedTypes.length === 0) return [...ACTIVATION_TYPES];
  return ACTIVATION_TYPES.filter((type) => selectedTypes.includes(type));
}
