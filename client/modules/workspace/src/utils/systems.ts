/**
 * Returns a capitalized system name readable message from a job update event.
 *
 * @param {string} host
 * @return {string} system name
 */
export function getSystemName(host: string) {
  if (
    host.startsWith('data.tacc') ||
    host.startsWith('cloud.corral') ||
    host.startsWith('secure.corral') ||
    host.startsWith('cloud.data')
  ) {
    return 'Corral';
  }
  const systemName = host.split('.')[0];
  return systemName.substring(0, 1).toUpperCase() + systemName.slice(1);
}
