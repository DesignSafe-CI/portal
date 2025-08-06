import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { KeywordSuggestionResponse } from '../../../datafiles/src/types/keywords';

export function useKeywordSuggestions(title: string, description: string) {
  return useQuery({
    queryKey: ['keywordSuggestions', title, description],
    queryFn: async () => {
      const res = await apiClient.get<KeywordSuggestionResponse>(
        '/api/keyword-suggestions/',
        { params: { title, description } }
      );
      return res.data.response;
    },
    enabled: !!title.trim() && !!description.trim(),
  });
}

// async function getFilePreview({
//   api,
//   system,
//   scheme,
//   path,
//   doi,
//   signal,
// }: TPreviewParams & { signal: AbortSignal }) {
//   const res = await apiClient.get<TFilePreviewResponse>(
//     `/api/datafiles/${api}/${scheme}/preview/${system}/${path}`,
//     { params: { doi }, signal }
//   );
//   return res.data;
// }
