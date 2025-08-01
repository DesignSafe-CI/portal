export type TProjectUser = {
  fname: string;
  lname: string;
  email: string;
  inst: string;
  role: 'pi' | 'co_pi' | 'team_member' | 'guest';
  username?: string;
  authorship?: boolean;
};

export type TProjectAward = {
  name: string;
  number: string;
  fundingSource: string;
};

export type TReferencedWork = {
  title: string;
  doi: string;
  hrefType: 'doi' | 'url';
};

export type TAssociatedProject = {
  type: 'Context' | 'Linked Dataset' | 'Cited By';
  title: string;
  href: string;
  hrefType: 'doi' | 'url';
};

export type TFileTag = {
  tagName: string;
  path: string;
};

export type TFileObj = {
  system: string;
  name: string;
  path: string;
  type: 'file' | 'dir';
  length?: number;
  lastModified?: string;
};

export type THazmapperMap = {
  name: string;
  uuid: string;
  path: string;
  deployment: string;
  href?: string;
};

export type TDropdownValue = {
  id: string;
  name: string;
};

export type TNHEvent = {
  eventName: string;
  eventStart: string;
  eventEnd: string;
  location: string;
  latitude: string;
  longitude: string;
};

export type TBaseProjectValue = {
  projectId: string;
  projectType:
    | 'other'
    | 'experimental'
    | 'simulation'
    | 'hybrid_simulation'
    | 'field_recon'
    | 'field_reconnaissance'
    | 'None';

  title: string;
  description: string;
  tombstone?: boolean;
  tombstoneMessage?: string;
  users: TProjectUser[];
  dataTypes?: TDropdownValue[];
  authors: TProjectUser[];

  awardNumbers: TProjectAward[];
  associatedProjects: TAssociatedProject[];
  referencedData: TReferencedWork[];
  keywords: string[];
  nhEvents: TNHEvent[];
  nhTypes: TDropdownValue[];
  frTypes?: TDropdownValue[];
  facilities: TDropdownValue[];

  dois: string[];
  fileObjs: TFileObj[];
  fileTags: TFileTag[];

  hazmapperMaps?: THazmapperMap[];

  license?: string;
};

export type TEntityValue = {
  title: string;
  tombstone?: boolean;
  tombstoneMessage?: string;
  description?: string;
  dataCollectors?: TProjectUser[];
  projectId?: string;
  authors?: TProjectUser[];
  fileObjs?: TFileObj[];
  fileTags: TFileTag[];
  dateStart?: string;
  dateEnd?: string;
  location?: string;
  event?: string;
  facility?: TDropdownValue;
  latitude?: string;
  longitude?: string;
  dois?: string[];
  referencedData: TReferencedWork[];
  relatedWork: TAssociatedProject[];
  keywords?: string[];

  experimentType?: TDropdownValue;
  equipmentType?: TDropdownValue;
  procedureStart?: string;
  procedureEnd?: string;

  simulationType?: TDropdownValue;

  observationTypes?: TDropdownValue[];
  equipment?: TDropdownValue[];

  unit?: string;
  modes?: string[];
  sampleSize?: string;
  sampleApproach?: string[];
  restriction?: string;
};

export type TProjectMeta = {
  uuid: string;
  name: string;
  created: string;
  lastUpdated: string;
};

export type TBaseProject = TProjectMeta & {
  name: 'designsafe.project';
  value: TBaseProjectValue;
};

export type TEntityMeta = TProjectMeta & {
  value: TEntityValue;
};

export type TPreviewTreeData = {
  name: string;
  id: string;
  uuid: string;
  value: TEntityValue;
  order: number;
  version?: number;
  publicationDate?: string;
  children: TPreviewTreeData[];
};

export type TTreeData = {
  name: string;
  id: string;
  uuid: string;
  order: number;
  children: TTreeData[];
};
