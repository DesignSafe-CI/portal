function icon(name: string, type?: string) {
  if (type === 'dir' || type === 'folder') {
    return 'fa-folder';
  }
  const ext = (name.split('.').pop() ?? '').toLowerCase();

  switch (ext) {
    case 'zip':
    case 'tar':
    case 'gz':
    case 'bz2':
      return 'fa-file-archive-o';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'tif':
    case 'tiff':
      return 'fa-file-image-o';
    case 'pdf':
      return 'fa-file-pdf-o';
    case 'doc':
    case 'docx':
      return 'fa-file-word-o';
    case 'xls':
    case 'xlsx':
      return 'fa-file-excel-o';
    case 'ppt':
    case 'pptx':
      return 'fa-file-powerpoint-o';
    case 'ogg':
    case 'webm':
    case 'mp4':
      return 'fa-file-video-o';
    case 'mp3':
    case 'wav':
      return 'fa-file-audio-o';
    case 'txt':
    case 'out':
    case 'err':
      return 'fa-file-text-o';
    case 'tcl':
    case 'sh':
    case 'json':
      return 'fa-file-code-o';
    case 'geojson':
    case 'kml':
    case 'kmz':
      return 'fa-map-o';
    default:
      return 'fa-file-o';
  }
}

export const FileTypeIcon: React.FC<{ name: string; type?: string }> = ({
  name,
  type,
}) => {
  const iconClassName = icon(name, type);
  const className = `fa ${iconClassName}`;
  return <i role="none" style={{ color: '#333333' }} className={className} />;
};
