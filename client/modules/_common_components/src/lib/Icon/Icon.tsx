import React from 'react';
import './Icon.module.css';

const Icon: React.FC<{ className: string; label: string }> = ({
  className,
  label,
}) => {
  return <i className={className} role="img" aria-label={label} />;
};

export default Icon;
