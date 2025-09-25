import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { useCallback } from 'react';

type TGihubParams = {
  org: string;
  repo: string;
  ref: string;
};

export type TGithubFileObj = {
  download_url: string;
  git_url: string;
  html_url: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  url: string;
  _links: {
    self: string;
    git: string;
  };
};
async function getGithubListing({ org, repo, ref }: TGihubParams) {
  const githubUrl = `https://api.github.com/repos/${org}/${repo}/contents/?ref=${ref}`;
  const resp = await apiClient.get<TGithubFileObj[]>(githubUrl);
  return resp.data;
}

export function useGithubListing({ org, repo, ref }: TGihubParams) {
  const githubListingCallback = useCallback(
    () => getGithubListing({ org, repo, ref }),
    [org, repo, ref]
  );
  return useQuery({
    queryKey: ['githubListing', org, repo, ref],
    queryFn: githubListingCallback,
    enabled: !!(org && repo && ref),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
