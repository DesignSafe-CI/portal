import React from 'react';
import { List } from 'antd';

export const AppsSubmissionForm: React.FC<{ formValues: {} }> = ({
  formValues,
}) => {
  return (
    <List>
      <List.Item>
        <b>Step 1 Value</b>: {formValues.steptest1 || 'N/A'}
      </List.Item>
      <List.Item>
        <b>Step 2 Value</b>: {formValues.steptest2 || 'N/A'}
      </List.Item>
    </List>
  );
};
