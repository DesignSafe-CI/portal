import React from 'react';
import { List, Descriptions, DescriptionsProps, Tag, Button } from 'antd';

export const AppsSubmissionForm: React.FC<{ form: {} }> = ({ form }) => {
  const getChildren = (value) => {
    if (typeof value === 'object') {
      if (!Object.keys(value).length) return <span>-</span>;
      const items: DescriptionsProps['items'] = Object.entries(value).map(
        ([k, v]) => ({
          key: k,
          label: (
            <span>
              {k} <Tag color="error">Required</Tag>
            </span>
          ),
          children: getChildren(v),
        })
      );
      return <Descriptions colon={false} column={1} items={items} />;
    } else {
      return <span>{`${value}`}</span>;
    }
  };

  const getItems = (values) => {
    const items: DescriptionsProps['items'] = Object.entries(values).map(
      ([key, value]) => ({
        key: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        children: getChildren(value),
      })
    );
    return items;
  };

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting, state.values]}
      children={([canSubmit, isSubmitting, values]) => (
        <Descriptions
          bordered
          size="small"
          column={1}
          title="Summary"
          items={getItems(values)}
          layout="vertical"
          extra={
            <>
              <Button type="primary" htmlType="submit" disabled={!canSubmit}>
                {isSubmitting ? '...' : 'Submit'}
              </Button>
            </>
          }
        />
      )}
    />
  );
};
