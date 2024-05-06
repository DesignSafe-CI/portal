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
