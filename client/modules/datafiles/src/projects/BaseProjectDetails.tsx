import React, { useEffect, useState, useCallback } from 'react';
import { TBaseProjectValue } from '@client/hooks';

import styles from './BaseProjectDetails.module.css';
import { Button } from 'antd';

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

export const BaseProjectDetails: React.FC<{
  projectValue: TBaseProjectValue;
}> = ({ projectValue }) => {
  const pi = projectValue.users.find((u) => u.role === 'pi');
  const coPis = projectValue.users.filter((u) => u.role === 'co_pi');

  return (
    <>
      <table style={{ width: '100%' }}>
        <colgroup>
          <col style={{ width: '200px' }} />
          <col />
        </colgroup>
        <tbody>
          <tr className="prj-row">
            <td>PI</td>
            <td
              style={{ fontWeight: 'bold' }}
            >{`${pi?.lname}, ${pi?.fname}`}</td>
          </tr>
          <tr className="prj-row">
            <td>Co-PIs</td>
            <td style={{ fontWeight: 'bold' }}>
              {coPis.map((u) => `${u.lname}, ${u.fname}`).join(', ')}
            </td>
          </tr>
          <tr className="prj-row">
            <td>Project Type</td>
            <td style={{ fontWeight: 'bold' }}>{projectValue.projectType}</td>
          </tr>
          <tr className="prj-row">
            <td>Data Types</td>
            <td style={{ fontWeight: 'bold' }}>
              {projectValue.dataTypes?.map((d) => d.name).join(', ')}
            </td>
          </tr>
          <tr className="prj-row">
            <td>Natural Hazard Type</td>
            <td style={{ fontWeight: 'bold' }}>{`${projectValue.nhTypes
              .map((t) => t.name)
              .join(', ')}`}</td>
          </tr>
          <tr className="prj-row" hidden={!projectValue.facilities.length}>
            <td>Facilities</td>
            <td style={{ fontWeight: 'bold' }}>
              {projectValue.facilities.map((t) => (
                <div>{t.name}</div>
              ))}
            </td>
          </tr>
          <tr>
            <td>Events</td>
            <td style={{ fontWeight: 'bold' }}>
              {projectValue.nhEvents.map((evt) => (
                <div>
                  {evt.eventName} | {evt.location} {evt.eventStart}-
                  {evt.eventEnd} | Lat {evt.latitude} long {evt.longitude}
                </div>
              ))}
            </td>
          </tr>
          <tr className="prj-row">
            <td>Awards</td>
            <td style={{ fontWeight: 'bold' }}>
              {projectValue.awardNumbers.map((t) => (
                <div>
                  {[t.name, t.number, t.fundingSource]
                    .filter((v) => !!v)
                    .join(' | ')}{' '}
                </div>
              ))}
            </td>
          </tr>
          <tr className="prj-row">
            <td>Keywords</td>
            <td style={{ fontWeight: 'bold' }}>
              {projectValue.keywords.join(', ')}
            </td>
          </tr>
        </tbody>
      </table>
      <DescriptionExpander>
        <strong>Description: </strong>
        {projectValue.description}
      </DescriptionExpander>
    </>
  );
};
