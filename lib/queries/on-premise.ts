import {
  decodeActivation,
  loadActivationRowsForDashboard,
  loadFilteredActivationsAsProgramRows,
  type ActivationExcelRecord,
  type DecodedActivation,
} from "@/lib/activation-metrics";
import { buildMarketTrendAnalysis } from "@/lib/on-premise-trends";
import {
  buildActivationBreakdown,
  buildLocationBreakdown,
} from "@/lib/metric-comparison";
import { buildPerformanceDrilldown } from "@/lib/queries/dashboard";
import { getProgramSettings } from "@/lib/queries/settings";
import {
  ACTIVATION_SECTION_TITLES,
  normalizeActivationType,
  type ActivationType,
} from "@/lib/settings";
import type {
  BrandSampleRow,
  DashboardFilters,
  MarketConversionRow,
  OnPremiseData,
  SamplingTypeDetail,
} from "@/lib/types";

const ON_PREMISE_TYPES: ActivationType[] = ["HCT", "Brand Experience"];

function isOnPremiseRecord(record: ActivationExcelRecord): boolean {
  const type = normalizeActivationType(record.activation_type);
  return type === "HCT" || type === "Brand Experience";
}

function filterOnPremiseRecords(
  records: ActivationExcelRecord[],
): ActivationExcelRecord[] {
  return records.filter(isOnPremiseRecord);
}

function filterOnPremiseDecoded(rows: DecodedActivation[]): DecodedActivation[] {
  return rows.filter((row) =>
    ON_PREMISE_TYPES.includes(
      normalizeActivationType(row.activation_type) as ActivationType,
    ),
  );
}

function buildBrandSamples(
  records: ActivationExcelRecord[],
  type: ActivationType,
): BrandSampleRow[] {
  const filtered = records.filter(
    (record) => normalizeActivationType(record.activation_type) === type,
  );
  const byBrand = new Map<
    string,
    { samples: number; reach: number; result: number }
  >();

  for (const record of filtered) {
    const brand = record.product_brand || "Unknown";
    const existing = byBrand.get(brand) ?? { samples: 0, reach: 0, result: 0 };
    existing.samples += record.impact;
    existing.reach += record.reach;
    existing.result += record.result;
    byBrand.set(brand, existing);
  }

  return Array.from(byBrand.entries())
    .map(([brand, data]) => ({
      brand,
      samples: Math.round(data.samples),
      reach: Math.round(data.reach),
      result: Math.round(data.result),
      conversionRate:
        data.samples > 0
          ? Math.round((data.result / data.samples) * 100) / 100
          : 0,
    }))
    .sort((a, b) => b.samples - a.samples);
}

function buildMarketConversion(
  records: ActivationExcelRecord[],
  type: ActivationType,
): MarketConversionRow[] {
  const filtered = records.filter(
    (record) => normalizeActivationType(record.activation_type) === type,
  );
  const byMarket = new Map<string, ActivationExcelRecord[]>();

  for (const record of filtered) {
    const existing = byMarket.get(record.market) ?? [];
    existing.push(record);
    byMarket.set(record.market, existing);
  }

  return Array.from(byMarket.entries())
    .map(([market, marketRecords]) => {
      const samples = marketRecords.reduce((sum, r) => sum + r.impact, 0);
      const result = marketRecords.reduce((sum, r) => sum + r.result, 0);

      const byBrand = new Map<
        string,
        { samples: number; reach: number; result: number }
      >();
      for (const record of marketRecords) {
        const brand = record.product_brand || "Unknown";
        const existing = byBrand.get(brand) ?? {
          samples: 0,
          reach: 0,
          result: 0,
        };
        existing.samples += record.impact;
        existing.reach += record.reach;
        existing.result += record.result;
        byBrand.set(brand, existing);
      }

      const topBrands = Array.from(byBrand.entries())
        .map(([brand, data]) => ({
          brand,
          samples: Math.round(data.samples),
          reach: Math.round(data.reach),
          result: Math.round(data.result),
          conversionRate:
            data.samples > 0
              ? Math.round((data.result / data.samples) * 100) / 100
              : 0,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5);

      return {
        market,
        samples: Math.round(samples),
        result: Math.round(result),
        conversionRate:
          samples > 0 ? Math.round((result / samples) * 100) / 100 : 0,
        topBrands,
      };
    })
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

function buildSamplingTypeDetails(
  records: ActivationExcelRecord[],
): SamplingTypeDetail[] {
  return ON_PREMISE_TYPES.map((type) => ({
    type,
    title: ACTIVATION_SECTION_TITLES[type],
    brandsSampled: buildBrandSamples(records, type),
    marketConversion: buildMarketConversion(records, type),
  }));
}

export async function getOnPremiseData(
  filters: DashboardFilters,
): Promise<OnPremiseData | null> {
  const excelRecords = filterOnPremiseRecords(
    loadActivationRowsForDashboard(filters),
  );

  if (!excelRecords.length) return null;

  const settings = await getProgramSettings();
  const programRows = await loadFilteredActivationsAsProgramRows(filters);
  const decoded = filterOnPremiseDecoded(programRows.map(decodeActivation));

  const activationBreakdown = buildActivationBreakdown(decoded, settings);
  const locationBreakdown = buildLocationBreakdown(decoded, settings);

  return {
    byActivationType: buildPerformanceDrilldown(
      decoded,
      "activation_type",
      activationBreakdown,
      "activation",
      filters,
    ),
    byLocationType: buildPerformanceDrilldown(
      decoded,
      "location_type",
      locationBreakdown,
      "location",
      filters,
    ),
    samplingTypes: buildSamplingTypeDetails(excelRecords),
    trendAnalysis: buildMarketTrendAnalysis(excelRecords),
  };
}
