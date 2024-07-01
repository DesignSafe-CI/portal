import { BaseProjectForm } from '../forms/BaseProjectForm';

import React, { useCallback, useMemo, useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Alert, Button, Modal, Radio, Steps } from 'antd';
import { TBaseProjectValue, useChangeProjectType } from '@client/hooks';
import { experimentSteps } from './ProjectInfoStepper/ExperimentalSteps';
import { SimulationSteps } from './ProjectInfoStepper/SimulationSteps';
import { sensitiveDataContext } from './ProjectInfoStepper/sensitiveDataContext';
import { fieldReconSteps } from './ProjectInfoStepper/FieldReconSteps';
import { ProjectTypeRadioSelect } from './ProjectTypeRadioSelect';

const ProjectTypeSelector: React.FC<{
  selectedType: TBaseProjectValue['projectType'] | undefined;
  setSelectedType: (arg: TBaseProjectValue['projectType'] | undefined) => void;
  onConfirm: () => void;
}> = ({ selectedType, setSelectedType, onConfirm }) => {
  return (
    <section>
      <Radio.Group
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
      >
        <Radio value="experimental">
          <ProjectTypeRadioSelect
            label="Experimental Project"
            iconName="curation-experiment overview-prj-type"
            description="For physical work, typically done at an experimental facility or in the field."
          />
        </Radio>
        <Radio value="simulation">
          <ProjectTypeRadioSelect
            label="Simulation Project"
            iconName="curation-simulation overview-prj-type"
            description="For numerical and/or analytical work, done with software."
          />
        </Radio>
        <Radio value="hybrid_simulation">
          <ProjectTypeRadioSelect
            label="Hybrid Simulation Project"
            iconName="curation-hybrid overview-prj-type"
            description="For work using both physical and numerical components."
          />
        </Radio>
        <Radio value="field_recon">
          <ProjectTypeRadioSelect
            label="Field Research Project"
            iconName="curation-recon overview-prj-type"
            description="For work done in areas affected by natural hazards."
          />
        </Radio>
        <Radio value="other">
          <ProjectTypeRadioSelect
            label="Other Type Project"
            iconName="curation-other overview-prj-type"
            description="For work other than the project types above."
          />
        </Radio>
      </Radio.Group>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          disabled={!selectedType}
          onClick={onConfirm}
          type="primary"
          className="success-button"
          style={{ padding: '0px 40px' }}
        >
          Continue
        </Button>
      </div>
    </section>
  );
};

export const ProjectInfoDisplay: React.FC<{
  projectType: TBaseProjectValue['projectType'];
  showOptions?: boolean;
  onGoBack: () => void;
  onComplete: () => void;
}> = ({ projectType, showOptions, onGoBack, onComplete }) => {
  const steps = useMemo(() => {
    switch (projectType) {
      case 'experimental':
        return experimentSteps;
      case 'simulation':
        return SimulationSteps;
      case 'field_recon':
        return showOptions ? fieldReconSteps : fieldReconSteps.slice(0, -1);
      default:
        return [
          {
            key: '1',
            content: (
              <div className="overview-body">
                <h3>Best Practices</h3>
                <hr />
                <ul>
                  <li>
                    Publish data files in a format that is interoperable and
                    open. Example: CSV instead of SAS files
                  </li>
                  <li>
                    Before publishing raw data that has not been processed,
                    consider why it is necessary. If so, explain how others can
                    use the raw data.
                  </li>
                  <li>
                    Be selective with any images you choose. Use file tags to
                    describe them. Make sure they have a purpose or a function.
                  </li>
                  <li>
                    Do not publish ZIP files. ZIP files prevent others from
                    viewing and understanding your data.
                  </li>
                  <li>
                    Use applicable software to review for any errors in your
                    data before you publish.
                  </li>
                  <li>
                    Avoid publishing data within folders. Instead, provide a
                    direct view to the data within collections so others can
                    understand your project at a glance.
                  </li>
                </ul>
              </div>
            ),
          },
        ];
    }
  }, [projectType]);

  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(current + 1);
  }, [current, setCurrent]);

  const prev = useCallback(() => {
    setCurrent(current - 1);
  }, [current, setCurrent]);

  const items = steps.map((item) => ({ key: item.key, title: null }));
  return (
    <section style={{ marginTop: '10px' }}>
      {items.length > 1 && (
        <Steps
          style={{ marginBottom: '12px' }}
          current={current}
          items={items}
        />
      )}

      <div>{steps[current].content}</div>
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {current !== steps.length - 1 && (
            <>
              <Button type="link" onClick={() => setCurrent(steps.length - 1)}>
                <strong>Skip Overview</strong>
              </Button>{' '}
              (not recommended)
            </>
          )}
        </div>
        <div>
          <Button
            type="link"
            style={{ margin: '0 8px' }}
            onClick={() => (current === 0 ? onGoBack() : prev())}
          >
            <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back
          </Button>

          {current < steps.length - 1 && (
            <Button
              className="success-button"
              style={{ padding: '0px 40px' }}
              type="primary"
              onClick={() => next()}
            >
              Continue
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button
              type="primary"
              className="success-button"
              style={{ padding: '0px 40px' }}
              onClick={onComplete}
            >
              Finish
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export const ChangeProjectTypeModal: React.FC<{
  projectId: string;
  children: TModalChildren;
}> = ({ projectId, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setCurrentDisplay('PROJECT_TYPE');
    setIsModalOpen(false);
  };

  const [selectedType, setSelectedType] = useState<
    TBaseProjectValue['projectType'] | undefined
  >(undefined);

  const [currentDisplay, setCurrentDisplay] = useState<
    'PROJECT_TYPE' | 'PROJECT_INFO' | 'PROJECT_FORM'
  >('PROJECT_TYPE');

  const [sensitiveDataOption, setSensitiveDataOption] = useState(0);
  const { mutate } = useChangeProjectType(projectId);

  const onSubmit = (formData: Record<string, unknown>) => {
    const projectValue = { ...formData, projectId, projectType: selectedType };
    mutate({ value: projectValue, sensitiveData: sensitiveDataOption > 0 });
    handleClose();
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width={900}
        title={<h2>Change Project Type</h2>}
        footer={null}
      >
        <article>
          <Alert
            type="error"
            style={{ marginBottom: '24px' }}
            description={
              <section style={{ color: '#a94442' }}>
                <h3 style={{ textAlign: 'center', color: '#a94442' }}>
                  Warning!
                </h3>
                <p>
                  You are about to change the project type.{' '}
                  <strong>
                    All curation from your current project type will be erased.
                  </strong>{' '}
                  Files will remain in the project. If you do not want to change
                  the project type, exit this window and do not continue. If you
                  have questions, please attend our{' '}
                  <a
                    href="/facilities/virtual-office-hours/"
                    target="_blank"
                    aria-describedby="msg-open-new-window"
                  >
                    curation office hours
                  </a>
                  .
                </p>
              </section>
            }
          />

          {currentDisplay === 'PROJECT_TYPE' && (
            <ProjectTypeSelector
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              onConfirm={() => setCurrentDisplay('PROJECT_INFO')}
            />
          )}
          {selectedType && currentDisplay === 'PROJECT_INFO' && (
            <sensitiveDataContext.Provider
              value={{ sensitiveDataOption, setSensitiveDataOption }}
            >
              <ProjectInfoDisplay
                showOptions
                projectType={selectedType}
                onGoBack={() => setCurrentDisplay('PROJECT_TYPE')}
                onComplete={() => setCurrentDisplay('PROJECT_FORM')}
              />
            </sensitiveDataContext.Provider>
          )}
          {currentDisplay === 'PROJECT_FORM' && (
            <BaseProjectForm
              projectId={projectId}
              onSubmit={onSubmit}
              projectType={selectedType}
            />
          )}
        </article>
      </Modal>
    </>
  );
};
