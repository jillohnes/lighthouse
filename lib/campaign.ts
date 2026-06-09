/** Jan–Jun program window (6 months). */
export const CAMPAIGN_TOTAL_MONTHS = 6;
const CAMPAIGN_FIRST_MONTH = 0;
const CAMPAIGN_LAST_MONTH = 5;

type DateRange = { startDate: Date; endDate: Date };

/** Count selected months within the Jan–Jun campaign window. */
export function getSelectedCampaignMonthCount(range: DateRange): number {
  const start = Math.max(
    CAMPAIGN_FIRST_MONTH,
    Math.min(CAMPAIGN_LAST_MONTH, range.startDate.getMonth()),
  );
  const end = Math.max(
    CAMPAIGN_FIRST_MONTH,
    Math.min(CAMPAIGN_LAST_MONTH, range.endDate.getMonth()),
  );
  return Math.max(1, end - start + 1);
}

/** Selected months as a fraction of the full campaign (e.g. June only → 1/6). */
export function getCampaignMonthProration(range: DateRange): number {
  return getSelectedCampaignMonthCount(range) / CAMPAIGN_TOTAL_MONTHS;
}

/** Prorate a full-campaign target to the selected timeframe. */
export function prorateCampaignTarget(
  fullTarget: number,
  range: DateRange,
): number {
  return fullTarget * getCampaignMonthProration(range);
}

/** Prorate a full-campaign ROI target to the selected timeframe. */
export function prorateRoiTarget(fullRoiTarget: number, range: DateRange): number {
  return prorateCampaignTarget(fullRoiTarget, range);
}
