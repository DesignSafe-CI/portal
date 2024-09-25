import React, { useCallback } from 'react';
import { Collapse } from 'antd';
import { DISPLAY_NAMES, PROJECT_COLORS } from '../constants';

export const ProjectCollapse: React.FC<
  React.PropsWithChildren<{
    entityName: string;
    title: string;
    defaultOpen?: boolean;
  }>
> = ({ entityName, title, defaultOpen = false, children }) => {
  // Apply colors to the collapse header and border.
  const refCallback = useCallback(
    (ref: HTMLDivElement) => {
      if (ref) {
        const header = ref.getElementsByClassName('ant-collapse-header');
        if (header.length > 0) {
          const headerElement = header[0] as HTMLElement;
          headerElement.style.backgroundColor =
            PROJECT_COLORS[entityName]?.['fill'];
          headerElement.style.border = `1px solid ${PROJECT_COLORS[entityName]?.['outline']}`;
        }
      }
    },
    [entityName]
  );
  return (
    <Collapse
      defaultActiveKey={defaultOpen ? 0 : undefined}
      expandIconPosition="end"
      ref={refCallback}
      size="small"
      style={{ flex: 1 }}
      items={[
        {
          forceRender: true,
          label: (
            <span>
              {DISPLAY_NAMES[entityName] ?? 'Collection'} |{' '}
              <strong>{title}</strong>
            </span>
          ),
          children,
        },
      ]}
    ></Collapse>
  );
};
