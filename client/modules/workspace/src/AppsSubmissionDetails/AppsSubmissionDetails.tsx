import React from 'react';
import {
  Card,
  ConfigProvider,
  Descriptions,
  DescriptionsProps,
  Tag,
  ThemeConfig,
  Button,
  Flex,
} from 'antd';
import { useFormContext, useWatch, FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { TField } from '../AppsWizard/AppsFormSchema';
import { PrimaryButton } from '@client/common-components';
import styles from './AppsSubmissionDetails.module.css';

const tagTheme: ThemeConfig = {
  token: {
    fontFamily: 'Helvetica Neue',
    fontSizeSM: 12,
    borderRadiusSM: 3,
    lineWidth: 0,
  },
  components: {
    Tag: {
      defaultBg: '#EB6E6E 0% 0% no-repeat padding-box',
      defaultColor: '#FFFFFF',
    },
  },
};

const itemStyle = {
  paddingBottom: 0,
  backgroundColor: 'inherit',
};

const descriptionCardStyle = {
  background: '#f4f4f4',
  backgroundOrigin: 'padding-box',
  border: '1px solid #dbdbdb',
};

export const AppsSubmissionDetails: React.FC<{
  schema: { [dynamic: string]: z.ZodType };
  fields: {
    [dynamic: string]: {
      [dynamic: string]: { [dynamic: string]: TField } | TField;
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
    parent: z.AnyZodObject,
    index: number
  ) => {
    if (typeof value === 'object') {
      if (!Object.keys(value).length) return <span>-</span>;
      const items: DescriptionsProps['items'] = [];
      Object.entries(value).forEach(([k, v], childIndex) => {
        const fieldSchema = parent?.shape?.[k];
        // For summary, it is considered required :
        // only if it is required and value is not valid.
        const isRequired =
          !(v instanceof Object) &&
          fieldSchema &&
          !fieldSchema.isOptional() &&
          !fieldSchema?.safeParse(v)?.success;
        if (v instanceof Object) {
          Object.entries(v as object).forEach(([kk, vv], zchildIndex) => {
            items.push({
              key: kk,
              label: (
                <span>
                  {fields[key]?.[kk]?.label || kk}{' '}
                  {isRequired && (
                    <ConfigProvider theme={tagTheme}>
                      <Tag className="required" style={{ marginLeft: 10 }}>
                        Required
                      </Tag>
                    </ConfigProvider>
                  )}
                </span>
              ),
              children: getChildren(
                `${key}.${kk}`,
                vv,
                parent?.shape?.[kk],
                zchildIndex
              ),
              style: {
                padding: '8px',
                backgroundColor: zchildIndex % 2 === 0 ? '#fff' : '#f4f4f4',
                borderBottom: '1px solid #DBDBDB',
              },
            });
          });
        } else {
          items.push({
            key: k,
            label: (
              <span>
                {fields[key]?.[k]?.label || k}{' '}
                {isRequired && (
                  <ConfigProvider theme={tagTheme}>
                    <Tag className="required" style={{ marginLeft: 10 }}>
                      Required
                    </Tag>
                  </ConfigProvider>
                )}
              </span>
            ),
            children: getChildren(
              `${key}.${k}`,
              v,
              parent?.shape?.[k],
              childIndex
            ),
            style: {
              padding: '8px',
              backgroundColor: childIndex % 2 === 0 ? '#fff' : '#f4f4f4',
              borderBottom: '1px solid #DBDBDB',
            },
          });
        }
      });
      return (
        <Descriptions
          bordered={false}
          colon={false}
          column={1}
          items={items}
          labelStyle={{
            textAlign: 'left',
            width: '200px',
            color: 'rgba(0, 0, 0, 0.88)',
            font: 'normal normal 14px Helvetica Neue',
            alignItems: 'center',
          }}
          contentStyle={{ color: '#484848', fontWeight: 'bold', border: '0' }}
        />
      );
    } else {
      return <span>{`${value}`}</span>;
    }
  };

  const getItems = (values: FieldValues) => {
    // Filter out empty items. Example: app with no inputs
    const items: DescriptionsProps['items'] = Object.entries(values)
      .filter(
        ([_, value]) =>
          typeof value !== 'object' || Object.keys(value).length > 0
      )
      .map(([key, value], index) => ({
        key: key,
        label: (
          <Flex
            justify="space-between"
            align="center"
            style={{ width: '100%' }}
          >
            <div style={{ flex: 1 }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <Button
              type="link"
              onClick={() => setCurrent(key)}
              style={{ fontWeight: 'bold' }}
            >
              Edit
            </Button>
          </Flex>
        ),
        children: getChildren(key, value, schema[key] as z.AnyZodObject, index),
        style: itemStyle,
        labelStyle: {
          color: 'rgba(0, 0, 0, 0.88)',
          fontWeight: 'bold',
          backgroundColor: 'inherit',
          width: '100%',
          borderBottom: '1px solid #707070',
          lineHeight: 4,
        },
        contentStyle: {
          color: '#484848',
          border: '0',
          backgroundColor: 'inherit',
        },
      }));
    return items;
  };

  return (
    <Card style={descriptionCardStyle}>
      <Descriptions
        bordered={false}
        colon={false}
        size="small"
        column={1}
        title="Summary"
        items={getItems(formState)}
        layout="vertical"
        style={itemStyle}
        className={styles.root}
        extra={
          <PrimaryButton
            htmlType="submit"
            disabled={!isValid}
            loading={isSubmitting}
            style={{ width: 120 }}
          >
            Submit Job
          </PrimaryButton>
        }
      />
    </Card>
  );
};
