import { truncateMiddle, getStatusText } from '../utils';

export type TJobStatusNotification = {
  event_type: string;
  datetime: string;
  status: string;
  operation: string;
  message: string;
  extra: {
    name: string;
    owner: string;
    status: string;
    uuid: string;
  };
  pk: number;
  action_link: string;
  user: string;
  read: boolean;
  deleted: boolean;
};

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
      return `${truncateMiddle(extra.name, 20)} ${toastMap(extra.status)}`;
    case 'interactive_session_ready':
      return `${truncateMiddle(extra.name, 20)} ${
        message ? message.toLowerCase() : 'session ready to view.'
      }`;
    default:
      return message;
  }
};
