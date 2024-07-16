import { THazmapperMap } from '@client/hooks';

export const HAZMAPPER_BASE_URL_MAP = {
  production: 'https://hazmapper.tacc.utexas.edu/hazmapper',
  staging: 'https://hazmapper.tacc.utexas.edu/staging',
  dev: 'https://hazmapper.tacc.utexas.edu/dev',
  local: 'http://localhost:4200',
  experimental: 'https://hazmapper.tacc.utexas.edu/exp',
};

/**
 * Generates the Hazmapper URL based on the provided map details and publication status.
 *
 * Background:  We assume there is a public Hazmapper map-project for all published projects.  For non-published
 * projets, we assume that only members of the project are using this URL so we provide
 * the private Hazmapper map/project link.
 *
 * Logs an error if the deployment type is invalid.
 *
 * @returns The generated Hazmapper URL.
 */
export const getHazmapperUrl = (
  map: THazmapperMap,
  isPublished: boolean = false
): string => {
  let baseUrl =
    HAZMAPPER_BASE_URL_MAP[
      map.deployment as keyof typeof HAZMAPPER_BASE_URL_MAP
    ];

  if (!baseUrl) {
    console.error(
      `Invalid deployment type: ${map.deployment}.  Falling back to local`
    );
    baseUrl = HAZMAPPER_BASE_URL_MAP['local'];
  }

  return isPublished
    ? `${baseUrl}/project-public/${map.uuid}`
    : `${baseUrl}/project/${map.uuid}`;
};

/**
 * Filters Hazmapper maps based on the deployment type.
 *
 * On prod, we only want to see prod maps so we filter everything else
 * out.
 */
export const filterHazmapperMaps = (maps: THazmapperMap[]): THazmapperMap[] => {
  // Filter out non-production maps if we are DS prod (i.e. 'designsafe-ci.org')
  if (window.location.origin.includes('designsafe-ci.org')) {
    return maps.filter((map) => map.deployment === 'production');
  }

  return maps;
};
