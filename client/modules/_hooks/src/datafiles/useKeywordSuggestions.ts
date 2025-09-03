import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type TGetKeywordSuggestionsParams = {
  title: string;
  description: string;
};

export interface KeywordSuggestionResponse {
  response: string[];
}

export function useKeywordSuggestions(
  searchParams: TGetKeywordSuggestionsParams
) {
  return useQuery({
    queryKey: ['keywordSuggestions', searchParams],
    queryFn: async () => {
      const res = await apiClient.get<KeywordSuggestionResponse>(
        '/api/keyword-suggestions/',
        { params: searchParams }
      );
      return res.data.response;
    },
    enabled: !!searchParams.title.trim() && !!searchParams.description.trim(),
    staleTime: Infinity,
  });
}
