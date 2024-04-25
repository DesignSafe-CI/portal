import {
  AppsWizard,
  AppsSubmissionForm,
  FormSchema,
  AppFormProvider,
  useAppFormState,
} from '@client/workspace';
import { TAppParamsType, TAppResponse, getAppsQuery } from '@client/hooks';
import { Await, Outlet } from 'react-router-dom';
import { Layout, Form, message, Col, Row, Flex } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect, Suspense, useMemo } from 'react';
import styles from './layout.module.css';
import { useParams, useLocation } from 'react-router-dom';
import { useGetApps } from '@client/hooks';
import { Spinner } from '@client/common-components';
// import { useForm, useField, Field, FormState } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import {
  getSystemName,
  getExecSystemFromId,
  getQueueValueForExecSystem,
  getNodeCountValidation,
  getCoresPerNodeValidation,
  getMaxMinutesValidation,
  getAllocationValidation,
  getExecSystemLogicalQueueValidation,
  isAppTypeBATCH,
  getDefaultExecSystem,
} from '@client/workspace';

import {
  useSuspenseQuery,
  useIsFetching,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';
import {
  useLoaderData,
  Link,
  NavLink,
  useNavigation,
  useSubmit,
  LoaderFunctionArgs,
} from 'react-router-dom';
import { number, z } from 'zod';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';

export const AppsViewLayoutWrapper: React.FC = () => {
  const { appId } = useParams() as TAppParamsType;
  const location = useLocation();

  const appVersion = new URLSearchParams(location.search).get('appVersion') as
    | string
    | undefined;

  const { data: app } = useGetApps({ appId, appVersion }) as {
    data: TAppResponse;
  };

  const [state, setState] = useAppFormState();

  // TODOv3: Load these from state
  const defaultSystem = 'designsafe.storage.default';
  const portalAlloc = 'DesignSafe-DCV';
  const allocations = ['A', 'DesignSafe-DCV'];

  // const hasDefaultAllocation =
  // state.allocations.loading ||
  // state.systems.storage.loading ||
  // state.allocations.hosts[defaultHost] ||
  // hasCorral
  const defaultStorageHost = 'cloud.corral.tacc.utexas.edu';
  const hasDefaultAllocation = true;
  const hasStorageSystems = true;

  let missingAllocation = false;

  const { fileInputs, parameterSet } = FormSchema(app);

  const defaultExecSystem = getExecSystemFromId(
    app,
    app.definition.jobAttributes.execSystemId
  );

  // TODOv3: dynamic exec system and queues
  const initialValues = useMemo(
    () => ({
      inputs: fileInputs.defaults,
      parameters: parameterSet.defaults,
      configuration: {
        execSystemId: defaultExecSystem?.id,
        execSystemLogicalQueue: isAppTypeBATCH(app)
          ? app.definition.jobAttributes.execSystemLogicalQueue
          : // (
            //     app.execSystems.batchLogicalQueues.find(
            //       (q) =>
            //         q.name ===
            //         (app.definition.jobAttributes.execSystemLogicalQueue ||
            //           app.execSystems.batchDefaultLogicalQueue)
            //     ) || app.execSystems.batchLogicalQueues[0]
            //   ).name
            '',
        maxMinutes: app.definition.jobAttributes.maxMinutes,
        nodeCount: app.definition.jobAttributes.nodeCount,
        coresPerNode: app.definition.jobAttributes.coresPerNode,
        allocation: isAppTypeBATCH(app)
          ? allocations.includes(portalAlloc)
            ? portalAlloc
            : allocations.length === 1
            ? allocations[0]
            : ''
          : '',
      },
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
    }),
    [app]
  );

  if (isAppTypeBATCH(app) && !hasDefaultAllocation && hasStorageSystems) {
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

  useEffect(() => {
    console.log('setting state');
    setState(initialValues);
  }, [app, initialValues]);
  useEffect(() => {
    console.log('state changed', state);
  }, [state]);

  // const exec_sys = getExecSystemFromId(app, state.execSystemId);
  // const queue = getQueueValueForExecSystem(
  //   app,
  //   exec_sys,
  //   state.execSystemLogicalQueue
  // );
  // const execSys = getDefaultExecSystem(app, app.execSystems) ?? ''

  // const currentExecSystem = getExecSystemFromId(app, state.execSystemId);

  const queue = getQueueValueForExecSystem(
    app,
    defaultExecSystem,
    app.definition.jobAttributes.execSystemLogicalQueue
  );

  const schema = {
    // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
    inputs: z.object(fileInputs.schema),
    parameters: z.object(parameterSet.schema),
    configuration: z.object({
      execSystemLogicalQueue: getExecSystemLogicalQueueValidation(
        app,
        defaultExecSystem
      ),
      maxMinutes: getMaxMinutesValidation(app, queue),
      coresPerNode: getCoresPerNodeValidation(app, queue),
      nodeCount: getNodeCountValidation(app, queue),
      allocation: getAllocationValidation(app, allocations),
    }),
    outputs: z.object({
      name: z.string().max(80),
      archiveSystemId: z.string().optional(),
      archiveSystemDir: z.string().optional(),
    }),
  };

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

  const readOnly =
    missingLicense ||
    !hasStorageSystems ||
    (app.definition.jobType === 'BATCH' && missingAllocation) ||
    systemNeedsKeys;

  return (
    // <Form
    //   disabled={readOnly}
    //   name="rootForm"
    //   layout="vertical"
    //   onValuesChange={onValuesChange}
    //   // onSubmit={(e) => {
    //   //   console.log('submitting');
    //   //   e.preventDefault();
    //   //   e.stopPropagation();
    //   //   void handleSubmit();
    //   // }}
    // >
    <Suspense
      fallback={
        <Layout>
          <h1>HELLO!!!!!!!!!!!!</h1>
          <Spinner />
        </Layout>
      }
    >
      <Layout style={layoutStyle}>
        <Header style={headerStyle}>
          <Flex justify="space-between">
            {app.definition.notes.label || app.definition.id}
            <a href="/user-guide">View User Guide</a>
          </Flex>
        </Header>
        <Content>
          <Row>
            {/* <AppFormProvider initialState={}> */}
            <Col span={14}>
              {Object.keys(state).length && (
                <AppsWizard
                  app={app}
                  schema={schema}
                  fields={{
                    parameterSet: parameterSet.fields,
                    fileInputs: fileInputs.fields,
                  }}
                  readOnly={readOnly}
                  initialValues={initialValues}
                />
              )}
            </Col>
            <Col span={10}>
              <AppsSubmissionForm readOnly={readOnly} />
            </Col>
            {/* </AppFormProvider> */}
          </Row>
          {/* <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isSubmitting,
              state.values,
            ]}
            children={([canSubmit, isSubmitting, values]) => {
              return (
                <fieldset disabled={readOnly}>
                  <Row>
                    <Col span={14}>
                      <AppsWizard
                        app={app}
                        appFormSchema={appFormSchema}
                        values={values}
                        form={form}
                        formValues={formValues}
                        setFormValues={setFormValues}
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
              );
            }}
          /> */}
        </Content>
      </Layout>
    </Suspense>
    // </Form>
  );
};

export const AppsViewLayout: React.FC = () => {
  return (
    <>
      <Suspense
        fallback={
          <Layout>
            <h1>HELLO!!!!!!!!!!!!</h1>
            <Spinner />
          </Layout>
        }
      >
        <AppFormProvider>
          <AppsViewLayoutWrapper />
        </AppFormProvider>
      </Suspense>
      <Outlet />
    </>
  );
};
