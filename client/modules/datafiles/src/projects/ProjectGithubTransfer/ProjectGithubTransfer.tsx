import { usePatchProjectMetadata, useProjectDetail } from '@client/hooks';
import { Alert, Button, ConfigProvider, Form, Input, Spin } from 'antd';
import { AxiosError } from 'axios';
import React, { useMemo } from 'react';

export const ProjectGithubTransfer: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const { mutate, error, isSuccess, isPending } =
    usePatchProjectMetadata(projectId);

  const { data: projectMetadata } = useProjectDetail(projectId);

  const updateUrl = (url: string) =>
    mutate({ patchMetadata: { githubUrl: url } });

  const errorType = useMemo(() => {
    if (!error) return undefined;
    if ((error as AxiosError).status !== 400) {
      return undefined;
    }
    const errorList = (error as AxiosError<{ message: string[] }>).response
      ?.data.message;
    return errorList;
  }, [error]);

  return (
    <section
      style={{
        backgroundColor: '#f5f5f5',
        margin: '1rem 0',
        padding: '3rem',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <span
        style={{
          display: 'flex',
          fontSize: '20px',
          fontWeight: '400',
          alignItems: 'center',
          marginBottom: '1rem',
          gap: '1rem',
        }}
      >
        <span
          className="fa fa-github"
          style={{ fontSize: '60px', color: '#8E8E8E' }}
        ></span>
        Transfer GitHub Release
      </span>
      <section>
        Enter the release URL and DesignSafe will automatically transfer and
        store a zip file of your software.
      </section>
      <section>
        Only one GitHub release can be published. Re-transferring will overwrite
        any previous transfer.
      </section>
      <section>
        No additional files besides the zip file containing the GitHub release
        can be published.
      </section>

      <section style={{ width: '100%' }}>
        <label style={{ fontWeight: 'normal' }} htmlFor="ghTransferUrl">
          Release URL
        </label>
        <Form
          initialValues={{ url: projectMetadata?.baseProject.value.githubUrl }}
          layout="inline"
          onFinish={(f) => updateUrl(f.url)}
          style={{ marginBottom: '1rem' }}
        >
          <Button
            style={{ background: '#48A59D', color: 'white', width: '150px' }}
            htmlType="submit"
            disabled={isPending}
          >
            Transfer{' '}
            {isPending && (
              <ConfigProvider theme={{ token: { colorPrimary: 'white' } }}>
                <Spin size="small" style={{ marginLeft: '1rem' }} />
              </ConfigProvider>
            )}
          </Button>
          <Form.Item
            name="url"
            style={{ flexGrow: 1 }}
            rules={[
              {
                required: true,
                message: 'Please enter the URL of a valid GitHub release.',
              },
              {
                pattern:
                  /^(?:https?:\/\/)?(?:www\.)?github\.com\/(\S+)\/(\S+)\/releases\/tag\/(\S+)$/,
                message:
                  'Please enter the URL of a valid GitHub release. Check that there are no spaces before or after the URL.',
              },
            ]}
          >
            <Input id="ghTransferUrl" />
          </Form.Item>
        </Form>
        <a
          href="https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases"
          rel="noreferrer"
          target="_blank"
        >
          How to find the release URL
        </a>
      </section>

      {errorType?.includes('readme') && (
        <Alert
          showIcon
          type="error"
          style={{ width: '100%' }}
          message="Readme File Missing"
          description={
            <span>
              Create a <code>README.md</code> file in your repository root and
              include it in your GitHub release.
            </span>
          }
        />
      )}
      {errorType?.includes('codemeta') && (
        <Alert
          showIcon
          type="error"
          style={{ width: '100%' }}
          message="CodeMeta File Missing"
          description={
            <span>
              Generate a <code>codemeta.json</code> file at{' '}
              <a
                href="https://codemeta.github.io/codemeta-generator/"
                target="_blank"
                rel="noreferrer"
              >
                https://codemeta.github.io/codemeta-generator/
              </a>{' '}
              and include it in your GitHub release. Fill out as much
              information as possible and select the 3-clause BSD license.
              <br />
              Software name, description, license, and version from this file
              will overwrite project metadata to maintain consistency.
            </span>
          }
        />
      )}
      {isSuccess && (
        <Alert
          showIcon
          type="success"
          style={{ width: '100%' }}
          message="Transfer Successful"
          description={<span>Continue to the Publication Preview</span>}
        />
      )}

      <article style={{ width: '100%', marginTop: '5rem' }}>
        The following files <strong>must</strong> be included in the GitHub
        release.
        <br />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3rem',
            marginTop: '1rem',
          }}
        >
          <span
            className="fa fa-file-text-o"
            style={{ fontSize: '5rem' }}
          ></span>
          <div>
            <strong>CodeMeta File</strong> (<code>codemeta.json</code>)<br />
            Generate a metadata file at{' '}
            <a
              href="https://codemeta.github.io/codemeta-generator/"
              target="_blank"
              rel="noreferrer"
            >
              https://codemeta.github.io/codemeta-generator/
            </a>{' '}
            and include it in your GitHub release. <br />
            Fill out as much information as possible and select the 3-clause BSD
            license. <br />
            <strong>
              Software name, description, and license from this file will
              overwrite project metadata to maintain consistency
            </strong>
          </div>
        </div>
        <hr />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3rem',
            marginTop: '1rem',
          }}
        >
          <span
            className="fa fa-file-text-o"
            style={{ fontSize: '5rem' }}
          ></span>
          <div>
            <strong>README File</strong> (<code>README.md</code>)<br />
            Include a README file with instructions on how to install and use
            the software in the Github release.
          </div>
        </div>
      </article>
    </section>
  );
};
