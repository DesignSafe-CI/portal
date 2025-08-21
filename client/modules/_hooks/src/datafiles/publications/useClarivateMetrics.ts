import { useQuery } from '@tanstack/react-query';

export const useClarivateMetrics = (
  doi: string,
  shouldFetch = true,
  opts?: { includeRecords?: boolean; debug?: boolean }
) => {
  const includeRecords = !!opts?.includeRecords;
  return useQuery({
    queryKey: ['clarivateMetrics', doi, includeRecords],
    enabled: !!doi && shouldFetch,
    queryFn: async () => {
      const qs = new URLSearchParams({ doi });
      if (includeRecords) qs.set('include', 'records');
      if (opts?.debug) qs.set('debug', '1');
      const res = await fetch(`/api/publications/clarivate/?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch Clarivate metrics');
      return {
        citationCount: json?.citation_count ?? 0,
        citations: Array.isArray(json?.citations) ? json.citations : [],
        _debug: json?._debug,
      };
    },
  });
};
