import { truncateMiddle, getStatusText } from '../utils';
import { TJobStatusNotification } from '@client/hooks';
/*
 * Post-process mapped status message to get a toast message translation.
 */
const toastMap = (status: string) => {
  const mappedStatus = getStatusText(status);
  switch (mappedStatus) {
    case 'Running':
      return 'is now running';
    case 'Failure' || 'Stopped':
      return status.toLowerCase();
    case 'Finished':
      return 'finished successfully';
    case 'Unknown':
      return 'is in an unknown state';
    default:
      return `is ${mappedStatus.toLowerCase()}`;
  }
};

/*
 * Returns a human readable message from a job update event.
 */
export const getToastMessage = ({
  extra,
  event_type: eventType,
  message,
}: TJobStatusNotification) => {
  switch (eventType) {
    case 'job':
      return `${truncateMiddle(extra.name, 25)} ${toastMap(extra.status)}`;
    case 'interactive_session_ready':
      return `${truncateMiddle(extra.name, 25)} ${
        message ? message.toLowerCase() : 'session ready to view.'
      }`;
    default:
      return message;
  }
};
