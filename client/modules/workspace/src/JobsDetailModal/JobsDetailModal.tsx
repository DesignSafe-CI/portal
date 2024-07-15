import React, { useState, useEffect } from 'react';
import {
  Collapse,
  Descriptions,
  DescriptionsProps,
  Modal,
  Layout,
  Button,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useGetApps, useGetJobs, TAppResponse, TTapisJob } from '@client/hooks';
import styles from './JobsDetailModal.module.css';
import {
  getOutputPath,
  getStatusText,
  isOutputState,
  isTerminalState,
  getJobDisplayInformation,
  TJobDisplayInputOrParameter,
  TJobDisplayInfo,
  isInteractiveJob,
} from '../utils/jobs';
import { formatDateTimeFromValue } from '../utils/timeFormat';
import { JobActionButton } from '../JobsListing/JobsListing';
import { Spinner } from '@client/common-components';
import { JobsReuseInputsButton } from '../JobsReuseInputsButton/JobsReuseInputsButton';

type InputParamsObj = {
  [key: string]: string;
};
const reduceInputParameters = (data: TJobDisplayInputOrParameter[]) =>
  data.reduce((acc: InputParamsObj, item: TJobDisplayInputOrParameter) => {
    acc[item.label] = item.value ?? '';
    return acc;
  }, {});

export const JobsDetailModalBody: React.FC<{
  jobData: TTapisJob;
  appData: TAppResponse | undefined;
}> = ({ jobData, appData }) => {
  const jobDisplay = getJobDisplayInformation(
    jobData,
    appData
  ) as TJobDisplayInfo;

  const outputLocation = getOutputPath(jobData);
  const created = formatDateTimeFromValue(new Date(jobData.created));
  const lastUpdated = formatDateTimeFromValue(new Date(jobData.lastUpdated));
  const hasFailedStatus = jobData.status === 'FAILED';

  const appDataObj = {
    'App ID': jobDisplay.appId,
    ...('appVersion' in jobDisplay
      ? { 'App Version': jobDisplay.appVersion }
      : {}),
  };
  const lastMessageTitle = hasFailedStatus
    ? 'Failure Report'
    : 'Last Status Message';
  const statusDataObj = {
    Submitted: created,
    [`${getStatusText(jobData.status)}`]: lastUpdated,
    [lastMessageTitle]: (
      <Collapse
        defaultActiveKey={[]}
        expandIconPosition="end"
        size="small"
        bordered={false}
        style={{ background: '#fff' }}
        items={[
          {
            label: (
              <span>
                {hasFailedStatus ? 'Last Status Message' : 'System Output'}
              </span>
            ),
            children: <pre>{jobData.lastMessage}</pre>,
          },
        ]}
      ></Collapse>
    ),
    ...(jobData.remoteOutcome && { 'Remote Outcome': jobData.remoteOutcome }),
  };

  if (jobData.remoteOutcome) {
    statusDataObj['Remote Outcome'] = jobData.remoteOutcome;
  }

  const configDataObj = {
    'Execution System': jobDisplay.systemName,
    'Max Minutes': String(jobData.maxMinutes),
    queue: 'queue' in jobDisplay ? jobDisplay.queue : undefined,
    'Cores On Each Node':
      'coresPerNode' in jobDisplay
        ? String(jobDisplay.coresPerNode)
        : undefined,
    'Node Count':
      'coresPerNode' in jobDisplay
        ? String(jobDisplay.coresPerNode)
        : undefined,
    Allocation: 'allocation' in jobDisplay ? jobDisplay.allocation : undefined,
    'Execution Directory':
      'execSystemExecDir' in jobData ? jobData.execSystemExecDir : undefined,
  };
  const outputDataObj = {
    'Job Name': jobData.name,
    'Output Location': outputLocation,
    'Archive System': jobData.archiveSystemId,
    'Archive Directory': jobData.archiveSystemDir,
  };

  const inputDataObj = {
    ...reduceInputParameters(jobDisplay.inputs),
  };

  const paramsDataObj = {
    ...reduceInputParameters(jobDisplay.appArgs),
    ...reduceInputParameters(jobDisplay.envVars),
  };

  const valueStyle = {
    paddingLeft: '40px',
    paddingBottom: '0px',
    width: '100%',
  };

  const labelStyle = {
    color: '#484848',
    fontWeight: 700,
    paddingTop: '10px',
    border: '0',
  };

  const baseRowStyle = {
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingBottom: '5px',
  };

  const itemLabelStyle = {
    color: 'rgba(0, 0, 0, 0.88)',
    font: 'normal normal 14px Helvetica Neue',
    paddingBottom: '0px',
  };

  interface DisplayItemsProps {
    items: DescriptionsProps['items'];
  }

  const DisplayItems: React.FC<DisplayItemsProps> = ({ items }) => (
    <Descriptions
      size="small"
      bordered={false}
      contentStyle={{ paddingBottom: '0px' }}
      labelStyle={itemLabelStyle}
      style={{ paddingLeft: '40px', paddingBottom: 0 }}
      layout="vertical"
      column={1}
      items={items}
    />
  );

  const getItems = (
    data: Record<string, string | undefined>
  ): DescriptionsProps['items'] =>
    Object.entries(data)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({
        label: key,
        children: <span style={valueStyle}>{value}</span>,
      }));

  const dataObjects = [
    { label: 'Application', data: appDataObj },
    { label: 'Status', data: statusDataObj },
    { label: 'Inputs', data: inputDataObj },
    { label: 'Parameters', data: paramsDataObj },
    { label: 'Configuration', data: configDataObj },
    { label: 'Outputs', data: outputDataObj },
  ];

  const items: DescriptionsProps['items'] = dataObjects
    .filter(({ data }) => Object.keys(data).length > 0)
    .map(({ label, data }, index) => {
      const backgroundColor = index % 2 === 0 ? '#fff' : '#f4f4f4';

      return {
        label,
        children: <DisplayItems items={getItems(data)} />,
        labelStyle,
        style: {
          ...baseRowStyle,
          backgroundColor,
        },
      };
    });

  return (
    <div className={styles['modal-body-container']}>
      <div className={`${styles['left-panel']}`}>
        <dl>
          {!isOutputState(jobData.status) && (
            <>
              <dt>Execution:</dt>
              <dd>
                <Button
                  type="link"
                  href={`data/browser/tapis/${
                    jobData.execSystemId
                  }/${encodeURIComponent(jobData.execSystemExecDir)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View in Execution Directory
                </Button>
              </dd>
            </>
          )}
          <dt>Output:</dt>
          <dd>
            <Button
              type="link"
              href={`data/browser/tapis/${
                jobData.archiveSystemId
              }/${encodeURIComponent(jobData.archiveSystemDir)}`}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!isOutputState(jobData.status)}
            >
              {isOutputState(jobData.status) ? 'View Output' : 'Output Pending'}
            </Button>
          </dd>
        </dl>
        {isTerminalState(jobData.status) &&
          (isInteractiveJob(jobData) ? (
            <JobActionButton
              uuid={jobData.uuid}
              title="Resubmit Job"
              operation="resubmitJob"
              type="primary"
            />
          ) : (
            <JobsReuseInputsButton job={jobData} />
          ))}
        {!isTerminalState(jobData.status) && (
          <JobActionButton
            uuid={jobData.uuid}
            title="Cancel Job"
            operation="cancelJob"
            type="primary"
            danger
          />
        )}
      </div>
      <Descriptions
        size="small"
        bordered={false}
        colon={false}
        layout="vertical"
        column={1}
        className={`${styles['right-panel']} ${styles['panel-content']}`}
        items={items}
      />
    </div>
  );
};

export const JobsDetailModal: React.FC<{ uuid: string }> = ({ uuid }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('..', { relative: 'path' });
  };
  const { data: jobData, isLoading } = useGetJobs('select', { uuid }) as {
    data: TTapisJob;
    isLoading: boolean;
  };

  const appId = jobData?.appId;
  const appVersion = jobData?.appVersion;

  const { data: appData, isLoading: isAppLoading } = useGetApps({
    appId,
    appVersion,
  }) as {
    data: TAppResponse;
    isLoading: boolean;
  };

  useEffect(() => {
    setIsModalOpen(!!uuid);
  }, [uuid]);

  return (
    <Modal
      className={`${styles.root} job-history-modal`}
      title={
        <>
          <header>
            Job Detail: {uuid}
            {jobData && (
              <dl className={styles['header-details']}>
                <dt>Job UUID: </dt>
                <dd>{jobData.uuid}</dd>
                <dt>Application: </dt>
                <dd>{JSON.parse(jobData.notes).label || jobData.appId}</dd>
                <dt>System: </dt>
                <dd>{jobData.execSystemId}</dd>
              </dl>
            )}
          </header>
        </>
      }
      width="60%"
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
    >
      {isLoading && isAppLoading ? (
        <Layout style={{ height: 300 }}>
          <Spinner />
        </Layout>
      ) : (
        jobData && <JobsDetailModalBody jobData={jobData} appData={appData} />
      )}
    </Modal>
  );
};
