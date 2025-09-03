import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { KeywordSuggestionResponse } from '../../../datafiles/src/types/keywords';

export type TGetKeywordSuggestionsParams = {
  title: string;
  description: string;
};

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
