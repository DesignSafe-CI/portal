import React, { useState } from 'react';
import { useAuthenticatedUser } from '@client/hooks';
import styles from './AppsWizard.module.css';
import { useGetApps } from '@client/hooks';
import { Button, Form, Input, List, message, Steps, theme, Spin } from 'antd';

const steps = [
  {
    title: 'First',
    content: (
      <Form.Item
        name="steptest1"
        label="Stepper Field 1"
        rules={[{ required: true }]}
        // hidden={current !== 0}
      >
        <Input />
      </Form.Item>
    ),
  },
  {
    title: 'Second',
    content: (
      <Form.Item
        name="steptest2"
        label="Stepper Field 2"
        rules={[{ required: true }]}
        // hidden={current !== 1}
      >
        <Input />
      </Form.Item>
    ),
  },
  {
    title: 'Last',
    content: 'Last-content',
  },
];

export const AppsWizard: React.FC<{ appId: string; appVersion?: string }> = ({
  appId,
  appVersion,
}) => {
  const { user } = useAuthenticatedUser();
  const { data, isLoading } = useGetApps({ appId, appVersion });
  const { token } = theme.useToken();
  const [current, setCurrent] = useState(0);
  const next = () => {
    setCurrent(current + 1);
  };
  const prev = () => {
    setCurrent(current - 1);
  };
  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
  }));
  const contentStyle = {
    lineHeight: '260px',
    textAlign: 'center',
    color: token.colorTextTertiary,
    backgroundColor: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: `1px dashed ${token.colorBorder}`,
    marginTop: 16,
  };

  return (
    <>
      {isLoading && <Spin className={styles.spinner} />}
      {user && data && !isLoading && (
        <>
          {/* <Steps current={current} items={items} /> */}
          <div
            style={{
              marginTop: 24,
            }}
          >
            <Button
              style={{
                margin: '0 8px',
              }}
              onClick={() => prev()}
              disabled={!(current > 0)}
            >
              Back
            </Button>
            <Button
              type="primary"
              onClick={() => next()}
              disabled={!(current < steps.length - 1)}
            >
              Continue
            </Button>
          </div>
          <div style={contentStyle}>{steps[current].content}</div>
          <div>{data.definition.notes.label || data.definition.id}</div>
        </>
      )}
    </>
  );
};
