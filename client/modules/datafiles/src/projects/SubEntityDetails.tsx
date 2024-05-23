import React from 'react';
import { TEntityValue } from '@client/hooks';

import styles from './BaseProjectDetails.module.css';
import { DescriptionExpander, UsernamePopover } from './BaseProjectDetails';

export const SubEntityDetails: React.FC<{
  entityValue: TEntityValue;
}> = ({ entityValue }) => {
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

          {entityValue.observationTypes && (
            <tr className={styles['prj-row']}>
              <td>Observation Type(s)</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.observationTypes.map((t) => (
                  <div key={t.name}>{t.name}</div>
                ))}
              </td>
            </tr>
          )}

          {entityValue.unit && (
            <tr className={styles['prj-row']}>
              <td>Unit of Analysis</td>
              <td style={{ fontWeight: 'bold' }}>
                <span>{entityValue.unit}</span>
              </td>
            </tr>
          )}

          {entityValue.modes && (
            <tr className={styles['prj-row']}>
              <td>Mode(s) of Collection</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.modes.map((mode) => (
                  <div key={mode}>{mode}</div>
                ))}
              </td>
            </tr>
          )}

          {entityValue.sampleApproach && (
            <tr className={styles['prj-row']}>
              <td>Sampling Approach(es)</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.sampleApproach.map((approach) => (
                  <div key={approach}>{approach}</div>
                ))}
              </td>
            </tr>
          )}

          {entityValue.sampleSize && (
            <tr className={styles['prj-row']}>
              <td>Sample Size</td>
              <td style={{ fontWeight: 'bold' }}>
                <span>{entityValue.sampleSize}</span>
              </td>
            </tr>
          )}

          {entityValue.dateStart && (
            <tr className={styles['prj-row']}>
              <td>Date(s) of Collection</td>
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

          {(entityValue.dataCollectors ?? []).length > 0 && (
            <tr className={styles['prj-row']}>
              <td>Data Collectors</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.dataCollectors
                  ?.filter((a) => a.authorship !== false)
                  .map((u, i) => (
                    <React.Fragment key={JSON.stringify(u)}>
                      <UsernamePopover user={u} />
                      {i !==
                        (entityValue.dataCollectors?.filter(
                          (a) => a.authorship !== false
                        ).length ?? 0) -
                          1 && '; '}
                    </React.Fragment>
                  ))}
              </td>
            </tr>
          )}

          {entityValue.equipment && entityValue.equipment.length > 0 && (
            <tr className={styles['prj-row']}>
              <td>Equipment</td>
              <td style={{ fontWeight: 'bold' }}>
                {entityValue.equipment.map((t) => (
                  <div key={t.name}>{t.name}</div>
                ))}
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

          {entityValue.restriction && (
            <tr className={styles['prj-row']}>
              <td>Restriction</td>
              <td style={{ fontWeight: 'bold' }}>
                <span>{entityValue.restriction}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <DescriptionExpander>
        <strong>Description: </strong>
        {entityValue.description}
      </DescriptionExpander>
    </section>
  );
};
