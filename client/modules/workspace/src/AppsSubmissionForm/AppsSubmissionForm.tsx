import React, { useEffect } from 'react';
import { List, Descriptions, DescriptionsProps, Tag, Button } from 'antd';
import { useAppFormState } from '../AppsWizard/AppsWizard';

export const AppsSubmissionForm: React.FC<{
  canSubmit: boolean;
  isSubmitting: boolean;
  values: {};
  handleSubmit;
}> = ({ readOnly }) => {
  const [state, setState] = useAppFormState();
  useEffect(() => {
    console.log('state changed', state);
  }, [state]);

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
    <Descriptions
      bordered
      size="small"
      column={1}
      title="Summary"
      items={getItems(state)}
      layout="vertical"
      extra={
        <>
          <Button
            type="primary"
            htmlType="submit"
            disabled={readOnly}
            onClick={(e) => {
              console.log('submitting');
              e.preventDefault();
              e.stopPropagation();
              // void handleSubmit();
            }}
          >
            {/* {isSubmitting ? '...' : 'Submit'} */}
          </Button>
        </>
      }
    />
  );
};
