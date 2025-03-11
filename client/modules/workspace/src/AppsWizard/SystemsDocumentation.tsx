import React from 'react';
export const SystemsDocumentation: React.FC<{ projectType: string }> = ({
  projectType,
}) => {
  let url;
  switch (projectType) {
    case 'frontera':
      url = "https://docs.tacc.utexas.edu/hpc/frontera/#running-queues";
      break;
    case 'ls6':
      url = "https://docs.tacc.utexas.edu/hpc/lonestar6/#running-queues";
      break;
    case 'stampede3':
      url = "https://docs.tacc.utexas.edu/hpc/stampede3/#running";
      break;
    default:
      url = "https://docs.tacc.utexas.edu/#hpc-resource-guides";
      break;
  }
    return (
      <div style={{ lineHeight: '20px', textAlign: 'left', marginBottom: 16 }}>
          For more information regarding systems, queues, and maximum nodes needed, please see
          the <a href={url}>documentation</a>.
      </div>
    );
};
