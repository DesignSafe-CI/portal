import React from 'react';
import { PreviewModal } from './PreviewModal';
import { CopyModal } from './CopyModal';
import { RenameModal } from './RenameModal';
import { NewFolderModal } from './NewFolderModal';
import { UploadFileModal } from './UploadFileModal';
import { UploadFolderModal } from './UploadFolderModal';
import { MoveModal } from './MoveModal';

export type TModalChildren = (props: {
  onClick: React.MouseEventHandler<HTMLElement>;
}) => React.ReactElement;

const DatafilesModal = () => <span>Data Files Modal Root</span>;

DatafilesModal.Preview = PreviewModal;
DatafilesModal.Copy = CopyModal;
DatafilesModal.Rename = RenameModal;
DatafilesModal.NewFolder = NewFolderModal;
DatafilesModal.UploadFile = UploadFileModal;
DatafilesModal.UploadFolder = UploadFolderModal;
DatafilesModal.Move = MoveModal;

export default DatafilesModal;
