import React, { useRef, useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Button, Modal } from 'antd';
import {
  TEntityValue,
  useCreateEntity,
  useDeleteEntity,
  useNotifyContext,
  usePatchEntityMetadata,
  useProjectDetail,
} from '@client/hooks';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import { PublishableEntityForm } from '../forms/PublishableEntityForm';
import { PublishedEntityDetails } from '../PublishedEntityDetails';
import { DISPLAY_NAMES } from '../constants';
import { EntityFileListingTable } from '../ProjectPreview/ProjectPreview';

const CategoryDetail: React.FC<{
  value?: TEntityValue;
  entityUuid: string;
  setUuid: CallableFunction;
}> = ({ value, entityUuid, setUuid }) => {
  const { mutate: deleteEntity } = useDeleteEntity();

  return (
    <section>
      {value && <PublishedEntityDetails entityValue={value} />}
      <Button type="link" onClick={() => setUuid(entityUuid)}>
        {'Edit'}
      </Button>
      &nbsp;|&nbsp;
      <Button type="link" onClick={() => deleteEntity({ entityUuid })}>
        Delete
      </Button>
      {value?.fileObjs && value.fileObjs.length > 0 && (
        <div style={{ margin: '10px -12px' }}>
          <EntityFileListingTable
            preview
            treeData={{
              value,
              id: '',
              uuid: entityUuid,
              name: '',
              order: 0,
              children: [],
            }}
          />
        </div>
      )}
    </section>
  );
};

export const ManagePublishableEntityModal: React.FC<{
  projectId: string;
  entityName: string;
  editOnly?: boolean;
  children: TModalChildren;
}> = ({ projectId, entityName, editOnly = false, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useProjectDetail(projectId);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };
  const { mutate: createEntity } = useCreateEntity(projectId);
  const { mutate: updateEntity } = usePatchEntityMetadata();

  const handleSubmit = (formData: Record<string, unknown>) => {
    if (!selectedUuid) {
      createEntity(
        { formData: { name: entityName, value: formData } },
        { onSuccess }
      );
      return;
    }
    if (selectedUuid) {
      updateEntity(
        { entityUuid: selectedUuid, patchMetadata: formData },
        { onSuccess: onSuccess }
      );
    }
  };

  const { notifyApi } = useNotifyContext();

  const [selectedUuid, setSelectedUuid] = useState<string | undefined>(
    undefined
  );

  const formRef = useRef<HTMLHeadingElement>(null);
  const setFormUuid = (uuid?: string) => {
    setSelectedUuid(uuid);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!data) return null;

  const projectType = data.baseProject.value.projectType;
  const onSuccess = () => {
    notifyApi?.open({
      type: 'success',
      message: '',
      description: selectedUuid
        ? 'Metadata has been updated successfully.'
        : 'A new metadata record has been created.',
      placement: 'bottomLeft',
    });
    setSelectedUuid(undefined);
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="900px"
        title={<h2 ref={formRef}>Manage {DISPLAY_NAMES[entityName]}s</h2>}
        footer={null}
      >
        {!editOnly && (
          <section style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <PublishableEntityForm
              entityName={entityName}
              mode={selectedUuid ? 'edit' : 'create'}
              projectId={projectId}
              projectType={projectType}
              entityUuid={selectedUuid}
              onCancelEdit={() => setSelectedUuid(undefined)}
              onSubmit={handleSubmit}
            />
          </section>
        )}

        <article style={{ marginTop: '5px' }}>
          {data.entities.length >= 1 && (
            <strong>{DISPLAY_NAMES[entityName]} Inventory</strong>
          )}
          {data.entities
            .filter((e) => e.name === entityName)
            .map((entity) => (
              <ProjectCollapse
                key={entity.uuid}
                title={entity.value.title}
                entityName={entity.name}
              >
                <CategoryDetail
                  value={entity.value}
                  entityUuid={entity.uuid}
                  setUuid={setFormUuid}
                />
              </ProjectCollapse>
            ))}
        </article>
      </Modal>
    </>
  );
};
