export function toBytes(bytes?: number) {
  if (bytes === 0) return '0 bytes';
  if (!bytes) return '-';
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  const orderOfMagnitude = Math.floor(Math.log(bytes) / Math.log(1024));
  const precision = orderOfMagnitude === 0 ? 0 : 1;
  const bytesInUnits = bytes / Math.pow(1024, orderOfMagnitude);
  return `${bytesInUnits.toFixed(precision)} ${units[orderOfMagnitude]}`;
}
