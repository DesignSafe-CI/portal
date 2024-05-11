import { TNeesDetailsItem, useNeesDetails } from '@client/hooks';
import { Tabs, Button, Divider, Modal, Flex } from 'antd';
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DatafilesBreadcrumb, FileListing } from '@client/datafiles';
import styles from './NeesDetails.module.css';

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

export const NeesDetails: React.FC<{ neesId: string }> = ({ neesId }) => {
  const { data, isLoading } = useNeesDetails(neesId);
  const neesProjectData = data?.metadata.project;
  const neesExperiments = data?.metadata.experiments;
  const numDOIs = neesExperiments?.filter((exp) => !!exp.doi).length || 0;
  const path = data?.path;

  const neesCitations = neesExperiments
    ?.filter((exp) => !!exp.doi)
    .map((u) => {
      const authors = u.creators
        ?.map((a) => a.lastName + ', ' + a.firstName)
        .join('; ');
      const doi = u.doi;
      const doiUrl = 'https://doi.org/' + doi;
      const year = u.endDate
        ? u.endDate.split('T')[0].split('-')[0]
        : u.startDate.split('T')[0].split('-')[0];

      return (
        <div key={u.doi}>
          {authors}, ({year}), "{u.title}", DesignSafe-CI [publisher], doi:{' '}
          {doi}
          <br />
          <a href={doiUrl}>{doiUrl}</a>
          <Divider />
        </div>
      );
    });

  const doiList = () => {
    Modal.info({
      title: 'DOIs',
      content: neesCitations,
      width: 600,
    });
  };

  const experimentsList = neesExperiments?.map((exp) => {
    return (
      <div key={exp.name}>
        <Flex gap="middle">
          <div>{exp.name}</div>
          <table>
            <colgroup>
              <col style={{ width: '100px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td>Title</td>
                <td>{exp.title}</td>
              </tr>
              <tr>
                <td>Creators</td>
                <td>
                  {exp.creators
                    ? exp.creators?.map((c) => (
                        <div key={c.lastName}>
                          {c.firstName} {c.lastName}
                        </div>
                      ))
                    : 'No Creators Listed'}
                </td>
              </tr>
              {exp.doi ? (
                <tr>
                  <td>DOI</td>
                  <td>{exp.doi}</td>
                </tr>
              ) : (
                <tr></tr>
              )}
              {exp.doi ? (
                <tr>
                  <td>Citation</td>
                  <td>
                    {exp.creators
                      ?.map(
                        (author) => author.lastName + ', ' + author.firstName
                      )
                      .join('; ')}
                    , (
                    {exp.endDate
                      ? exp.endDate.split('T')[0].split('-')[0]
                      : exp.startDate.split('T')[0].split('-')[0]}
                    ), "{exp.title}", DesignSafe-CI [publisher], doi: {exp.doi}
                  </td>
                </tr>
              ) : (
                <tr></tr>
              )}
              <tr>
                <td>Type</td>
                <td>{exp.type}</td>
              </tr>
              <tr>
                <td>Description</td>
                <td>
                  {exp.description ? (
                    <DescriptionExpander>{exp.description}</DescriptionExpander>
                  ) : (
                    'No Description'
                  )}
                </td>
              </tr>
              <tr>
                <td>Start Date</td>
                <td>{exp.startDate}</td>
              </tr>
              <tr>
                <td>End Date</td>
                <td>{exp.endDate ? exp.endDate : 'No End Date'}</td>
              </tr>
              <tr>
                <td>Equipment</td>
                <td>
                  <table>
                    <thead>
                      {exp.equipment ? (
                        <tr>
                          <th>Equipment</th>
                          <th>Component</th>
                          <th>Equipment Class</th>
                          <th>Facility</th>
                        </tr>
                      ) : (
                        <tr>
                          <td>No Equipment Listed</td>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {exp.equipment?.map((eq) => (
                        <tr key={eq.component + eq.equipment}>
                          <td width={'25%'}>{eq.equipment}</td>
                          <td width={'25%'}>{eq.component}</td>
                          <td width={'25%'}>{eq.equipmentClass}</td>
                          <td width={'25%'}>{eq.facility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td>Material</td>
                <td>
                  {exp.material
                    ? exp.material?.map((mat) => (
                        <div key={mat.component}>
                          <div>{mat.component}:</div>
                          <div>
                            {mat.materials?.map((mats) => (
                              <div key={mats}>{mats}</div>
                            ))}
                          </div>
                          <br />
                        </div>
                      ))
                    : 'No Materials Listed  '}
                </td>
              </tr>
              {/*TODO: add this in once breadcrumbs are complete
                <tr>
                  <td>Files</td>
                  <td>link to files here</td>
                </tr> */}
            </tbody>
          </table>
        </Flex>
        <Divider />
      </div>
    );
  });

  const neesFiles = (
    <FileListing
      api="tapis"
      system="nees.public"
      path={path ?? ''}
      scroll={{ y: 500 }}
    />
  );

  return (
    <>
      <div>
        <h2>
          {neesProjectData?.name}: {neesProjectData?.title}
        </h2>
        <Divider className={styles['nees-divider']} />
        <table className={styles['nees-mini-table']}>
          <colgroup>
            <col style={{ width: '50%' }} />
            <col style={{ width: '50%' }} />
          </colgroup>
          <tr>
            <td>
              <table className={styles['nees-mini-table']}>
                <tr>
                  <th className={styles['nees-th']}>PIs</th>
                  <td className={styles['nees-td']}>
                    {neesProjectData?.pis
                      ? neesProjectData?.pis.map((u) => (
                          <div key={u.lastName}>
                            {u.firstName} {u.lastName}
                          </div>
                        ))
                      : 'No PIs Listed'}
                  </td>
                </tr>
              </table>
            </td>
            <td>
              <table style={{ width: '100%' }}>
                <tr>
                  <th className={styles['nees-th']}>Organizations</th>
                  <td className={styles['nees-td']}>
                    {neesProjectData?.organization
                      ? neesProjectData?.organization.map((u) => (
                          <div key={u.name}>
                            {u.name} {u.state}, {u.country}
                          </div>
                        ))
                      : 'No Organizations Listed'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <Divider className={styles['nees-divider']} />
            </td>
            <td>
              <Divider className={styles['nees-divider']} />
            </td>
          </tr>
          <tr>
            <td>
              <table className={styles['nees-mini-table']}>
                <tr>
                  <th className={styles['nees-th']}>NEES ID</th>
                  <td className={styles['nees-td']}>{neesProjectData?.name}</td>
                </tr>
              </table>
            </td>
            <td>
              <table className={styles['nees-mini-table']}>
                <tr>
                  <th className={styles['nees-th']}>Sponsors</th>
                  <td className={styles['nees-td']}>
                    {neesProjectData?.sponsor
                      ? neesProjectData?.sponsor?.map((u) => (
                          <div key={u.name}>
                            <Link to={u.url} key={u.name}>
                              {u.name}
                            </Link>
                          </div>
                        ))
                      : 'No Sponsors Listed'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <Divider className={styles['nees-divider']} />
            </td>
            <td>
              <Divider className={styles['nees-divider']} />
            </td>
          </tr>
          <tr>
            <td>
              <table className={styles['nees-mini-table']}>
                <tbody>
                  <tr>
                    <th className={styles['nees-th']}>Project Type</th>
                    <td className={styles['nees-td']}>NEES</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td>
              <table className={styles['nees-mini-table']}>
                <tbody>
                  <tr>
                    <th className={styles['nees-th']}>Start Date</th>
                    <td className={styles['nees-td']}>
                      {neesProjectData?.startDate
                        ? neesProjectData?.startDate
                        : 'No Start Date'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <Divider className={styles['nees-divider']} />
            </td>
            <td>
              <Divider className={styles['nees-divider']} />
            </td>
          </tr>
          <tr>
            <table className={styles['nees-mini-table']}>
              <tbody>
                {numDOIs > 0 ? (
                  <tr>
                    <th className={styles['nees-th']}>DOIs</th>
                    <td className={styles['nees-td']}>
                      <Button onClick={doiList}>List of DOIs</Button>
                    </td>
                  </tr>
                ) : (
                  <tr></tr>
                )}
              </tbody>
            </table>
          </tr>
        </table>
        Description:
        <DescriptionExpander>
          {neesProjectData?.description}
        </DescriptionExpander>
      </div>
      <div>
        <Tabs
          type="card"
          items={[
            {
              key: 'files',
              label: 'Files',
              children: neesFiles,
            },
            {
              key: 'experiments',
              label: 'Experiments',
              children: experimentsList,
            },
          ]}
        />
      </div>
    </>
  );
};
