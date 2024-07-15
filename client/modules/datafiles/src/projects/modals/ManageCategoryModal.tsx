import React, { useRef, useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Button, Modal } from 'antd';
import {
  TBaseProjectValue,
  TEntityValue,
  useCreateEntity,
  useDeleteEntity,
  useNotifyContext,
  usePatchEntityMetadata,
  useProjectDetail,
} from '@client/hooks';
import { CATEGORIES_BY_PROJECT_TYPE } from '../constants';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import { ProjectCategoryForm } from '../forms/ProjectCategoryForm';
import { SubEntityDetails } from '../SubEntityDetails';
import { EntityFileListingTable } from '../ProjectPreview/ProjectPreview';

const CategoryDetail: React.FC<{
  value: TEntityValue;
  projectType: TBaseProjectValue['projectType'];
  projectId: string;
  entityUuid: string;
  setUuid: CallableFunction;
}> = ({ value, projectId, projectType, entityUuid, setUuid }) => {
  const { mutate: deleteEntity } = useDeleteEntity();

  return (
    <section>
      <SubEntityDetails entityValue={value} />
      <Button type="link" onClick={() => setUuid(entityUuid)}>
        Edit
      </Button>
      &nbsp;|&nbsp;
      <Button type="link" onClick={() => deleteEntity({ entityUuid })}>
        Delete
      </Button>
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
    </section>
  );
};

export const ManageCategoryModal: React.FC<{
  projectId: string;
  editOnly?: boolean;
  children: TModalChildren;
}> = ({ projectId, editOnly = false, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useProjectDetail(projectId);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { mutate: createEntity } = useCreateEntity(projectId);
  const { mutate: updateEntity } = usePatchEntityMetadata();

  const handleSubmit = (formData: {
    name: string;
    value: Record<string, unknown>;
  }) => {
    if (!selectedUuid) {
      createEntity({ formData }, { onSuccess });
      return;
    }
    if (selectedUuid) {
      updateEntity(
        { entityUuid: selectedUuid, patchMetadata: formData.value },
        { onSuccess: onSuccess }
      );
    }
  };

  const [selectedUuid, setSelectedUuid] = useState<string | undefined>(
    undefined
  );

  const formRef = useRef<HTMLHeadingElement>(null);
  const setFormUuid = (uuid?: string) => {
    setSelectedUuid(uuid);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { notifyApi } = useNotifyContext();

  const onSuccess = () => {
    notifyApi?.open({
      type: 'success',
      message: '',
      description: selectedUuid
        ? 'Metadata has been updated successfully.'
        : 'A new metadata record has been created.',
      placement: 'bottomLeft',
    });
  };

  if (!data) return null;

  const projectType = data.baseProject.value.projectType;

  const categories = CATEGORIES_BY_PROJECT_TYPE[projectType] ?? [];

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="900px"
        title={<h2 ref={formRef}>Manage Categories</h2>}
        footer={null}
      >
        {!editOnly && (
          <section style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <ProjectCategoryForm
              mode={selectedUuid ? 'edit' : 'create'}
              entityUuid={selectedUuid}
              projectId={projectId}
              projectType={projectType}
              onSubmit={handleSubmit}
              onCancelEdit={() => setSelectedUuid(undefined)}
            />
          </section>
        )}
        <article style={{ marginTop: '5px' }}>
          {categories.length >= 1 && <strong>Category Inventory</strong>}
          {categories.map((category) =>
            data.entities
              .filter((e) => e.name === category)
              .map((entity) => (
                <ProjectCollapse
                  key={entity.uuid}
                  title={entity.value.title}
                  entityName={entity.name}
                >
                  <CategoryDetail
                    value={entity.value}
                    entityUuid={entity.uuid}
                    projectId={projectId}
                    projectType={projectType}
                    setUuid={setFormUuid}
                  />
                </ProjectCollapse>
              ))
          )}
        </article>
      </Modal>
    </>
  );
};
