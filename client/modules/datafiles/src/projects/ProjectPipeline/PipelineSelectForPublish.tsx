import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TPipelineValidationResult,
  TPreviewTreeData,
  useProjectPreview,
  useValidateEntitySelection,
} from '@client/hooks';
import { Alert, Button } from 'antd';
import { DISPLAY_NAMES } from '../constants';
import { NavLink, useSearchParams } from 'react-router-dom';
import { PublishedEntityDisplay } from '../ProjectPreview/ProjectPreview';

const PipelineValidationAlert: React.FC<{
  validationErrors: TPipelineValidationResult[] | undefined;
}> = ({ validationErrors }) => {
  return (
    <Alert
      type="error"
      style={{ marginBottom: '24px' }}
      message={
        <span>
          {' '}
          Your selection has missing data or incomplete requirements. Please
          review the following fields:
        </span>
      }
      description={
        <div>
          {(validationErrors ?? [])
            .filter((e) => e.errorType === 'MISSING_ENTITY')
            .map((validationError) => (
              <div key={validationError.title}>
                In the {DISPLAY_NAMES[validationError.name]}{' '}
                <strong>{validationError.title}</strong>, the following
                requirements are missing or incomplete:
                <ul>
                  {validationError.missing.map((missingReq) => (
                    <li key={missingReq}>{DISPLAY_NAMES[missingReq]}</li>
                  ))}
                </ul>
              </div>
            ))}
          {(validationErrors ?? [])
            .filter((e) => e.errorType === 'MISSING_FILES')
            .map((validationError) => (
              <div key={validationError.title}>
                The {DISPLAY_NAMES[validationError.name]}{' '}
                <strong>{validationError.title}</strong> has no associated data.
              </div>
            ))}
          {(validationErrors ?? [])
            .filter((e) => e.errorType === 'NO_SELECTION')
            .map((validationError) => (
              <div key={validationError.title}>
                <strong>No publishable collections are selected.</strong>
              </div>
            ))}
        </div>
      }
    />
  );
};

export const PipelineSelectForPublish: React.FC<{
  projectId: string;
  nextStep: () => void;
}> = ({ projectId, nextStep }) => {
  const { data } = useProjectPreview(projectId ?? '');
  const { children } = (data?.tree ?? { children: [] }) as TPreviewTreeData;
  const { mutateAsync } = useValidateEntitySelection();
  const [validationErrors, setValidationErrors] = useState<
    TPipelineValidationResult[] | undefined
  >(undefined);

  const sortedChildren = useMemo(
    () => [...(children ?? [])].sort((a, b) => a.order - b.order),
    [children]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const operation = searchParams.get('operation');
  const selectedEntities = searchParams.getAll('selected');

  const toggleEntitySelection = useCallback(
    (uuid: string) => {
      const selectedEntities = searchParams.getAll('selected');
      const newSearchParams = new URLSearchParams(searchParams);

      if (selectedEntities.includes(uuid)) {
        newSearchParams.delete('selected', uuid);
        setSearchParams(newSearchParams, { replace: true });
      } else {
        newSearchParams.append('selected', uuid);
        setSearchParams(newSearchParams, { replace: true });
      }
    },
    [setSearchParams, searchParams]
  );

  useEffect(() => {
    if (operation !== 'publish') {
      const publishableChildren = sortedChildren.filter((child) =>
        data?.entities.some(
          (ent) => ent.uuid === child.uuid && (ent.value.dois?.length ?? 0) > 0
        )
      );
      publishableChildren.forEach((c) => {
        if (!selectedEntities.includes(c.uuid)) {
          toggleEntitySelection(c.uuid);
        }
      });
    }
  }, [
    operation,
    sortedChildren,
    data,
    toggleEntitySelection,
    selectedEntities,
  ]);

  const validateAndContinue = async () => {
    const entityUuids = searchParams.getAll('selected');
    const res = await mutateAsync({ projectId, entityUuids: entityUuids });
    if (entityUuids.length === 0) {
      setValidationErrors([
        {
          name: 'Project',
          title: 'Project',
          errorType: 'NO_SELECTION',
          missing: [],
        },
      ]);
    } else if (res.result.length > 0) {
      setValidationErrors(res.result);
    } else {
      setValidationErrors(undefined);
      nextStep();
    }
  };

  if (!data) return null;

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
        <NavLink to={`/projects/${projectId}/preview`}>
          <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back to
          Publication Preview
        </NavLink>
        <Button
          className="success-button"
          style={{ padding: '0px 40px' }}
          type="primary"
          onClick={() => validateAndContinue()}
        >
          Continue
        </Button>
      </div>
      {operation !== 'publish' && (
        <Alert
          showIcon
          style={{ marginBottom: '12px' }}
          description={
            <span>
              Amending or revising a project will impact all previously
              published works. New datasets cannot be published through this
              process. 
              <br />
              If you need to publish subsequent dataset(s), please{' '}
              <a
                href={`/help/new-ticket/?category=DATA_CURATION_PUBLICATION&amp;subject=Request+to+Update+or+Remove+Authors+for+${projectId}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby="msg-open-new-window"
              >
                submit a ticket
              </a>{' '}
              with your project number, the name of the dataset(s), and the author order of the dataset(s).
            </span>
          }
        />
      )}
      {(validationErrors?.length ?? 0) > 0 && (
        <PipelineValidationAlert validationErrors={validationErrors} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sortedChildren.map((child) => (
          <section key={child.id}>
            <Button
              disabled={operation !== 'publish'}
              type="link"
              onClick={() => toggleEntitySelection(child.uuid)}
            >
              Select this {DISPLAY_NAMES[child.name]} and all its files
            </Button>{' '}
            {searchParams.getAll('selected').includes(child.uuid) && (
              <i
                role="none"
                className="fa fa-check"
                style={{ color: '#1CB500' }}
              ></i>
            )}
            <PublishedEntityDisplay
              preview
              projectId={projectId}
              treeData={child}
              defaultOpen={false}
              key={child.id}
            />
          </section>
        ))}
      </div>
    </>
  );
};
