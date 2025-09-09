import {
  TGithubFileObj,
  useGithubListing,
  useProjectDetail,
} from '@client/hooks';
import { Alert, Button, ConfigProvider, Table, TableProps } from 'antd';
import React from 'react';
import { toBytes } from '../../FileListing/FileListing';
import { Link } from 'react-router-dom';

const releaseRegex =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/(\S+)\/(\S+)\/releases\/tag\/(\S+)$/;

const GithubFileListingTable: React.FC<{
  org: string;
  repo: string;
  releaseRef: string;
}> = ({ org, repo, releaseRef }) => {
  const { data: githubListing } = useGithubListing({
    org,
    repo,
    ref: releaseRef,
  });

  const columns: TableProps<TGithubFileObj>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '50%',
      render: (_, record) => (
        <>
          <span
            className="fa fa-github"
            style={{ fontSize: '18px', marginRight: '1rem' }}
          />
          <a href={record.html_url} target="_blank" rel="noreferrer">
            {record.name}
          </a>
        </>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (v) => toBytes(v),
    },
    {
      dataIndex: undefined,

      align: 'end',
      key: 'path',
      title: () => (
        <a
          href={`https://github.com/${org}/${repo}/tree/${releaseRef}`}
          rel="noreferrer"
          target="_blank"
        >
          <ConfigProvider
            theme={{
              components: {
                Button: {
                  colorBgContainer: '#D9D9D9',
                  defaultHoverColor: '#2E2B2A',
                  defaultActiveColor: '#2E2B2A',
                  defaultHoverBorderColor: '#2E2B2A',
                },
              },
            }}
          >
            <Button type="default">
              View Repository on GitHub &nbsp;
              <span className="fa fa-external-link" />
            </Button>
          </ConfigProvider>
        </a>
      ),
    },
  ];

  return (
    <Table<TGithubFileObj>
      columns={columns}
      dataSource={githubListing}
      rowKey="path"
      pagination={false}
    ></Table>
  );
};

export const ProjectGithubFileListing: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { data } = useProjectDetail(projectId ?? '');

  const githubUrl = data?.baseProject.value.githubUrl;

  if (!githubUrl) {
    return (
      <Alert
        showIcon
        style={{ margin: '1rem 0px' }}
        message="No Repository Selected"
        description={
          <div>
            Please go to the{' '}
            <Link to={`/projects/${projectId}/curation`}>
              Curation Directory
            </Link>{' '}
            to associate a GitHub repository with your project.
          </div>
        }
      />
    );
  }
  return (
    <>
      <Alert
        showIcon
        style={{ margin: '1rem 0px' }}
        //message="No Repository Selected"
        description={
          <div>
            If you need to modify the GitHub release associated with this
            project, you can do so from the{' '}
            <Link to={`/projects/${projectId}/curation`}>
              Curation Directory
            </Link>{' '}
            .
          </div>
        }
      />
      <BaseGithubFileListing githubUrl={githubUrl} />
    </>
  );
};

export const BaseGithubFileListing: React.FC<{ githubUrl?: string }> = ({
  githubUrl,
}) => {
  if (!githubUrl) {
    return <div>No Github URL specified.</div>;
  }
  const regexMatch = releaseRegex.exec(githubUrl ?? '');

  if (regexMatch) {
    const [, org, repo, releaseRef] = regexMatch;
    //return <div>hi</div>
    if (!org || !repo || !releaseRef) {
      return (
        <Alert
          showIcon
          style={{ margin: '1rem 0px' }}
          type="error"
          description="There was an error retrieving project information from GitHub."
        />
      );
    }
    return (
      <GithubFileListingTable org={org} repo={repo} releaseRef={releaseRef} />
    );
  }
};
