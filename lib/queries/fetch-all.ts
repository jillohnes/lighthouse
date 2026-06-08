import type { ProgramMetricRow } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

type RangeQuery = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: ProgramMetricRow[] | null;
    error: { message: string } | null;
  }>;
};

export async function fetchAllProgramMetrics(
  buildQuery: () => RangeQuery,
): Promise<ProgramMetricRow[]> {
  const all: ProgramMetricRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}
