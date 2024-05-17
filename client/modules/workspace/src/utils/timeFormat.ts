/**
 * Create a string representation of date using internal standard
 * @param {Date} dateTime - A date object
 * @returns {string}
 */
export function formatDate(dateTime : Date ) {
    return dateTime.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  
  /**
   * Create a string representation of time using internal standard
   * @param {Date} dateTime - A date object
   * @returns {string}
   */
  export function formatTime(dateTime : Date) {
    return dateTime.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  /**
   * Create a string representation of date and time using internal standard
   * @param {Date} dateTime - A date object
   * @returns {string}
   */
  export function formatDateTime(dateTime: Date) {
    return `${formatDate(dateTime)} ${formatTime(dateTime)}`;
  }
  
  /**
   * A standard-format date string or UNIX timestamp
   * @typedef {string|number} DateTimeValue
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
   */
  /**
   * Create a string representation of date/time using internal standard
   * @param {DateTimeValue} dateTimeValue - A single value date-time representation
   * @returns {string}
   */
  export function formatDateTimeFromValue(dateTimeValue : number ) {
    const date = new Date(dateTimeValue);
  
    return formatDateTime(date);
  }
