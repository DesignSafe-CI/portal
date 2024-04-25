import React, { useEffect } from 'react';
import { List, Descriptions, DescriptionsProps, Tag, Button } from 'antd';
import { useAppFormState } from '../AppsWizard/AppsWizard';
import {
  FormProvider,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';

export const AppsSubmissionForm: React.FC<{
  fields?: object;
  isPending: boolean;
}> = ({ fields, isPending }) => {
  const {
    handleSubmit,
    control,
    formState: { defaultValues, isSubmitting, isValid, errors },
  } = useFormContext();
  const formState = useWatch({ control, defaultValue: defaultValues });

  const getChildren = (value) => {
    if (typeof value === 'object') {
      if (!Object.keys(value).length) return <span>-</span>;
      const items: DescriptionsProps['items'] = Object.entries(value).map(
        ([k, v]) => ({
          key: k,
          label: (
            <span>
              {k}
              {/* {k} <Tag color="error">Required</Tag> */}
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
      items={getItems(formState)}
      layout="vertical"
      extra={
        <>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!isValid}
            loading={isSubmitting || isPending}
            // onClick={(e) => {
            //   console.log('submitting');
            //   e.preventDefault();
            //   e.stopPropagation();
            //   // void handleSubmit();
            // }}
          >
            {isSubmitting || isPending ? '' : 'Submit'}
          </Button>
        </>
      }
    />
  );
};
