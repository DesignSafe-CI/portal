import React from 'react';
import { PreviewModal } from './PreviewModal';
import { CopyModal } from './CopyModal';

export type TModalChildren = (props: {
  onClick: React.MouseEventHandler<HTMLElement>;
}) => React.ReactElement;

const DatafilesModal = () => <span>Data Files Modal Root</span>;

DatafilesModal.Preview = PreviewModal;
DatafilesModal.Copy = CopyModal;

export default DatafilesModal;
