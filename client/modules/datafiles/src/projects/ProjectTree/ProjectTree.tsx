import React, { useMemo } from 'react';
import styles from './ProjectTree.module.css';
import { useProjectDetail } from '@client/hooks';
import { Select } from 'antd';

const PROJECT = 'designsafe.project';
const PROJECT_GRAPH = 'designsafe.project.graph';
// Experimental
const EXPERIMENT = 'designsafe.project.experiment';
const EXPERIMENT_REPORT = 'designsafe.project.report';
const EXPERIMENT_ANALYSIS = 'designsafe.project.analysis';
const EXPERIMENT_MODEL_CONFIG = 'designsafe.project.model_config';
const EXPERIMENT_SENSOR = 'designsafe.project.sensor_list';
const EXPERIMENT_EVENT = 'designsafe.project.event';
// Simulation
const SIMULATION = 'designsafe.project.simulation';
const SIMULATION_REPORT = 'designsafe.project.simulation.report';
const SIMULATION_ANALYSIS = 'designsafe.project.simulation.analysis';
const SIMULATION_MODEL = 'designsafe.project.simulation.model';
const SIMULATION_INPUT = 'designsafe.project.simulation.input';
const SIMULATION_OUTPUT = 'designsafe.project.simulation.output';
// Field Research
const FIELD_RECON_MISSION = 'designsafe.project.field_recon.mission';
const FIELD_RECON_REPORT = 'designsafe.project.field_recon.report';
const FIELD_RECON_SOCIAL_SCIENCE =
  'designsafe.project.field_recon.social_science';
const FIELD_RECON_PLANNING = 'designsafe.project.field_recon.planning';
const FIELD_RECON_GEOSCIENCE = 'designsafe.project.field_recon.geoscience';
// Hybrid Sim
const HYBRID_SIM = 'designsafe.project.hybrid_simulation';
const HYBRID_SIM_GLOBAL_MODEL =
  'designsafe.project.hybrid_simulation.global_model';
const HYBRID_SIM_COORDINATOR =
  'designsafe.project.hybrid_simulation.coordinator';
const HYBRID_SIM_SIM_SUBSTRUCTURE =
  'designsafe.project.hybrid_simulation.sim_substructure';
const HYBRID_SIM_EXP_SUBSTRUCTURE =
  'designsafe.project.hybrid_simulation.exp_substructure';
const HYBRID_SIM_COORDINATOR_OUTPUT =
  'designsafe.project.hybrid_simulation.coordinator_output';
const HYBRID_SIM_SIM_OUTPUT = 'designsafe.project.hybrid_simulation.sim_output';
const HYBRID_SIM_EXP_OUTPUT = 'designsafe.project.hybrid_simulation.exp_output';
const HYBRID_SIM_ANALYSIS = 'designsafe.project.hybrid_simulation.analysis';
const HYBRID_SIM_REPORT = 'designsafe.project.hybrid_simulation.report';

const ALLOWED_RELATIONS: Record<string, string[]> = {
  [PROJECT]: [
    EXPERIMENT,
    SIMULATION,
    HYBRID_SIM,
    FIELD_RECON_MISSION,
    FIELD_RECON_REPORT,
  ],
  // Experimental
  [EXPERIMENT]: [
    EXPERIMENT_ANALYSIS,
    EXPERIMENT_REPORT,
    EXPERIMENT_MODEL_CONFIG,
  ],
  [EXPERIMENT_MODEL_CONFIG]: [EXPERIMENT_SENSOR],
  [EXPERIMENT_SENSOR]: [EXPERIMENT_EVENT],
  // Simulation
  [SIMULATION]: [SIMULATION_ANALYSIS, SIMULATION_REPORT, SIMULATION_MODEL],
  [SIMULATION_MODEL]: [SIMULATION_INPUT],
  [SIMULATION_INPUT]: [SIMULATION_OUTPUT],
  // Hybrid sim
  [HYBRID_SIM]: [
    HYBRID_SIM_REPORT,
    HYBRID_SIM_GLOBAL_MODEL,
    HYBRID_SIM_ANALYSIS,
  ],
  [HYBRID_SIM_GLOBAL_MODEL]: [HYBRID_SIM_COORDINATOR],
  [HYBRID_SIM_COORDINATOR]: [
    HYBRID_SIM_COORDINATOR_OUTPUT,
    HYBRID_SIM_SIM_SUBSTRUCTURE,
    HYBRID_SIM_EXP_SUBSTRUCTURE,
  ],
  [HYBRID_SIM_SIM_SUBSTRUCTURE]: [HYBRID_SIM_SIM_OUTPUT],
  [HYBRID_SIM_EXP_SUBSTRUCTURE]: [HYBRID_SIM_EXP_OUTPUT],
  // Field Recon
  [FIELD_RECON_MISSION]: [
    FIELD_RECON_PLANNING,
    FIELD_RECON_SOCIAL_SCIENCE,
    FIELD_RECON_GEOSCIENCE,
  ],
};

const DISPLAY_NAMES: Record<string, string> = {
  [PROJECT]: 'Project',
  // Experimental
  [EXPERIMENT]: 'Experiment',
  [EXPERIMENT_MODEL_CONFIG]: 'Sensor',
  [EXPERIMENT_SENSOR]: 'Event',
  [EXPERIMENT_ANALYSIS]: 'Analysis',
  [EXPERIMENT_EVENT]: 'Event',
  [EXPERIMENT_REPORT]: 'Report',
  // Simulation
  [SIMULATION]: 'Simulation',
  [SIMULATION_MODEL]: 'Simulation Model',
  [SIMULATION_INPUT]: 'Simulation Input',
  [SIMULATION_OUTPUT]: 'Simulation Output',
  [SIMULATION_ANALYSIS]: 'Analysis',
  [SIMULATION_REPORT]: 'Report',
  // Hybrid sim
  [HYBRID_SIM]: 'Hybrid Simulation',
  [HYBRID_SIM_REPORT]: 'Report',
  [HYBRID_SIM_ANALYSIS]: 'Analysis',
  [HYBRID_SIM_GLOBAL_MODEL]: 'Global Model',
  [HYBRID_SIM_COORDINATOR]: 'Simulation Coordinator',
  [HYBRID_SIM_SIM_SUBSTRUCTURE]: 'Simulation Substructure',
  [HYBRID_SIM_EXP_SUBSTRUCTURE]: 'Experimental Substructure',
  [HYBRID_SIM_EXP_OUTPUT]: 'Experimental Output',
  [HYBRID_SIM_COORDINATOR_OUTPUT]: 'Coordinator Output',
  [HYBRID_SIM_SIM_OUTPUT]: 'Simulation Output',
  // Field Recon
  [FIELD_RECON_MISSION]: 'Mission',
  [FIELD_RECON_GEOSCIENCE]: 'Geoscience Collection',
  [FIELD_RECON_SOCIAL_SCIENCE]: 'Social Science Collection',
  [FIELD_RECON_REPORT]: 'Document Collection',
  [FIELD_RECON_PLANNING]: 'Planning Collection',
};

const EntitySelector: React.FC<{ projectId: string; entityName: string }> = ({
  projectId,
  entityName,
}) => {
  const { data } = useProjectDetail(projectId);

  if (!data) return null;
  if (!ALLOWED_RELATIONS[entityName]) return null;
  const { entities } = data;
  const options = entities
    .filter((e) => ALLOWED_RELATIONS[entityName].includes(e.name))
    .map((e) => ({
      label: `${DISPLAY_NAMES[e.name]}: ${e.value.title}`,
      value: e.uuid,
    }));
  const placeholder = ALLOWED_RELATIONS[entityName]
    .map((n) => DISPLAY_NAMES[n])
    .join('/');
  return (
    <Select
      style={{ width: 500 }}
      placeholder={`Select ${placeholder}`}
      options={options}
    ></Select>
  );
};

type TTreeData = {
  name: string;
  id: string;
  order: number;
  children: TTreeData[];
};

function RecursiveTree({
  treeData,
  projectId,
}: {
  treeData: TTreeData;
  projectId: string;
}) {
  const sortedChildren = useMemo(
    () => [...(treeData.children ?? [])].sort((a, b) => a.order - b.order),
    [treeData]
  );

  const showDropdown =
    ALLOWED_RELATIONS[treeData.name] && treeData.name !== 'designsafe.project';

  return (
    <li className={styles['tree-li']}>
      <span className={styles['tree-list-item']}>
        {DISPLAY_NAMES[treeData.name]}
      </span>
      {sortedChildren.length > 0 && (
        <ul className={styles['tree-ul']}>
          {sortedChildren.map((child) => (
            <RecursiveTree
              treeData={child}
              key={child.id}
              projectId={projectId}
            />
          ))}
          {showDropdown && (
            <li className={styles['tree-li']}>
              <span className={styles['tree-select-item']}>
                <EntitySelector
                  projectId={projectId}
                  entityName={treeData.name}
                />
              </span>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

export const ProjectTree: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data } = useProjectDetail(projectId);
  const treeJSON = data?.tree as TTreeData;

  if (!treeJSON) return <div>project tree</div>;
  return (
    <ul className={styles['tree-base']}>
      <RecursiveTree treeData={treeJSON} projectId={projectId} />
    </ul>
  );
};
