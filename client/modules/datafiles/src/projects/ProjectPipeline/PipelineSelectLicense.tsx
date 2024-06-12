import { usePatchProjectMetadata, useProjectPreview } from '@client/hooks';
import { Button, Col, Radio, Row } from 'antd';
import { PipelinePublishModal } from './PipelinePublishModal';
import { useSearchParams } from 'react-router-dom';
import React from 'react';

export const LicenseRadioIcon: React.FC<{
  label: React.ReactNode;
  iconName: string;
  recommended?: 'RECOMMEND' | 'CONSIDER';
}> = ({ label, iconName, recommended }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span className={iconName} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '1rem',
        }}
      >
        <span>{label}</span>
        {recommended === 'RECOMMEND' && (
          <span style={{ color: '#158600' }}>Recommended</span>
        )}
        {recommended === 'CONSIDER' && (
          <span style={{ color: 'orange' }}>Consider and Read Carefully</span>
        )}
      </div>
    </div>
  );
};

export const PipelineSelectLicense: React.FC<{
  projectId: string;
  nextStep: () => void;
  prevStep: () => void;
}> = ({ projectId, nextStep, prevStep }) => {
  const { data } = useProjectPreview(projectId ?? '');
  const { mutate } = usePatchProjectMetadata(projectId);
  const [searchParams] = useSearchParams();

  if (!data) return null;
  if (!searchParams.getAll('selected')) return null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 24,
          marginBottom: 20,
        }}
      >
        <Button type="link" onClick={prevStep}>
          <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back to
          Proofread Project
        </Button>
        <PipelinePublishModal
          disabled={!data.baseProject.value.license}
          operation={searchParams.get('operation') ?? ''}
          projectType={data.baseProject.value.projectType}
          projectId={projectId}
          entityUuids={searchParams.getAll('selected')}
        />
      </div>
      <h3 style={{ textAlign: 'center' }}>Select License</h3>
      <ul style={{ listStylePosition: 'inside', paddingInlineStart: '0px' }}>
        <li>Consider the terms of each license carefully.</li>
        <li>
          If you want to use a different license than the following, submit a
          ticket.
        </li>
        <li>
          If you need help, attend Curation office hours for help with
          publishing.
        </li>
      </ul>

      <Radio.Group
        style={{ width: '100%' }}
        value={data.baseProject.value.license}
        onChange={(e) => mutate({ patchMetadata: { license: e.target.value } })}
      >
        <section>
          <h3>Datasets</h3>
          <summary style={{ fontSize: '14px', paddingBottom: '10px' }}>
            If you are publishing data, such as simulation or experimental data,
            choose between:
          </summary>

          <Row>
            <Col span={12}>
              <Radio value="Open Data Commons Attribution">
                <LicenseRadioIcon
                  label="Open Data Commons Attribution"
                  iconName="curation-odc"
                  recommended="RECOMMEND"
                />
              </Radio>
              <ul
                style={{
                  listStylePosition: 'inside',
                  paddingInlineStart: '0px',
                }}
              >
                <li>
                  You allow others to freely share, reuse, and adapt your
                  data/database.
                </li>
                <li>
                  You expect to be attributed for any public use of the
                  data/database.
                </li>
              </ul>
              Please read the{' '}
              <a
                href="https://opendatacommons.org/licenses/by/"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                License Website
              </a>
            </Col>
            <Col span={12}>
              <Radio value="Open Data Commons Public Domain Dedication">
                <LicenseRadioIcon
                  label="Open Data Commons Public Domain Dedication"
                  iconName="curation-odc"
                  recommended="CONSIDER"
                />
              </Radio>
              <ul
                style={{
                  listStylePosition: 'inside',
                  paddingInlineStart: '0px',
                }}
              >
                <li>
                  You allow others to freely share, modify, and use this
                  data/database for any purpose without any restrictions
                </li>
                <li>You do not expect to be attributed for it.</li>
              </ul>
              Please read the{' '}
              <a
                href="https://opendatacommons.org/licenses/pddl/1-0/"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                License Website
              </a>
            </Col>
          </Row>

          <h3>Works</h3>
          <summary style={{ fontSize: '14px', paddingBottom: '10px' }}>
            If you are publishing papers, presentations, learning objects,
            workflows, designs, etc, choose between:
          </summary>

          <Row>
            <Col span={12}>
              <Radio value="Creative Commons Attribution">
                <LicenseRadioIcon
                  label="Creative Commons Attribution"
                  iconName="curation-cc-share"
                  recommended="RECOMMEND"
                />
              </Radio>
              <ul
                style={{
                  listStylePosition: 'inside',
                  paddingInlineStart: '0px',
                }}
              >
                <li>
                  You allow others to freely share, reuse, and adapt your work.
                </li>
                <li>
                  You expect to be attributed for any public use of your work.
                </li>
                <li>You retain your copyright.</li>
              </ul>
              Please read the{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                License Website
              </a>
            </Col>
            <Col span={12}>
              <Radio value="Creative Commons Public Domain Dedication">
                <LicenseRadioIcon
                  label="Creative Commons Public Domain Dedication"
                  iconName="curation-cc-zero"
                  recommended="CONSIDER"
                />
              </Radio>
              <ul
                style={{
                  listStylePosition: 'inside',
                  paddingInlineStart: '0px',
                }}
              >
                <li>
                  You allow others to freely share, modify, and use this work
                  for any purpose without any restrictions.
                </li>
                <li>You do not expect to be attributed for it.</li>
                <li>You give all of your rights away.</li>
              </ul>
              Please read the{' '}
              <a
                href="https://creativecommons.org/publicdomain/zero/1.0/"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                License Website
              </a>
            </Col>
          </Row>

          <h3>Software</h3>
          <summary style={{ fontSize: '14px', paddingBottom: '10px' }}>
            If you are publishing community software, scripts, libraries,
            applications, etc, choose the following:
          </summary>
          <Row>
            <Col span={24}>
              <Radio value="3-Clause BSD License">
                <LicenseRadioIcon
                  label="3-Clause BSD License"
                  iconName="curation-3bsd"
                />
              </Radio>
              <ul
                style={{
                  listStylePosition: 'inside',
                  paddingInlineStart: '0px',
                }}
              >
                <li>
                  Redistributions in binary form must reproduce the above
                  copyright notice, this list of conditions and the following
                  disclaimer in the documentation and/or other materials
                  provided with the distribution.
                </li>
                <li>
                  Redistributions of source code must retain the above copyright
                  notice, this list of conditions and the following disclaimer.{' '}
                </li>
                <li>
                  Neither the name of the copyright holder nor the names of its
                  contributors may be used to endorse or promote products
                  derived from this software without specific prior written
                  permission.
                </li>
              </ul>
              Please read the{' '}
              <a
                href="https://opensource.org/license/bsd-3-clause/"
                target="_blank"
                rel="noreferrer"
                aria-describedby="msg-open-ext-site-new-window"
              >
                License Website
              </a>
            </Col>
          </Row>
        </section>
      </Radio.Group>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      ></div>
    </>
  );
};
