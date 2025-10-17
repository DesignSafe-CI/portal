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
          {(validationErrors ?? [])
            .filter((e) => e.errorType === 'VERSION_MULTIPLE')
            .map((validationError) => (
              <div key={validationError.title}>
                <strong>
                  Only a single collection can be versioned at a time.
                </strong>
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
    if (operation === 'amend') {
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
    } else if (operation === 'version' && entityUuids.length > 1) {
      setValidationErrors([
        {
          name: 'Project',
          title: 'Project',
          errorType: 'VERSION_MULTIPLE',
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
      {(validationErrors?.length ?? 0) > 0 && (
        <PipelineValidationAlert validationErrors={validationErrors} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sortedChildren.map((child) => (
          <section key={child.id}>
            <Button
              disabled={
                operation === 'amend' ||
                // Can't publish a collection that has already been published.
                (operation === 'publish' &&
                  (child.value.dois?.length ?? 0) > 0) ||
                // Can't version a collection that has not been published.
                (operation === 'version' &&
                  (child.value.dois?.length ?? 0) === 0)
              }
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
