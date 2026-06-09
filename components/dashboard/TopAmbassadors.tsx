"use client";

import { formatNumber } from "@/lib/format";
import type { TopAmbassadorRow } from "@/lib/types";

interface TopAmbassadorsProps {
  ambassadors: TopAmbassadorRow[];
}

export function TopAmbassadors({ ambassadors }: TopAmbassadorsProps) {
  return (
    <div className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">
        Top 10 HCT Ambassadors
      </h3>

      {ambassadors.length === 0 ? (
        <p className="py-8 text-center text-xs text-brand/50">
          No ambassador data for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-brand/10 text-left text-muted">
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">Name</th>
                <th className="pb-2 pr-3 font-medium">Market</th>
                <th className="pb-2 pr-3 text-right font-medium">Organic</th>
                <th className="pb-2 text-right font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {ambassadors.map((row, index) => (
                <tr key={`${row.name}-${row.market}`} className="border-b border-brand/5">
                  <td className="py-2 pr-3 text-muted">{index + 1}</td>
                  <td className="py-2 pr-3 font-medium text-foreground">{row.name}</td>
                  <td className="py-2 pr-3 text-brand/80">{row.market}</td>
                  <td className="py-2 pr-3 text-right text-brand/80">
                    {formatNumber(row.organicImpressions)}
                  </td>
                  <td className="py-2 text-right text-brand/80">
                    {formatNumber(row.paidImpressions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
