import React from 'react';
export const SystemsDocumentation: React.FC<{ execSystemId: string }> = ({
  execSystemId,
}) => {
  let url;
  switch (execSystemId) {
    case 'frontera':
      url = 'https://docs.tacc.utexas.edu/hpc/frontera/#running-queues';
      break;
    case 'stampede3':
      url = 'https://docs.tacc.utexas.edu/hpc/stampede3/#queues';
      break;
    case 'vista':
      url = 'https://docs.tacc.utexas.edu/hpc/vista/#queues';
      break;
    case 'ls6':
      url = 'https://docs.tacc.utexas.edu/hpc/lonestar6/#running-queues';
      break;
    default:
      url = 'https://docs.tacc.utexas.edu/#hpc-resource-guides';
      break;
  }
  return (
    <div style={{ lineHeight: '20px', textAlign: 'left', marginBottom: 16 }}>
      <a href={url} target="_blank">
        {capitalizeFirstLetter(execSystemId)} { }
        detailed queue information
      </a>
      .
    </div>
  );
};
function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}