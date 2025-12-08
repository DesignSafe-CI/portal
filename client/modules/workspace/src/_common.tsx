import React from 'react';
import { Tag } from 'antd';

// have one for success(used in job status), warning(used in job status), open(used for system/queue statuses), and error (for any reds we neeed[job status and system/queue statuses])
type VariantType = 'success' | 'warning' | 'open' | 'error';

interface StatusTagProps {
  variant: VariantType;
  children: React.ReactNode;
}

const variantColorMap: Record<VariantType, { bg: string; text: string }> = {
  success: { bg: 'var(--ds-success-color)', text: '#fff' }, // Green
  warning: { bg: 'var(--ds-warning-color)', text: '#000000' }, // Light Yellow
  open: { bg: '#f8dca7', text: '#000000' }, // Darker yellow
  error: { bg: 'var(--ds-error-color)', text: '#fff' }, // Red
};

export const StatusTag: React.FC<StatusTagProps> = ({ variant, children }) => {
  const colors = variantColorMap[variant];
  return (
    <Tag
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: '12px',
        lineHeight: 1,
        padding: '0.35em 0.7em',
        border: 'none',
        fontSize: '0.9em',
      }}
    >
      {children}
    </Tag>
  );
};
