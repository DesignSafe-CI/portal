import React from 'react';
import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import {
  BaseProjectDetails,
  DatafilesToolbar,
  ProjectTitleHeader,
} from '@client/datafiles';
import { Button, Form, Input } from 'antd';
import { useProjectDetail } from '@client/hooks';

const FileListingSearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onSubmit = (queryString: string) => {
    const newSearchParams = searchParams;
    if (queryString) {
      newSearchParams.set('q', queryString);
    } else {
      newSearchParams.delete('q');
    }

    setSearchParams(newSearchParams);
  };
  return (
    <Form
      onFinish={(data) => onSubmit(data.query)}
      style={{ display: 'inline-flex' }}
    >
      <Form.Item name="query" style={{ marginBottom: 0 }}>
        <Input placeholder="Search Data Files" style={{ width: '250px' }} />
      </Form.Item>
      <Button htmlType="submit">
        <i className="fa fa-search"></i>
      </Button>
    </Form>
  );
};

export const ProjectDetailLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!data || !projectId) return <div>loading...</div>;

  return (
    <section>
      <DatafilesToolbar searchInput={<FileListingSearchBar />} />
      <ProjectTitleHeader projectId={projectId} />
      <BaseProjectDetails projectValue={data.baseProject.value} />
      <Outlet />
    </section>
  );
};
