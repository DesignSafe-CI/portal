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
import { z, ZodTypeAny } from 'zod';
import { TField, fieldDisplayOrder } from '../AppsWizard/AppsFormSchema';
import { JobSubmitButton } from '../JobSubmitButton/JobSubmitButton';
import styles from './AppsSubmissionDetails.module.css';
import { TTapisApp } from '@client/hooks';

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

// For summary, it is considered required : only if it is required and value is not valid.
function isFieldRequired(
  fieldSchema: ZodTypeAny | undefined,
  value: unknown
): boolean {
  return (
    (!(value instanceof Object) &&
      fieldSchema &&
      !fieldSchema.isOptional() &&
      !fieldSchema.safeParse(value).success) ??
    false
  );
}

export const AppsSubmissionDetails: React.FC<{
  schema: { [dynamic: string]: z.ZodType };
  fields: {
    [dynamic: string]: {
      [dynamic: string]: { [dynamic: string]: TField } | TField;
    };
  };
  isSubmitting: boolean;
  current: string;
  setCurrent: CallableFunction;
  definition: TTapisApp;
}> = ({ schema, fields, isSubmitting, current, setCurrent, definition }) => {
  const {
    control,
    formState: { defaultValues, isValid },
  } = useFormContext();
  const formState = useWatch({ control, defaultValue: defaultValues });
  // const getChildren = (
  //   key: string,
  //   value: string | object,
  //   parent: z.AnyZodObject,
  //   index: number
  // ) => {
  //   if (typeof value === 'object') {
  //     if (!Object.keys(value).length) return <span>-</span>;
  //     const items: DescriptionsProps['items'] = [];
  //     const entries = Object.entries(value);
  //     console.dir(entries);
  //     if (key in fieldDisplayOrder) {
  //       const displayOrder =
  //         fieldDisplayOrder[key as keyof typeof fieldDisplayOrder];
  //       entries.sort(
  //         (a, b) => displayOrder.indexOf(a[0]) - displayOrder.indexOf(b[0])
  //       );
  //       // console.log('displayOrder');
  //       // console.log(displayOrder);
  //     }
  //     // let addedSchedulerOptions = false;

  //     entries.forEach(([k, v], childIndex) => {
  //       // console.log('key');
  //       // console.log(key);
  //       // console.log('value');
  //       // console.dir(value);
  //       // console.log('parent');
  //       // console.log(parent.shape);
  //       // console.log('index');
  //       // console.log(index);
  //       // console.log('entries');
  //       // console.log(entries);
  //       // console.log('k');
  //       // console.log(k);
  //       // console.log('v');
  //       // console.log(v);
  //       // console.log('childIndex');
  //       // console.log(childIndex);
  //       if (
  //         definition.notes.hideQueue &&
  //         key === 'configuration' &&
  //         k === 'execSystemLogicalQueue'
  //       ) {
  //         return; // Hide the queue, if the app definition requires it
  //       }
  //       if (
  //         definition.notes.hideAllocation &&
  //         key === 'configuration' &&
  //         k === 'allocation'
  //       ) {
  //         return; // Hide the allocation, if that field is true
  //       }
  //       // if (
  //       //   definition.jobAttributes.parameterSet.schedulerOptions.some(
  //       //     (opt) => opt.name === 'TACC Reservation'
  //       //   ) &&
  //       //   key === 'configuration' &&
  //       //   !addedSchedulerOptions
  //       // ) {
  //       //   addedSchedulerOptions = true;
  //       //   const schedulerOpt =
  //       //     definition.jobAttributes.parameterSet.schedulerOptions.find(
  //       //       (opt) => opt.name === 'TACC Reservation'
  //       //     );

  //       //   items.push({
  //       //     key: 'TACC Reservation',
  //       //     label: <span>{'TACC Reservation'} </span>,
  //       //     children: <span>{schedulerOpt?.arg ?? ''}</span>,
  //       //     style: {
  //       //       padding: '8px',
  //       //       backgroundColor: childIndex % 2 === 0 ? '#fff' : '#f4f4f4',
  //       //       borderBottom: '1px solid #DBDBDB',
  //       //     },
  //       //   });
  //       // }
  //       if (
  //         key === 'parameters' &&
  //         k === 'schedulerOptions' &&
  //         definition.jobAttributes.parameterSet.schedulerOptions.some(
  //           (opt) => opt.name === 'TACC Reservation'
  //         )
  //       ) {
  //         // Skip showing schedulerOptions in parameters if it includes TACC Reservation
  //         return;
  //       }

  //       if (v instanceof Object) {
  //         Object.entries(v as object).forEach(([kk, vv], zchildIndex) => {
  //           const nestedFieldSchema = parent?.shape?.[k]?.shape?.[kk];
  //           const isRequired = isFieldRequired(nestedFieldSchema, vv);
  //           // console.log('nestedFieldSchema');
  //           // console.log(nestedFieldSchema);
  //           // console.log('parent');
  //           // console.dir(parent);
  //           // console.log('???');
  //           // console.dir(items);
  //           items.push({
  //             key: kk,
  //             label: (
  //               <span>
  //                 {String(fields[key]?.[kk]?.label || kk)}{' '}
  //                 {isRequired && (
  //                   <ConfigProvider theme={tagTheme}>
  //                     <Tag className="required" style={{ marginLeft: 10 }}>
  //                       Required
  //                     </Tag>
  //                   </ConfigProvider>
  //                 )}
  //               </span>
  //             ),
  //             children: getChildren(
  //               `${key}.${kk}`,
  //               vv,
  //               parent?.shape?.[kk],
  //               zchildIndex
  //             ),
  //             style: {
  //               padding: '8px',
  //               backgroundColor: zchildIndex % 2 === 0 ? '#fff' : '#f4f4f4',
  //               borderBottom: '1px solid #DBDBDB',
  //             },
  //           });
  //           // console.log('???');
  //           // console.dir(items);
  //         });
  //       } else {
  //         const fieldSchema = parent?.shape?.[k];
  //         // console.log('fieldSchema');
  //         // console.log(fieldSchema.shape);
  //         const isRequired = isFieldRequired(fieldSchema, v);
  //         // console.log('???');
  //         // console.dir(items);
  //         // console.log('^^^^^^');
  //         // console.log([k]);
  //         items.push({
  //           key: k,
  //           label: (
  //             <span>
  //               {String(fields[key]?.[k]?.label || k)}{' '}
  //               {isRequired && (
  //                 <ConfigProvider theme={tagTheme}>
  //                   <Tag className="required" style={{ marginLeft: 10 }}>
  //                     Required
  //                   </Tag>
  //                 </ConfigProvider>
  //               )}
  //             </span>
  //           ),
  //           children: getChildren(
  //             `${key}.${k}`,
  //             v,
  //             parent?.shape?.[k],
  //             childIndex
  //           ),
  //           style: {
  //             padding: '8px',
  //             backgroundColor: childIndex % 2 === 0 ? '#fff' : '#f4f4f4',
  //             borderBottom: '1px solid #DBDBDB',
  //           },
  //         });
  //         // console.log('items');
  //         // console.log(items);
  //       }
  //     });
  //     return (
  //       <Descriptions
  //         bordered={false}
  //         colon={false}
  //         column={1}
  //         items={items}
  //         labelStyle={{
  //           textAlign: 'left',
  //           maxWidth: '240px',
  //           minWidth: '220px',
  //           color: 'rgba(0, 0, 0, 0.88)',
  //           font: 'normal normal 14px Helvetica Neue',
  //           alignItems: 'center',
  //         }}
  //         contentStyle={{ color: '#484848', fontWeight: 'bold', border: '0' }}
  //       />
  //     );
  //   } else {
  //     return <span>{`${value}`}</span>;
  //   }
  // };
  const getChildren = (
    key: string,
    value: string | object,
    parent: z.AnyZodObject,
    index: number
  ) => {
    if (typeof value === 'object') {
      if (!Object.keys(value).length) return <span>-</span>;

      const items: DescriptionsProps['items'] = [];
      const entries = Object.entries(value);

      if (key in fieldDisplayOrder) {
        const displayOrder =
          fieldDisplayOrder[key as keyof typeof fieldDisplayOrder];
        entries.sort(
          (a, b) => displayOrder.indexOf(a[0]) - displayOrder.indexOf(b[0])
        );
        // console.log('fieldDisplayOrder');
        // console.log(displayOrder);
      }

      const visibleItems: DescriptionsProps['items'] = [];
      let addedSchedulerOptions = false;

      entries.forEach(([k, v], childIndex) => {
        // Skip certain fields
        if (
          definition.notes.hideQueue &&
          key === 'configuration' &&
          k === 'execSystemLogicalQueue'
        )
          return;

        if (
          definition.notes.hideAllocation &&
          key === 'configuration' &&
          k === 'allocation'
        )
          return;

        if (
          key === 'parameters' &&
          k === 'schedulerOptions' &&
          definition.jobAttributes.parameterSet.schedulerOptions.some(
            (opt) => opt.name === 'TACC Reservation'
          )
        )
          return;

        // Add the regular field
        const pushItem = (
          itemKey: string,
          itemLabel: React.ReactNode,
          itemChildren: React.ReactNode,
          bgIndex: number
        ) => {
          visibleItems.push({
            key: itemKey,
            label: itemLabel,
            children: itemChildren,
            style: {
              padding: '8px',
              backgroundColor: bgIndex % 2 === 0 ? '#fff' : '#f4f4f4',
              borderBottom: '1px solid #DBDBDB',
            },
          });
        };

        if (v instanceof Object) {
          Object.entries(v as object).forEach(([kk, vv]) => {
            const nestedFieldSchema = parent?.shape?.[k]?.shape?.[kk];
            const isRequired = isFieldRequired(nestedFieldSchema, vv);

            const label = (
              <span>
                {String(fields[key]?.[kk]?.label || kk)}{' '}
                {isRequired && (
                  <ConfigProvider theme={tagTheme}>
                    <Tag className="required" style={{ marginLeft: 10 }}>
                      Required
                    </Tag>
                  </ConfigProvider>
                )}
              </span>
            );

            const children = getChildren(
              `${key}.${kk}`,
              vv,
              parent?.shape?.[kk],
              visibleItems.length
            );
            pushItem(kk, label, children, visibleItems.length);
          });
        } else {
          const fieldSchema = parent?.shape?.[k];
          // console.log('fieldSchema');
          // console.log(fieldSchema);
          const isRequired = isFieldRequired(fieldSchema, v);

          const label = (
            <span>
              {String(fields[key]?.[k]?.label || k)}{' '}
              {isRequired && (
                <ConfigProvider theme={tagTheme}>
                  <Tag className="required" style={{ marginLeft: 10 }}>
                    Required
                  </Tag>
                </ConfigProvider>
              )}
            </span>
          );

          const children = getChildren(
            `${key}.${k}`,
            v,
            parent?.shape?.[k],
            visibleItems.length
          );
          pushItem(k, label, children, visibleItems.length);

          // Insert TACC Reservation after execSystemLogicalQueue
          if (
            definition.jobAttributes.parameterSet.schedulerOptions.some(
              (opt) => opt.name === 'TACC Reservation'
            ) &&
            key === 'configuration' &&
            k === 'execSystemLogicalQueue' &&
            !addedSchedulerOptions
          ) {
            addedSchedulerOptions = true;
            const schedulerOpt =
              definition.jobAttributes.parameterSet.schedulerOptions.find(
                (opt) => opt.name === 'TACC Reservation'
              );

            pushItem(
              'schedulerOptions',
              <span>{'TACC Reservation'}</span>,
              <span>{schedulerOpt?.arg ?? ''}</span>,
              visibleItems.length
            );
          }
        }
      });

      return (
        <Descriptions
          bordered={false}
          colon={false}
          column={1}
          items={visibleItems}
          labelStyle={{
            textAlign: 'left',
            maxWidth: '240px',
            minWidth: '220px',
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
    const items: DescriptionsProps['items'] = Object.entries(values)
      // Filter out empty items. Example: app with no inputs
      .filter(
        ([_, value]) =>
          typeof value !== 'object' || Object.keys(value).length > 0
      )
      // Filter out outputs fields for interactive apps
      .filter(
        ([key]) =>
          !(key === 'outputs' && definition.notes.isInteractive === true)
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
            {current !== key && (
              <Button
                type="link"
                onClick={() => setCurrent(key)}
                style={{ fontWeight: 'bold' }}
              >
                Edit
              </Button>
            )}
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
          <JobSubmitButton
            disabled={!isValid}
            loading={isSubmitting}
            interactive={definition.notes.isInteractive}
          />
        }
      />
    </Card>
  );
};
