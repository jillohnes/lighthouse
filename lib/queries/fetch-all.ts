import type { ContentMetricRow, ProgramMetricRow } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

type RangeQuery<T> = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>;
};

async function fetchAllRows<T>(buildQuery: () => RangeQuery<T>): Promise<T[]> {
  const all: T[] = [];
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

export async function fetchAllRowsPaginated<T>(
  buildQuery: () => RangeQuery<T>,
): Promise<T[]> {
  return fetchAllRows(buildQuery);
}

export async function fetchAllProgramMetrics(
  buildQuery: () => RangeQuery<ProgramMetricRow>,
): Promise<ProgramMetricRow[]> {
  return fetchAllRows(buildQuery);
}

export async function fetchAllContentMetrics(
  buildQuery: () => RangeQuery<ContentMetricRow>,
): Promise<ContentMetricRow[]> {
  return fetchAllRows(buildQuery);
}
