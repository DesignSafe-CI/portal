import React, { useState } from 'react';
// import styles from './AppsWizard.module.css';
import { Button, Form, Input, theme } from 'antd';
import { TAppResponse } from '@client/hooks';

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

export const AppsWizard: React.FC<{ data: TAppResponse }> = ({ data }) => {
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
    textAlign: 'center' as const,
    color: token.colorTextTertiary,
    backgroundColor: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: `1px dashed ${token.colorBorder}`,
    marginTop: 16,
  };

  return (
    data && (
      <>
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
    )
  );
};
