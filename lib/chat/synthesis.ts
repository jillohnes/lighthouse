import type { ChatContext } from "@/lib/chat/types";

type ContextInput = Omit<ChatContext, "analysis">;

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}

function shareOf(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function sortByResult<T extends { result: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.result - a.result);
}

function conversionRate(samples: number, result: number): string {
  if (!samples) return "0.00";
  return (result / samples).toFixed(2);
}

export function buildAnalysis(context: ContextInput) {
  const totalResult = context.activationBreakdown.reduce((s, r) => s + r.result, 0);
  const totalReach = context.activationBreakdown.reduce((s, r) => s + r.reach, 0);
  const totalSamples = context.activationBreakdown.reduce((s, r) => s + r.impact, 0);

  const topActivation = sortByResult(context.activationBreakdown)[0];
  const bottomActivation = sortByResult(context.activationBreakdown).at(-1);
  const topLocation = sortByResult(context.locationBreakdown)[0];
  const bottomLocation = sortByResult(context.locationBreakdown).at(-1);
  const topMarket = context.topMarkets[0];
  const bottomMarket = context.topMarkets.at(-1);

  const months = context.monthlyActivationTotals;
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const resultTrend =
    firstMonth && lastMonth && firstMonth.result > 0
      ? Math.round(
          ((lastMonth.result - firstMonth.result) / firstMonth.result) * 100,
        )
      : 0;

  const activationInsights = context.activationBreakdown.map((row) => {
    const rosPerSample = conversionRate(row.impact, row.result);
    return `${row.name}: ${formatCurrency(row.result)} ROS (${shareOf(row.result, totalResult)} of program), ${row.reach.toLocaleString()} reach, ${row.impact.toLocaleString()} samples, ${rosPerSample} $/sample${row.resultPercent ? `, ${row.resultPercent}% of target` : ""}`;
  });

  const locationInsights = context.locationBreakdown.map((row) => {
    return `${row.name}: ${formatCurrency(row.result)} ROS (${shareOf(row.result, totalResult)} of program), ${row.impact.toLocaleString()} samples, ${conversionRate(row.impact, row.result)} $/sample`;
  });

  const marketInsights = context.topMarkets.map((row) => {
    return `${row.market}: ${formatCurrency(row.result)} ROS, ${row.roi.toFixed(1)}% ROI, ${row.impact.toLocaleString()} samples, status ${row.status}`;
  });

  const risks: string[] = [];
  const opportunities: string[] = [];

  for (const row of context.activationBreakdown) {
    if (row.resultPercent !== undefined && row.resultPercent < 90) {
      risks.push(
        `${row.name} is pacing at ${row.resultPercent}% of result target despite ${row.impact.toLocaleString()} samples — conversion or mix may need adjustment.`,
      );
    }
    if (row.resultPercent !== undefined && row.resultPercent >= 100) {
      opportunities.push(
        `${row.name} is at or above target (${row.resultPercent}% of result) — consider scaling spend in high-ROI markets.`,
      );
    }
  }

  for (const market of context.topMarkets.filter((m) => m.status === "at-risk")) {
    risks.push(
      `${market.market} is flagged at-risk with ${market.roi.toFixed(1)}% ROI despite ${market.impact.toLocaleString()} samples.`,
    );
  }

  return {
    totalResult,
    totalReach,
    totalSamples,
    topActivation,
    bottomActivation,
    topLocation,
    bottomLocation,
    topMarket,
    bottomMarket,
    resultTrend,
    activationInsights,
    locationInsights,
    marketInsights,
    risks,
    opportunities,
    programNarrative: [
      `Program period ${context.filters.startDate} to ${context.filters.endDate} across ${context.summary.markets} markets and ${context.summary.totalActivations.toLocaleString()} activations.`,
      `Totals: ${totalReach.toLocaleString()} reach, ${totalSamples.toLocaleString()} samples, ${formatCurrency(totalResult)} ROS.`,
      `ROAS stack — TTL ${context.roas.ttlRoi}, Sampling ${context.roas.samplingRoi}, Content ${context.roas.contentRoi}.`,
      `Pacing is at ${context.summary.pacingPercent}% of the campaign window.`,
    ].join(" "),
    trendInsight:
      firstMonth && lastMonth
        ? `Results moved from ${formatCurrency(firstMonth.result)} (${firstMonth.month}) to ${formatCurrency(lastMonth.result)} (${lastMonth.month}), a ${resultTrend >= 0 ? "+" : ""}${resultTrend}% change. Reach went from ${firstMonth.reach.toLocaleString()} to ${lastMonth.reach.toLocaleString()} and samples from ${firstMonth.impact.toLocaleString()} to ${lastMonth.impact.toLocaleString()}.`
        : "Monthly trend data is limited for this filter set.",
    contentInsight: `${context.content.impressionsTakeaway} ${context.content.emvTakeaway}`,
    crossSignals: [
      topActivation && topMarket
        ? `Leader ${topActivation.name} (${shareOf(topActivation.result, totalResult)} of ROS) and top market ${topMarket.market} (${formatCurrency(topMarket.result)}) should be read together — market success likely reflects activation mix as much as brand demand.`
        : null,
      topLocation && topActivation
        ? `${topLocation.name} is the strongest venue type while ${topActivation.name} leads activation type — pairing these formats may explain outsized conversion.`
        : null,
      context.programTotals.optIns !== "0"
        ? `Digital opt-ins (${context.programTotals.optIns}, ${context.programTotals.optInValue} value) add a secondary value layer to sampling ROAS (${context.roas.digitalSamplingRoi}).`
        : null,
    ].filter((line): line is string => Boolean(line)),
    prebuiltInsights: context.insights.map((i) => `${i.title}: ${i.description}`),
  };
}

function pickSignals(analysis: ReturnType<typeof buildAnalysis>, limit = 4): string[] {
  return [
    analysis.programNarrative,
    ...analysis.crossSignals,
    ...analysis.activationInsights.slice(0, 2),
    ...analysis.marketInsights.slice(0, 2),
    analysis.trendInsight,
    analysis.contentInsight,
    ...analysis.prebuiltInsights.slice(0, 1),
  ].slice(0, limit);
}

function whyParagraph(
  headline: string,
  evidence: string[],
  implication: string,
): string {
  return `${headline}\n\n${evidence.map((line) => `• ${line}`).join("\n")}\n\n${implication}`;
}

export function synthesizeAnswer(question: string, context: ChatContext): string {
  const q = question.toLowerCase();
  const analysis = buildAnalysis(context);

  if (q.includes("market") && (q.includes("top") || q.includes("best") || q.includes("highest") || q.includes("perform"))) {
    const top = analysis.topMarket;
    const runnerUp = context.topMarkets[1];
    if (!top) return "No market data is available for the current filters.";

    return whyParagraph(
      `${top.market} is the leading market, but performance is driven by more than a single metric.`,
      [
        `${top.market}: ${formatCurrency(top.result)} ROS, ${top.roi.toFixed(1)}% ROI, ${top.impact.toLocaleString()} samples, ${top.reach.toLocaleString()} reach (${top.status}).`,
        runnerUp
          ? `Next closest: ${runnerUp.market} at ${formatCurrency(runnerUp.result)} ROS and ${runnerUp.roi.toFixed(1)}% ROI.`
          : "",
        analysis.topActivation
          ? `Program-wide, ${analysis.topActivation.name} contributes ${shareOf(analysis.topActivation.result, analysis.totalResult)} of total ROS — likely influencing which markets over-index.`
          : "",
        analysis.topLocation
          ? `${analysis.topLocation.name} is the top location type with ${formatCurrency(analysis.topLocation.result)} ROS.`
          : "",
        analysis.trendInsight,
      ].filter(Boolean),
      `Why it matters: ${top.market} is winning on results and ROI together, which suggests the local activation mix (${analysis.topActivation?.name ?? "on-premise types"}) and venue focus (${analysis.topLocation?.name ?? "key locations"}) are converting samples efficiently — not just generating volume. ${analysis.crossSignals[0] ?? ""}`,
    );
  }

  if (q.includes("roas") || q.includes("roi")) {
    return whyParagraph(
      "ROAS varies by channel because each lever contributes different value types.",
      [
        `TTL ROAS ${context.roas.ttlRoi} blends sampling (${context.roas.samplingRoi}) and content (${context.roas.contentRoi}).`,
        `By activation: HCT ${context.roas.hctRoi}, Brand Experience ${context.roas.brandExperienceRoi}, Digital Sampling ${context.roas.digitalSamplingRoi}.`,
        analysis.topActivation
          ? `${analysis.topActivation.name} leads on ${formatCurrency(analysis.topActivation.result)} ROS with ${conversionRate(analysis.topActivation.impact, analysis.topActivation.result)} $/sample.`
          : "",
        `Opt-in value adds ${context.programTotals.optInValue} on top of digital sampling scans/redemptions.`,
        analysis.contentInsight,
        ...analysis.risks.slice(0, 1),
        ...analysis.opportunities.slice(0, 1),
      ].filter(Boolean),
      "Why it matters: strong TTL ROAS usually means sampling efficiency and content value are reinforcing each other — not that one tile is carrying the whole program. Compare activation-level $/sample against ROAS before shifting budget.",
    );
  }

  if (q.includes("activation") && (q.includes("best") || q.includes("top") || q.includes("perform") || q.includes("compare"))) {
    const sorted = sortByResult(context.activationBreakdown);
    const top = sorted[0];
    const second = sorted[1];
    if (!top) return "No activation type breakdown is available.";

    return whyParagraph(
      `${top.name} leads on results, but the gap vs other types tells the real story.`,
      [
        ...analysis.activationInsights,
        second
          ? `Gap vs ${second.name}: ${formatCurrency(top.result - second.result)} more ROS and ${conversionRate(top.impact, top.result)} vs ${conversionRate(second.impact, second.result)} $/sample.`
          : "",
        analysis.topLocation
          ? `Best venue context: ${analysis.topLocation.name} (${formatCurrency(analysis.topLocation.result)} ROS).`
          : "",
        analysis.topMarket
          ? `Top market ${analysis.topMarket.market} may be amplifying ${top.name} performance.`
          : "",
      ].filter(Boolean),
      `Why it matters: ${top.name} is not only winning on volume — its ${shareOf(top.impact, analysis.totalSamples)} sample share and ${shareOf(top.result, analysis.totalResult)} ROS share should be compared. If samples are high but ROS share lags, conversion is the issue; if both are high, scale is justified.`,
    );
  }

  if (q.includes("location") || q.includes("venue")) {
    const top = analysis.topLocation;
    if (!top) return "No location type breakdown is available.";

    return whyParagraph(
      `${top.name} is the top location type when reach, samples, and ROS are read together.`,
      analysis.locationInsights,
      `Why it matters: venue type shapes conversion efficiency. ${top.name} outperforms with ${conversionRate(top.impact, top.result)} $/sample — align future activations and ambassador content to the formats that mirror this environment.`,
    );
  }

  if (q.includes("sample") || q.includes("impact") || q.includes("conversion")) {
    const topSamples = [...context.activationBreakdown].sort((a, b) => b.impact - a.impact)[0];
    const topRos = analysis.topActivation;

    return whyParagraph(
      "Samples and ROS should be interpreted as a funnel, not separate scorecards.",
      [
        `Program samples: ${context.programTotals.totalSamples}; ROS: ${context.programTotals.totalResults}.`,
        topSamples
          ? `Highest sample volume: ${topSamples.name} (${topSamples.impact.toLocaleString()} samples).`
          : "",
        topRos
          ? `Best ROS efficiency among types: ${topRos.name} at ${conversionRate(topRos.impact, topRos.result)} $/sample.`
          : "",
        analysis.topMarket
          ? `Top converting market: ${analysis.topMarket.market} (${analysis.topMarket.impact.toLocaleString()} samples, ${formatCurrency(analysis.topMarket.result)} ROS).`
          : "",
        analysis.trendInsight,
      ].filter(Boolean),
      "Why it matters: high samples with weaker $/sample indicate awareness without conversion; high $/sample with modest samples suggests efficient but under-scaled programs. Look for markets/types where both samples and $/sample rank highly.",
    );
  }

  if (q.includes("ambassador") || q.includes("content") || q.includes("impression")) {
    const ambassador = context.topAmbassadors[0];
    return whyParagraph(
      "Content and ambassador performance connect to sampling outcomes through awareness and local relevance.",
      [
        ambassador
          ? `Top ambassador: ${ambassador.name} (${ambassador.market}) — ${ambassador.organicImpressions.toLocaleString()} organic / ${ambassador.paidImpressions.toLocaleString()} paid impressions.`
          : "No ambassador leaderboard data in this view.",
        analysis.contentInsight,
        analysis.topMarket
          ? `Strongest market overlap to watch: ${analysis.topMarket.market}.`
          : "",
        `Content ROAS: ${context.roas.contentRoi}; Sampling ROAS: ${context.roas.samplingRoi}.`,
      ].filter(Boolean),
      "Why it matters: content builds reach that sampling converts. Markets where impressions rise and $/sample is strong are your best integrated plays.",
    );
  }

  if (q.includes("trend") || q.includes("month") || q.includes("why") || q.includes("insight") || q.includes("recommend")) {
    return whyParagraph(
      "Across the dashboard, a few patterns explain current performance.",
      [
        ...pickSignals(analysis, 6),
        ...analysis.risks.slice(0, 2),
        ...analysis.opportunities.slice(0, 2),
      ],
      "Why it matters: prioritize markets and activation types where reach, samples, and ROS move in the same direction. Use underperforming segments with high sample volume as pivot candidates rather than cut candidates.",
    );
  }

  return whyParagraph(
    "Here is a cross-program read based on your current filters.",
    pickSignals(analysis, 6),
    `Why it matters: the story is the relationship between reach (${context.programTotals.totalEngagements}), samples (${context.programTotals.totalSamples}), and ROS (${context.programTotals.totalResults}). Ask about a specific market, activation type, or ROAS driver and I will connect the signals behind it.`,
  );
}
