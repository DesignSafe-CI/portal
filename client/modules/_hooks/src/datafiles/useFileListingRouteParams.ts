import { useMatches, useParams } from 'react-router-dom';

export function useFileListingRouteParams() {
  // Parse routes of the form :api/:system/:path-
  const {
    api: paramApi,
    system,
    path,
  } = useParams<{ api: string; system: string; path: string }>();
  const matches = useMatches();

  // If API isn't passed as a param, read it from the route ID.
  const api = paramApi ?? matches.slice(-1)[0].id;

  const scheme: 'public' | 'private' = [
    'designsafe.storage.published',
    'designsafe.storage.community',
    'nees.public',
  ].includes(system ?? '')
    ? 'public'
    : 'private';

  return { api, scheme, system: system ?? '-', path: path ?? '' };
}

export type TFileListingParams = ReturnType<typeof useFileListingRouteParams>;

export default useFileListingRouteParams;
