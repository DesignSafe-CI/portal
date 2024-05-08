import React from 'react';
import { Descriptions, DescriptionsProps, Tag, Button, Flex } from 'antd';
import { useFormContext, useWatch, FieldValues } from 'react-hook-form';
import { z } from 'zod';

export const AppsSubmissionDetails: React.FC<{
  schema: { [dynamic: string]: z.ZodType };
  fields: {
    [dynamic: string]: {
      [dynamic: string]: { [dynamic: string]: any } | any;
    };
  };
  isSubmitting: boolean;
  setCurrent: CallableFunction;
}> = ({ schema, fields, isSubmitting, setCurrent }) => {
  const {
    control,
    formState: { defaultValues, isValid },
  } = useFormContext();
  const formState = useWatch({ control, defaultValue: defaultValues });

  const getChildren = (
    key: string,
    value: string | object,
    parent: z.ZodObject<any>
  ) => {
    if (typeof value === 'object') {
      if (!Object.keys(value).length) return <span>-</span>;
      const items: DescriptionsProps['items'] = Object.entries(value).map(
        ([k, v]) => {
          const isRequired =
            !(v instanceof Object) &&
            parent.shape?.[k] &&
            !parent.shape?.[k].isOptional();
          return {
            key: k,
            label: !(v instanceof Object) && (
              <span>
                {fields[key]?.[k]?.label || k}{' '}
                {isRequired && <Tag color="error">Required</Tag>}
              </span>
            ),
            children: getChildren(`${key}.${k}`, v, parent.shape?.[k]),
          };
        }
      );
      return <Descriptions colon={false} column={1} items={items} />;
    } else {
      return <span>{`${value}`}</span>;
    }
  };

  const getItems = (values: FieldValues) => {
    const items: DescriptionsProps['items'] = Object.entries(values).map(
      ([key, value]) => ({
        key: key,
        label: (
          <Flex justify="space-between" align="center">
            {key.charAt(0).toUpperCase() + key.slice(1)}
            <Button type="text" onClick={() => setCurrent(key)}>
              Edit
            </Button>
          </Flex>
        ),
        children: getChildren(key, value, schema[key] as z.AnyZodObject),
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
        <Button
          type="primary"
          htmlType="submit"
          disabled={!isValid}
          loading={isSubmitting}
        >
          Submit
        </Button>
      }
    />
  );
};
