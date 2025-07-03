import React from 'react';
import { Tag } from 'antd';

type StatusType = 'success' | 'error' | 'warning';

interface StatusTagProps {
  type: StatusType;
  children: React.ReactNode;
}

const colorVarMap: Record<StatusType, string> = {
  success: 'var(--ds-success-color)',
  error: 'var(--ds-error-color)',
  warning: 'var(--ds-warning-color)',
};

export const StatusTag: React.FC<StatusTagProps> = ({
  type,
  children,
}) => (
  <Tag
    style={{
      backgroundColor: colorVarMap[type],
      color: type === 'warning' ? '#222222' : '#fff',
      borderRadius: '2.7px',
      lineHeight: 1,
      paddingInline: 0,
      padding: '0.2em 0.4em 0.3em',
      fontSize: '75%',
      border: 'none',
    }}
  >
    {children}
  </Tag>
);
