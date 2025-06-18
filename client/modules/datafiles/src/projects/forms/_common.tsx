import React from 'react';
import { Tag } from 'antd';

export const customRequiredMark = (
  label: React.ReactNode,
  info: { required: boolean }
) => (
  <>
    <span style={{ whiteSpace: 'nowrap' }}>{label}</span>&nbsp;
    {info.required && (
      <Tag
        color="#d9534f"
        style={{
          borderRadius: '2.7px',
          lineHeight: 1,
          paddingInline: 0,
          padding: '0.2em 0.4em 0.3em',
          fontSize: '75%',
        }}
      >
        Required
      </Tag>
    )}
  </>
);

type BadgeType = 'green' | 'red' | 'yellow';

interface CustomBadgeProps {
  type: BadgeType;
  children: React.ReactNode;
}

const colorVarMap: Record<BadgeType, string> = {
  green: 'var(--global-color-green)',
  red: 'var(--global-color-red)',
  yellow: 'var(--global-color-yellow)',
};

export const CustomStatusBadge: React.FC<CustomBadgeProps> = ({
  type,
  children,
}) => (
  <Tag
    style={{
      backgroundColor: colorVarMap[type],
      color: type === 'yellow' ? '#222222' : '#fff',
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
