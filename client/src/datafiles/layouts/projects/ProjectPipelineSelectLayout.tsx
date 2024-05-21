import { useProjectDetail } from '@client/hooks';
import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

export const ProjectPipelineSelectLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!projectId || !data) return null;

  const has_published_entities = !!data.entities.find(
    (e) => e.value.dois && e.value.dois.length > 0
  );

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      <NavLink to={`/projects/${projectId}/preview`}>
        <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back
      </NavLink>
      <div className="pipeline-page">
        <div className="pipeline-header">
          <h3>Publish, Amend, or Version</h3>
          If you need help, attend{' '}
          <a
            href="/facilities/virtual-office-hours/"
            target="_blank"
            aria-describedby="msg-open-new-window"
          >
            curation office hours
          </a>
          .
        </div>
        <div className="pipeline-notification"></div>
        <div>
          <div className="pipeline-section">
            <h3>Publishing</h3>
            <hr />
            <ul>
              <li>Publish new dataset(s) in your project.</li>
              <li>
                If you need to publish subsequent dataset(s),&nbsp;
                <a
                  href="/help/new-ticket/?category=DATA_CURATION_PUBLICATION&amp;subject=Request+to+Update+or+Remove+Authors+for+PRJ-3986"
                  target="_blank"
                  aria-describedby="msg-open-new-window"
                >
                  submit a ticket
                </a>{' '}
                with your project number and the name of the dataset(s).
              </li>
            </ul>
            <NavLink to={`/projects/${projectId}/prepare-to-publish/pipeline`}>
              <button
                className="btn btn-small btn-add"
                disabled={has_published_entities}
              >
                Publish
              </button>
            </NavLink>
          </div>
          <div>
            <div className="pipeline-section">
              <h3>Amend Metadata</h3>
              <hr />
              <ul>
                <li>
                  Amend published metadata without creating a new version.
                </li>
                <li>
                  Amendable metadata: Related work, referenced data, awards,
                  keywords, author order, descriptions, natural hazard type, and
                  natural hazard event.
                </li>
              </ul>
              <NavLink
                to={`/projects/${projectId}/prepare-to-publish/pipeline?operation=amend`}
              >
                <button
                  className="btn btn-small btn-add"
                  disabled={!has_published_entities}
                >
                  Amend
                </button>
              </NavLink>
            </div>
            <div className="pipeline-section">
              <h3>Versioning</h3>
              <hr />
              <ul>
                <li>
                  Any changes to published files/data requires a new version.
                </li>
                <li>
                  Change the files/data in the curation directory before this
                  step.
                </li>
                <li>
                  You will be required to explain the reason for a new version.
                </li>
                <li>
                  <strong>The DOI will NOT change</strong>, but the citation
                  will include a version number. Ex. v2
                </li>
              </ul>
              <NavLink
                to={`/projects/${projectId}/prepare-to-publish/pipeline?operation=version`}
              >
                <button
                  className="btn btn-small btn-add"
                  disabled={!has_published_entities}
                >
                  Version
                </button>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
