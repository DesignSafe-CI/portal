/**
 * Returns a capitalized system name readable message from a job update event.
 *
 * @param {string} host
 * @return {string} system name
 */
export function getSystemName(host) {
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

/**
 * Returns display name for system
 *
 * @param {Array} list of systems
 * @param {string} system
 * @return {string} display name of system
 */
export function findSystemDisplayName(
  systemList,
  system,
  isRoot,
  scheme,
  path
) {
  const matchingSystem = systemList.find((s) => {
    let isHomeDirInPath = true;

    if (path && s.homeDir) {
      isHomeDirInPath = path
        .replace(/^\/+/, '')
        .startsWith(s.homeDir.replace(/^\/+/, ''));
    }

    return s.system === system && s.scheme === scheme && isHomeDirInPath;
  });
  if (matchingSystem) {
    return matchingSystem.name;
  }
  if (isRoot) {
    return '/';
  }
  return getSystemName(system);
}

/**
 * Returns a project title.
 *
 * @param {string} projectsList list of projects
 * @param {string} projectSystem the system for the project
 * @return {string} project title
 */

export function findProjectTitle(projectsList, projectSystem, projectTitle) {
  const matching = projectsList.find((project) => project.id === projectSystem);
  if (matching) {
    return matching.title;
  }
  return projectSystem && projectTitle ? projectTitle : '';
}

/**
 * Returns display name for system or project
 *
 * @param {string} scheme
 * @param {Array} systemList
 * @param {Array} projectsList
 * @param {string} system
 * @param {string} projectTitle
 * @param {boolean} isRoot
 * @return {string} display name of system or project
 */
export function findSystemOrProjectDisplayName(
  scheme,
  systemList,
  projectsList,
  system,
  path,
  projectTitle,
  isRoot
) {
  switch (scheme) {
    case 'projects':
      return findProjectTitle(projectsList, system, projectTitle);
    default:
      return findSystemDisplayName(systemList, system, isRoot, scheme, path);
  }
}
