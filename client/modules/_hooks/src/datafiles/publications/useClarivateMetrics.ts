import { useQuery } from '@tanstack/react-query';

export const useClarivateMetrics = (doi: string, shouldFetch = true) => {
  return useQuery({
    queryKey: ['clarivateMetrics', doi],
    queryFn: async () => {
      const response = await fetch(`/api/publications/clarivate/?doi=${doi}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch Clarivate metrics');
      }

      return {
        citationCount: result.citation_count ?? 0,
      };
    },
    enabled: !!doi && shouldFetch,
  });
};
