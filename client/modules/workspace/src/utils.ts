import { STATUS_TEXT_MAP } from './constants';


export function getStatusText({status}: {status: string}) {
  if (status in STATUS_TEXT_MAP) {
    return STATUS_TEXT_MAP[status];
  }
  return 'Unknown';
}
