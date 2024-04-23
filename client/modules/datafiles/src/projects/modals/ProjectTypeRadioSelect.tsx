import React from 'react';

export const ProjectTypeRadioSelect: React.FC<{
  label: string;
  iconName: string;
  description: string;
}> = ({ label, iconName, description }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span className={iconName} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '1rem',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 'normal' }}>{description}</span>
      </div>
    </div>
  );
};
