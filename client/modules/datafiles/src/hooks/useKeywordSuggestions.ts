import { useQuery } from '@tanstack/react-query';
// import axios from 'axios';
// import { KeywordSuggestionResponse } from '../types/keywords';
import { mockKeywordSuggestions } from '../types/keywords';

export function useKeywordSuggestions(title: string, description: string) {
  return useQuery({
    queryKey: ['keywordSuggestions', title, description],
    // TEMPORARY MOCK: immediately resolve with our mock list
    queryFn: async () => {
      // simulate network delay if you like:
      await new Promise((r) => setTimeout(r, 300));
      return mockKeywordSuggestions;
    },
    enabled: !!title.trim() && !!description.trim(),
  });
}

// export function useKeywordSuggestions(title: string, description: string) {
//   return useQuery({
//     queryKey: ['keywordSuggestions', title, description],
//     queryFn: async () => {
//       const res = await axios.post<KeywordSuggestionResponse>(
//         '/api/keyword-suggestions',
//         { title, description }
//       );
//       return res.data.keywords;
//     },
//     enabled: !!title.trim() && !!description.trim(),
//   });
// }
