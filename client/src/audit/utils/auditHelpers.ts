import { PortalAuditEntry, TimelineEvent, Timeline } from '@client/hooks';
/**
 * Filter usernames based on query string
 * @param {string[]} usernames - Array of usernames
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 20)
 * @returns {string[]} Filtered usernames
 */
export function filterUsernames(
  usernames: string[],
  query: string,
  limit: number = 20
): string[] {
  if (!query.length || !usernames) return [];
  return usernames
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, limit);
}

/**
 * Extract action-specific data from a portal audit entry
 * @param {PortalAuditEntry} entry - Portal audit entry
 * @returns {string} Extracted action data or '-'
 */
export function extractActionData(entry: PortalAuditEntry): string {
  if (!entry.data) return '-';

  try {
    const action = entry.action?.toLowerCase();
    const parsedData =
      typeof entry.data == 'string' ? JSON.parse(entry.data) : entry.data;
    switch (action) {
      case 'submitjob':
        return extractDataField(parsedData, 'body.job.name') || '-';

      case 'getapp':
        return extractDataField(parsedData, 'query.appId') || '-';

      case 'trash':
        return extractDataField(parsedData, 'path') || '-';

      case 'upload':
        return extractDataField(parsedData, 'body.file_name') || '-';

      case 'download':
        return extractDataField(parsedData, 'filePath') || '-';
    }
  } catch {
    return '-';
  }
  return '-';
}

/**
 * Extract a field from nested data using dot notation path
 * @param {unknown} data - Data object
 * @param {string} path - Dot notation path (e.g., 'body.file_name')
 * @returns {string} Extracted field value or '-'
 */
export function extractDataField(data: unknown, path: string): string {
  if (!data) return '-';
  const fields = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = data as any;
  for (let i = 0; i < fields.length; i++) {
    if (value && typeof value === 'object' && fields[i] in value) {
      value = value[fields[i]];
    } else {
      return '-';
    }
  }
  if (value === undefined || value == null || value === '') {
    return '-';
  }
  return String(value);
}

/**
 * Truncate a string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} n - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/**
 * Safely format JSON for display
 * @param {unknown} value - Value to format
 * @returns {string} Formatted JSON string or empty string
 */
export function safePretty(value: unknown): string {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return '';
  }
}

/**
 * Format timestamp to readable date/time string
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date/time string
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
}

/**
 * Format timestamp to date string only
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

/**
 * Format timestamp to time string only
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Check if an operation should be highlighted based on search term
 * @param {TimelineEvent} operation - Timeline event
 * @param {string} searchTerm - Optional search term to match
 * @returns {boolean} True if operation should be highlighted
 */
export function isHighlightOperation(
  operation: TimelineEvent,
  searchTerm?: string
): boolean {
  const term = (searchTerm || '').toLowerCase();
  if (!term) return false;
  const action = (operation?.action || '').toLowerCase();
  const details = operation.details as Record<string, unknown>;
  const body = (details?.body as Record<string, unknown>) || {};
  if (action === 'upload') {
    const fileName = ((body?.file_name as string) || '').toLowerCase();
    return fileName === term;
  }
  if (action === 'rename') {
    const newName = ((body?.new_name as string) || '').toLowerCase();
    return newName === term;
  }
  return false;
}

/**
 * Get display filename for a timeline, checking if search term matches a rename event
 * @param {Timeline} timeline - Timeline object
 * @param {string} searchTerm - Optional search term to match
 * @returns {string} Display filename (searched name if matches rename, otherwise original)
 */
export function getDisplayFileName(
  timeline: Timeline,
  searchTerm?: string
): string {
  if (!searchTerm) return timeline.timeline_file_name;

  const lowerSearch = searchTerm.toLowerCase();

  // Check if search term matches any rename event's new_name
  for (const event of timeline.events) {
    if (event.action.toLowerCase() === 'rename') {
      const details = event.details as Record<string, unknown>;
      const body = (details?.body as Record<string, unknown>) || {};
      const newName = (body?.new_name as string) || '';
      if (newName.toLowerCase() === lowerSearch) {
        return newName;
      }
    }
  }

  return timeline.timeline_file_name;
}

/**
 * Check if an event is a TAPIS event
 */
export function isTapisEvent(operation: TimelineEvent): boolean {
  const details = operation.details as Record<string, unknown>;
  return !!(details.source_system_id || details.target_system_id);
}

/**
 * Get source path from a timeline event based on action type
 */
export function getSourcePath(operation: TimelineEvent): string {
  const details = operation.details as Record<string, unknown>;
  const action = (operation.action || '').toLowerCase();

  // If it's a TAPIS event, use source_path directly
  if (isTapisEvent(operation)) {
    return (details.source_path as string) || 'N/A';
  }

  switch (action) {
    case 'upload':
    case 'submitjob':
      return 'N/A';
    case 'rename':
    case 'move':
    case 'trash':
      return (details.path as string) || 'N/A';
    default:
      return (details.path as string) || 'N/A';
  }
}

/**
 * Get target path from a timeline event based on action type
 */
export function getTargetPath(operation: TimelineEvent): string {
  const details = operation.details as Record<string, unknown>;
  const body = (details.body as Record<string, unknown>) || {};
  const action = (operation.action || '').toLowerCase();

  // If it's a TAPIS event, use target_path directly
  if (isTapisEvent(operation)) {
    return (details.target_path as string) || 'N/A';
  }

  switch (action) {
    case 'upload':
      return (details.path as string) || 'N/A';
    case 'rename':
      return (body.new_name as string) || 'N/A';
    case 'move':
      return (body.dest_path as string) || 'N/A';
    case 'trash':
      return (body.trash_path as string) || 'N/A';
    case 'submitjob':
      return 'N/A';
    default:
      return 'N/A';
  }
}
