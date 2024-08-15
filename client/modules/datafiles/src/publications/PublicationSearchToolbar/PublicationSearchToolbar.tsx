import { Button, Form, Input, Select } from 'antd';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import * as dropdownOptions from '../../projects/forms/ProjectFormDropdowns';
export const PublicationSearchToolbar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const setSearchParam = (key: string, value?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    if (key === 'facility') {
      newSearchParams.delete('experiment-type');
    }
    setSearchParams(newSearchParams);
  };

  const currentYear = new Date(Date.now()).getUTCFullYear();
  //Show events going back to 2015
  const datesInRange = [];
  for (let i = currentYear; i >= 2015; i--) {
    datesInRange.push(i);
  }
  const yearOptions = [...datesInRange.map((y) => ({ label: y, value: y }))];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}
    >
      <Form
        onFinish={(data) => setSearchParam('q', data.query)}
        style={{ display: 'inline-flex', flex: 1, minWidth: '250px' }}
      >
        <Button htmlType="submit" type="primary" className="success-button">
          <i className="fa fa-search" />
          &nbsp;Search
        </Button>
        <Form.Item name="query" style={{ marginBottom: 0, flex: 1 }}>
          <Input
            placeholder="Author, Title, Keyword, Description, Natural Hazard Event, or Project ID"
            style={{ flex: 1 }}
          />
        </Form.Item>
      </Form>
      <div>
        <label htmlFor="nh-type-select" style={{ margin: 0 }}>
          Natural Hazard Type
        </label>
        &nbsp;
        <Select
          style={{ width: '150px' }}
          virtual={false}
          allowClear
          id="nh-type-select"
          placeholder="All Types"
          options={dropdownOptions.nhTypeOptions}
          popupMatchSelectWidth={false}
          value={searchParams.get('nh-type')}
          onChange={(v) => setSearchParam('nh-type', v)}
        />
      </div>

      <div>
        <label htmlFor="publication-year-select" style={{ margin: 0 }}>
          Year Published
        </label>
        &nbsp;
        <Select
          style={{ width: '150px' }}
          id="publication-year-select"
          options={yearOptions}
          allowClear
          placeholder="All Years"
          popupMatchSelectWidth={false}
          virtual={false}
          value={searchParams.get('pub-year')}
          onChange={(v) => setSearchParam('pub-year', v)}
        />
      </div>

      <Button type="link" onClick={() => setSearchParams(undefined)}>
        Clear Filters
      </Button>
    </div>
  );
};
