import React, { useEffect, useState, useCallback } from 'react';
import { TBaseProjectValue, TProjectUser } from '@client/hooks';

import styles from './BaseProjectDetails.module.css';
import { Button, Col, Popover, Row, Select, Tooltip } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { RelateDataModal } from './modals';
import { ProjectInfoModal } from './modals/ProjectInfoModal';
import { VersionChangesModal } from './modals/VersionChangesModal';

export const DescriptionExpander: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [expanderRef, setExpanderRef] = useState<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandable, setExpandable] = useState(false);

  const expanderRefCallback = useCallback(
    (node: HTMLElement) => {
      if (node !== null) setExpanderRef(node);
    },
    [setExpanderRef]
  );

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setExpandable(entry.target.scrollHeight > entry.target.clientHeight);
      }
    });
    expanderRef && ro.observe(expanderRef);
    return () => {
      ro.disconnect();
    };
  }, [setExpandable, expanderRef]);

  return (
    <div>
      <span
        ref={expanderRefCallback}
        className={
          !expanded ? styles['line-clamped'] : styles['line-unclamped']
        }
      >
        {children}
      </span>
      {(expandable || expanded) && (
        <Button type="link" onClick={() => setExpanded(!expanded)}>
          {expanded ? <strong>Show Less</strong> : <strong>Show More</strong>}
        </Button>
      )}
    </div>
  );
};

export const LicenseDisplay: React.FC<{ licenseType: string }> = ({
  licenseType,
}) => {
  const ENTITY_ICON_MAP: Record<string, string> = {
    'GNU General Public License': 'curation-gpl',
    'Open Data Commons Attribution': 'curation-odc',
    'Open Data Commons Public Domain Dedication': 'curation-odc',
    'Creative Commons Attribution': 'curation-cc-share',
    'Creative Commons Public Domain Dedication': 'curation-cc-zero',
    '3-Clause BSD License': 'curation-3bsd',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <i className={ENTITY_ICON_MAP[licenseType]} />
      &nbsp;
      {licenseType}
    </div>
  );
};

export const UsernamePopover: React.FC<{ user: TProjectUser }> = ({ user }) => {
  const content = (
    <section
      role="table"
      style={{
        width: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <Row role="row">
        <Col role="rowheader" span={8}>
          Name
        </Col>
        <Col role="cell" offset={4} span={12}>
          <strong>
            {user.fname} {user.lname}
          </strong>
        </Col>
      </Row>
      <Row role="row" gutter={[0, 40]}>
        <Col role="cell" span={8}>
          Email
        </Col>
        <Col role="cell" offset={4} span={12}>
          <strong>{user.email}</strong>
        </Col>
      </Row>
      <Row role="row" gutter={[0, 40]}>
        <Col role="cell" span={8}>
          Institution
        </Col>
        <Col role="cell" offset={4} span={12}>
          <strong>{user.inst}</strong>
        </Col>
      </Row>
    </section>
  );
  return (
    <Popover
      trigger="click"
      content={content}
      title={
        <h3 style={{ marginTop: '0px' }}>{`${user.lname}, ${user.fname}`}</h3>
      }
    >
      <Button type="link" style={{ userSelect: 'text' }}>
        <strong>
          {user.lname}, {user.fname}
        </strong>
      </Button>
    </Popover>
  );
};

const projectTypeMapping = {
  field_recon: 'Field research',
  other: 'Other',
  experimental: 'Experimental',
  simulation: 'Simulation',
  hybrid_simulation: 'Hybrid Simulation',
  field_reconnaissance: 'Field Reconaissance',
  None: 'None',
};

export const BaseProjectDetails: React.FC<{
  projectValue: TBaseProjectValue;
  publicationDate?: string;
  versions?: number[];
  isPublished?: boolean;
}> = ({ projectValue, publicationDate, versions, isPublished }) => {
  const pi = projectValue.users.find((u) => u.role === 'pi');
  const coPis = projectValue.users.filter((u) => u.role === 'co_pi');
  const projectType = [
    projectTypeMapping[projectValue.projectType],
    ...(projectValue.frTypes?.map((t) => t.name) ?? []),
  ].join(' | ');

  const [searchParams, setSearchParams] = useSearchParams();

  const setSelectedVersion = (newVersion: number) => {
    setSearchParams((prevParams) => {
      prevParams.set('version', newVersion.toString());
      return prevParams;
    });
  };

  const currentVersion = versions
    ? parseInt(searchParams.get('version') ?? Math.max(...versions).toString())
    : 1;

  return (
    <section style={{ marginBottom: '20px' }}>
      <table
        style={{ width: '100%', marginBottom: '20px', borderSpacing: '200px' }}
      >
        <colgroup>
          <col style={{ width: '200px' }} />
          <col />
        </colgroup>
        <tbody>
          {pi && projectValue.projectType !== 'other' && (
            <tr className={styles['prj-row']}>
              <td>PI</td>
              <td style={{ fontWeight: 'bold' }}>
                <UsernamePopover user={pi} />
              </td>
            </tr>
          )}
          {coPis.length > 0 && projectValue.projectType !== 'other' && (
            <tr className={styles['prj-row']}>
              <td>Co-PIs</td>
              <td style={{ fontWeight: 'bold' }}>
                {coPis.map((u, i) => (
                  <React.Fragment key={JSON.stringify(u)}>
                    <UsernamePopover user={u} />
                    {i !== coPis.length - 1 && '; '}
                  </React.Fragment>
                ))}
              </td>
            </tr>
          )}
          {projectValue.authors.length > 0 &&
            projectValue.projectType === 'other' && (
              <tr className={styles['prj-row']}>
                <td>Authors</td>
                <td style={{ fontWeight: 'bold' }}>
                  {projectValue.authors.map((u, i) => (
                    <React.Fragment key={JSON.stringify(u)}>
                      <UsernamePopover user={u} />
                      {i !== projectValue.authors.length - 1 && '; '}
                    </React.Fragment>
                  ))}
                </td>
              </tr>
            )}
          {projectValue.projectType !== 'other' && (
            <tr className={styles['prj-row']}>
              <td>Project Type</td>
              <td style={{ fontWeight: 'bold' }}>
                {projectType}
                {!isPublished && (
                  <>
                    {' '}
                    <ProjectInfoModal projectType={projectValue.projectType} />
                  </>
                )}
              </td>
            </tr>
          )}
          {(projectValue.dataTypes?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Data Type(s)</td>
              <td style={{ fontWeight: 'bold' }}>
                {projectValue.dataTypes?.map((d) => d.name).join(', ')}
              </td>
            </tr>
          )}
          {(projectValue.nhTypes?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Natural Hazard Type(s)</td>
              <td style={{ fontWeight: 'bold' }}>{`${projectValue.nhTypes
                .map((t) => t.name)
                .join(', ')}`}</td>
            </tr>
          )}
          {publicationDate && (
            <tr className={styles['prj-row']}>
              <td>Date of Publication</td>
              <td style={{ fontWeight: 'bold' }}>
                {new Date(publicationDate).toISOString().split('T')[0]}
              </td>
            </tr>
          )}
          <tr
            className={styles['prj-row']}
            hidden={!projectValue.facilities.length}
          >
            <td>Facilities</td>
            <td style={{ fontWeight: 'bold' }}>
              {projectValue.facilities.map((t) => (
                <div key={t.name}>{t.name}</div>
              ))}
            </td>
          </tr>
          {(projectValue.nhEvents?.length ?? 0) > 0 && (
            <tr>
              <td>Event(s)</td>
              <td style={{ fontWeight: 'bold' }}>
                {projectValue.nhEvents.map((evt) => (
                  <div key={JSON.stringify(evt)}>
                    {evt.eventName} | {evt.location} |{' '}
                    {new Date(evt.eventStart).toISOString().split('T')[0]}
                    {' ― '}
                    {
                      new Date(evt.eventEnd ?? evt.eventStart)
                        .toISOString()
                        .split('T')[0]
                    }{' '}
                    |{' '}
                    <a
                      href={`https://www.google.com/maps/place/${evt.latitude},${evt.longitude}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Lat {evt.latitude} long {evt.longitude}
                    </a>
                  </div>
                ))}
              </td>
            </tr>
          )}
          {(projectValue.awardNumbers?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Awards</td>
              <td style={{ fontWeight: 'bold' }}>
                {projectValue.awardNumbers.map((t) => (
                  <div key={JSON.stringify(t)}>
                    {[t.name, t.number, t.fundingSource]
                      .filter((v) => !!v)
                      .join(' | ')}{' '}
                  </div>
                ))}
              </td>
            </tr>
          )}
          {(projectValue.associatedProjects?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Related Work</td>
              <td style={{ fontWeight: 'bold' }}>
                {projectValue.associatedProjects.map((assoc) => (
                  <div key={JSON.stringify(assoc)}>
                    {assoc.type} |{' '}
                    <a
                      href={assoc.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {assoc.title}
                    </a>
                  </div>
                ))}
              </td>
            </tr>
          )}
          {(projectValue.referencedData?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Referenced Data and Software</td>
              <td style={{ fontWeight: 'bold' }}>
                {projectValue.referencedData.map((ref) => (
                  <div key={JSON.stringify(ref)}>
                    {ref.hrefType && `${ref.hrefType} | `}
                    <a href={ref.doi} rel="noopener noreferrer" target="_blank">
                      {ref.title}
                    </a>
                  </div>
                ))}
              </td>
            </tr>
          )}
          <tr className={styles['prj-row']}>
            <td>Keywords</td>
            <td style={{ fontWeight: 'bold' }}>
              {projectValue.keywords.join(', ')}
            </td>
          </tr>
          {(projectValue.hazmapperMaps?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Hazmapper Maps</td>
              <td style={{ fontWeight: 'bold' }}>
                {(projectValue.hazmapperMaps ?? []).map((m) => (
                  <div key={m.uuid}>
                    {m.name}&nbsp;
                    <Tooltip title="Open in HazMapper">
                      <a
                        href={`https://hazmapper.tacc.utexas.edu/hazmapper/project-public/${m.uuid}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <i role="none" className="fa fa-external-link"></i>
                      </a>
                    </Tooltip>
                  </div>
                ))}
              </td>
            </tr>
          )}

          {projectValue.dois && projectValue.dois[0] && (
            <tr className={styles['prj-row']}>
              <td>DOI</td>
              <td style={{ fontWeight: 'bold' }}>{projectValue.dois[0]}</td>
            </tr>
          )}

          {projectValue.projectType === 'other' && projectValue.license && (
            <tr className={styles['prj-row']}>
              <td>License</td>
              <td style={{ fontWeight: 'bold' }}>
                <LicenseDisplay licenseType={projectValue.license} />
              </td>
            </tr>
          )}

          {versions && versions.length > 1 && (
            <tr className={styles['prj-row']}>
              <td>Version</td>
              <td style={{ fontWeight: 'bold' }}>
                <Select
                  style={{ width: '200px' }}
                  size="small"
                  options={versions.map((v) => ({ value: v, label: v }))}
                  value={currentVersion}
                  onChange={(newVal) => setSelectedVersion(newVal)}
                />{' '}
                {currentVersion > 1 && (
                  <VersionChangesModal
                    projectId={projectValue.projectId}
                    version={currentVersion}
                  />
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isPublished && (
        <section style={{ paddingBottom: '12px' }}>
          {!['other', 'field_reconnaissance'].includes(
            projectValue.projectType
          ) && (
            <>
              <RelateDataModal projectId={projectValue.projectId} readOnly>
                {({ onClick }) => (
                  <Button
                    onClick={onClick}
                    type="link"
                    style={{ fontWeight: 'bold' }}
                  >
                    View Data Diagram
                  </Button>
                )}
              </RelateDataModal>{' '}
              |{' '}
            </>
          )}
          <Button type="link">
            <strong>Leave Feedback (REPLACE ME)</strong>
          </Button>
        </section>
      )}
      {projectValue.description && (
        <DescriptionExpander>
          <strong>Description: </strong>
          {projectValue.description}
        </DescriptionExpander>
      )}
    </section>
  );
};
