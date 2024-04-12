import { AppsWizard, AppsSubmissionForm, FormSchema } from '@client/workspace';
import { TAppParamsType, TAppResponse } from '@client/hooks';
import { Layout, Form, message, Col, Row, Flex } from 'antd';
import React, { useState } from 'react';
import styles from './layout.module.css';
import { useParams, useLocation } from 'react-router-dom';
import { useGetApps } from '@client/hooks';
import { Spinner } from '@client/common-components';
import { useForm, useField, Field, FormState } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { getSystemName } from '@client/workspace';

export const AppsViewLayout: React.FC = () => {
  const { appId } = useParams() as TAppParamsType;
  const location = useLocation();

  const appVersion = new URLSearchParams(location.search).get('appVersion') as
    | string
    | undefined;

  const { data: app, isLoading } = useGetApps({ appId, appVersion }) as {
    data: TAppResponse;
    isLoading: boolean;
  };
  const defaultSystem = 'designsafe.storage.default';

  const getFormSchema = () => {
    return app && !isLoading ? FormSchema(app) : {};
  };
  const getDefaultValues = (appFormSchema) => {
    return app && !isLoading // initial form values
      ? {
          inputs: appFormSchema.fileInputs.defaults,
          parameters: appFormSchema.parameterSet.defaults,
          configuration: {
            maxMinutes: app.definition.jobAttributes.maxMinutes,
            nodeCount: app.definition.jobAttributes.nodeCount,
            coresPerNode: app.definition.jobAttributes.coresPerNode,
          },
          testsss: 'hello world',
          name: `${app.definition.id}-${app.definition.version}_${
            new Date().toISOString().split('.')[0]
          }`,
          outputs: {
            name: `${app.definition.id}-${app.definition.version}_${
              new Date().toISOString().split('.')[0]
            }`,
            archiveSystemId:
              app.definition.jobAttributes.archiveSystemId || defaultSystem,
            archiveSystemDir: app.definition.jobAttributes.archiveSystemDir,

            // Move to submission
            archiveOnAppError: true,
            appId: app.definition.id,
            appVersion: app.definition.version,
            execSystemId: app.definition.jobAttributes.execSystemId,
          },
        }
      : {};
  };
  const appFormSchema = getFormSchema();
  const initialValues = getDefaultValues(appFormSchema);

  const portalAlloc = 'DesignSafe-DCV';
  const allocations = ['A', 'B'];

  // const hasDefaultAllocation =
  // state.allocations.loading ||
  // state.systems.storage.loading ||
  // state.allocations.hosts[defaultHost] ||
  // hasCorral
  const defaultStorageHost = 'cloud.corral.tacc.utexas.edu';
  const hasDefaultAllocation = true;
  const hasStorageSystems = true;

  let missingAllocation = false;
  if (app && app.definition.jobType === 'BATCH') {
    initialValues.configuration.execSystemLogicalQueue = (
      (app.definition.jobAttributes.execSystemLogicalQueue
        ? app.exec_sys.batchLogicalQueues.find(
            (q) =>
              q.name === app.definition.jobAttributes.execSystemLogicalQueue
          )
        : app.exec_sys.batchLogicalQueues.find(
            (q) => q.name === app.exec_sys.batchDefaultLogicalQueue
          )) || app.exec_sys.batchLogicalQueues[0]
    ).name;
    if (allocations.includes(portalAlloc)) {
      initialValues.configuration.allocation = portalAlloc;
    } else {
      initialValues.configuration.allocation =
        allocations.length === 1 ? allocations[0] : '';
    }
    if (!hasDefaultAllocation && hasStorageSystems) {
      // jobSubmission.error = true;
      // jobSubmission.response = {
      //   message: `You need an allocation on ${getSystemName(
      //     defaultStorageHost
      //   )} to run this application.`,
      // };
      missingAllocation = true;
    } else if (!allocations.length) {
      // jobSubmission.error = true;
      // jobSubmission.response = {
      //   message: `You need an allocation on ${getSystemName(
      //     app.exec_sys.host
      //   )} to run this application.`,
      // };
      missingAllocation = true;
    }
    initialValues.inputs.test = 'test2';
  }
  console.log(initialValues);

  const [formValues, setFormValues] = useState(initialValues);
  const onFinish = () => message.success('Form validated');
  const onValuesChange = (_, allValues) => {
    console.log('updating');
    setFormValues(allValues);
  };

  const form = useForm({
    defaultValues: initialValues,
    // defaultState: FormState,
    validatorAdapter: zodValidator,
    onSubmitInvalid: () => console.log('invalid form'),
    onSubmit: async ({ value }) => {
      // Do something with form data
      console.log('over here');
      console.log(value);
    },
  });
  console.log(form);
  console.log(form.state);
  form.state.values = initialValues;
  console.log(form.state);

  if (isLoading) return <Spinner />;

  const { Header, Footer, Sider, Content } = Layout;
  const headerStyle = {
    background: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: '1px solid #707070',
    fontSize: 16,
  };
  const layoutStyle = {
    overflow: 'hidden',
  };
  const { systemNeedsKeys, pushKeysSystem } = app;
  const missingLicense = app.license.type && !app.license.enabled;

  let readOnly =
    missingLicense ||
    !hasStorageSystems ||
    form.state.isSubmitting ||
    (app.definition.jobType === 'BATCH' && missingAllocation) ||
    systemNeedsKeys;
  // readOnly = true;
  return (
    <Form
      disabled={readOnly}
      name="rootForm"
      layout="vertical"
      onValuesChange={onValuesChange}
      // onSubmit={(e) => {
      //   console.log('submitting');
      //   e.preventDefault();
      //   e.stopPropagation();
      //   void handleSubmit();
      // }}
    >
      <Layout style={layoutStyle}>
        <Header style={headerStyle}>
          <Flex justify="space-between">
            {app.definition.notes.label || app.definition.id}
            <a href="/user-guide">View User Guide</a>
          </Flex>
        </Header>
        <Content>
          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isSubmitting,
              state.values,
            ]}
            children={([canSubmit, isSubmitting, values]) => (
              <fieldset disabled={readOnly}>
                <Row>
                  <Col span={14}>
                    <AppsWizard
                      app={app}
                      appFormSchema={appFormSchema}
                      values={values}
                      Field={form.Field}
                      form={form}
                      formValues={formValues}
                    />
                  </Col>
                  <Col span={10}>
                    <AppsSubmissionForm
                      canSubmit={canSubmit}
                      isSubmitting={isSubmitting}
                      values={values}
                      handleSubmit={form.handleSubmit}
                    />
                  </Col>
                </Row>
              </fieldset>
            )}
          />
        </Content>
      </Layout>
    </Form>
  );
};
