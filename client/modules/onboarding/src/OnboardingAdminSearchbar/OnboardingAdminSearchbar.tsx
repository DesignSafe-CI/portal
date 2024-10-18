import React, { useEffect, useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { SecondaryButton } from '@client/common-components';
// import styles from './OnboardingAdminSearchbar.module.css';

export const OnboardingAdminSearchbar: React.FC<{ disabled: boolean }> = ({
  disabled,
}) => {
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<string | null>(searchParams.get('q'));
  const onSubmit = (queryString: string) => {
    const newSearchParams = searchParams;
    if (queryString) {
      newSearchParams.set('q', queryString);
    } else {
      newSearchParams.delete('q');
    }

    setSearchParams(newSearchParams);
  };

  useEffect(() => {}, [searchParams, query]);

  return (
    <Form
      onFinish={(data) => onSubmit(data.query)}
      form={form}
      name="onboarding_search"
      style={{ display: 'inline-flex' }}
      disabled={disabled}
    >
      <Form.Item name="query" style={{ marginBottom: 0 }} initialValue={query}>
        <Input placeholder="Search for a user" style={{ width: '250px' }} />
      </Form.Item>
      <SecondaryButton
        htmlType="submit"
        icon={<SearchOutlined />}
      ></SecondaryButton>
      <SecondaryButton
        type="link"
        onClick={() => {
          form.resetFields();
          setQuery(null);
          setSearchParams();
        }}
      >
        Clear Search
      </SecondaryButton>
    </Form>
  );
};
