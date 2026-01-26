import React, { useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TEntityValue } from '@client/hooks';

import styles from './BaseProjectDetails.module.css';
import {
  DescriptionExpander,
  LicenseDisplay,
  UsernamePopover,
} from './BaseProjectDetails';
import { Alert, Select } from 'antd';
import { VersionChangesModal } from './modals/VersionChangesModal';

const EntityVersionSelector: React.FC<{
  doi: string;
  versions: number[];
}> = ({ doi, versions }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId } = useParams();
  const paramName = `version-${doi}`;
  const selectedVersion = parseFloat(
    searchParams.get(paramName) ?? Math.max(...versions).toString()
  );
  const onSelect = useCallback(
    (version: number) => {
      const params = new URLSearchParams(searchParams);
      params.set(paramName, version.toString());
      setSearchParams(params);
    },
    [searchParams, setSearchParams, paramName]
  );

  const options = useMemo(
    () => versions.map((v) => ({ label: v, value: v })),
    [versions]
  );

  return (
    <>
      <Select
        style={{ width: '200px' }}
        size="small"
        options={options}
        onChange={onSelect}
        value={selectedVersion}
      />
      {selectedVersion > 1 && versions.length > 1 && (
        <>
          {' '}
          <VersionChangesModal
            projectId={projectId ?? ''}
            doi={doi}
            version={selectedVersion}
          />
        </>
      )}
    </>
  );
};

export const PublishedEntityDetails: React.FC<{
  entityValue: TEntityValue;
  publicationDate?: string;
  license?: string;
  versions?: number[];
  uuid?: string;
}> = ({ entityValue, publicationDate, license, versions, uuid }) => {
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
          {entityValue.event && (
            <tr className={styles['prj-row']}>
              <td>Event</td>
              <td style={{ fontWeight: 'bold' }}>{entityValue.event}</td>
            </tr>
          )}

          {entityValue.dateStart && (
            <tr className={styles['prj-row']}>
              <td>Date(s)</td>
              <td style={{ fontWeight: 'bold' }}>
                {new Date(entityValue.dateStart).toISOString().split('T')[0]}
                {entityValue.dateEnd && (
                  <span>
                    {' ― '}
                    {new Date(entityValue.dateEnd).toISOString().split('T')[0]}
                  </span>
                )}
              </td>
            </tr>
          )}

          {entityValue.simulationType && (
            <tr className={styles['prj-row']}>
              <td>Simulation Type</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.simulationType?.name}
              </td>
            </tr>
          )}

          {(entityValue.authors ?? []).length > 0 && (
            <tr className={styles['prj-row']}>
              <td>Author(s)</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.authors
                  ?.filter((a) => a.authorship !== false)
                  .map((u, i) => (
                    <React.Fragment key={JSON.stringify(u)}>
                      <UsernamePopover user={u} />
                      {i !==
                        (entityValue.authors?.filter(
                          (a) => a.authorship !== false
                        ).length ?? 0) -
                          1 && '; '}
                    </React.Fragment>
                  ))}
              </td>
            </tr>
          )}

          {entityValue.facility && (
            <tr className={styles['prj-row']}>
              <td>Facility</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.facility?.name}
              </td>
            </tr>
          )}

          {entityValue.experimentType && (
            <tr className={styles['prj-row']}>
              <td>Experiment Type</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.experimentType?.name}
              </td>
            </tr>
          )}

          {entityValue.equipmentType && (
            <tr className={styles['prj-row']}>
              <td>Equipment Type</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.equipmentType?.name}
              </td>
            </tr>
          )}

          {entityValue.procedureStart && (
            <tr className={styles['prj-row']}>
              <td>Date of Experiment</td>
              <td style={{ fontWeight: 'bold' }}>
                {
                  new Date(entityValue.procedureStart)
                    .toISOString()
                    .split('T')[0]
                }
                {entityValue.procedureEnd && (
                  <span>
                    {' ― '}
                    {
                      new Date(entityValue.procedureEnd)
                        .toISOString()
                        .split('T')[0]
                    }
                  </span>
                )}
              </td>
            </tr>
          )}
          {entityValue.location && (
            <tr className={styles['prj-row']}>
              <td>Site Location</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.location} |{' '}
                <a
                  href={`https://www.google.com/maps/place/${entityValue.latitude},${entityValue.longitude}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Lat {entityValue.latitude} long {entityValue.longitude}
                </a>
              </td>
            </tr>
          )}

          {(entityValue.relatedWork?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Related Work</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.relatedWork.map((assoc) => (
                  <div key={JSON.stringify(assoc)}>
                    {assoc.hrefType && `${assoc.hrefType.toUpperCase()} | `}
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
          {(entityValue.referencedData?.length ?? 0) > 0 && (
            <tr className={styles['prj-row']}>
              <td>Referenced Data</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.referencedData.map((ref) => (
                  <div key={JSON.stringify(ref)}>
                    {ref.hrefType && `${ref.hrefType.toUpperCase()} | `}
                    <a href={ref.doi} rel="noopener noreferrer" target="_blank">
                      {ref.title}
                    </a>
                  </div>
                ))}
              </td>
            </tr>
          )}

          <tr className={styles['prj-row']}>
            <td>Date Published</td>
            <td style={{ fontWeight: 'bold' }}>
              {publicationDate
                ? new Date(publicationDate).toISOString().split('T')[0]
                : '(Appears after publication)'}
            </td>
          </tr>

          {entityValue.dois && entityValue.dois[0] && (
            <tr className={styles['prj-row']}>
              <td>DOI</td>
              <td style={{ fontWeight: 'bold' }}>{entityValue.dois[0]}</td>
            </tr>
          )}

          {license && (
            <tr className={styles['prj-row']}>
              <td>License</td>
              <td style={{ fontWeight: 'bold' }}>
                <LicenseDisplay licenseType={license} />
              </td>
            </tr>
          )}
          {entityValue.keywords && entityValue.keywords[0] && (
            <tr className={styles['prj-row']}>
              <td>Keywords</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.keywords?.join(', ')}
              </td>
            </tr>
          )}
          {versions && versions.length > 1 && (
            <tr className={styles['prj-row']}>
              <td>Version</td>
              <td style={{ fontWeight: 'bold' }}>
                <EntityVersionSelector
                  doi={entityValue.dois?.[0] ?? ''}
                  versions={versions}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <DescriptionExpander>
        <strong>Description: </strong>
        <p className="render-linebreaks">{entityValue.description}</p>
      </DescriptionExpander>
    </section>
  );
};
