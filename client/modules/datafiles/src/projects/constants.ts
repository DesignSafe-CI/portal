import { TBaseProjectValue } from '@client/hooks';

export const PROJECT = 'designsafe.project';
//const PROJECT_GRAPH = 'designsafe.project.graph';
// Experimental
export const EXPERIMENT = 'designsafe.project.experiment';
export const EXPERIMENT_REPORT = 'designsafe.project.report';
export const EXPERIMENT_ANALYSIS = 'designsafe.project.analysis';
export const EXPERIMENT_MODEL_CONFIG = 'designsafe.project.model_config';
export const EXPERIMENT_SENSOR = 'designsafe.project.sensor_list';
export const EXPERIMENT_EVENT = 'designsafe.project.event';
// Simulation
export const SIMULATION = 'designsafe.project.simulation';
export const SIMULATION_REPORT = 'designsafe.project.simulation.report';
export const SIMULATION_ANALYSIS = 'designsafe.project.simulation.analysis';
export const SIMULATION_MODEL = 'designsafe.project.simulation.model';
export const SIMULATION_INPUT = 'designsafe.project.simulation.input';
export const SIMULATION_OUTPUT = 'designsafe.project.simulation.output';
// Field Research
export const FIELD_RECON_MISSION = 'designsafe.project.field_recon.mission';
export const FIELD_RECON_REPORT = 'designsafe.project.field_recon.report';
export const FIELD_RECON_SOCIAL_SCIENCE =
  'designsafe.project.field_recon.social_science';
export const FIELD_RECON_PLANNING = 'designsafe.project.field_recon.planning';
export const FIELD_RECON_GEOSCIENCE =
  'designsafe.project.field_recon.geoscience';
// Hybrid Sim
export const HYBRID_SIM = 'designsafe.project.hybrid_simulation';
export const HYBRID_SIM_GLOBAL_MODEL =
  'designsafe.project.hybrid_simulation.global_model';
export const HYBRID_SIM_COORDINATOR =
  'designsafe.project.hybrid_simulation.coordinator';
export const HYBRID_SIM_SIM_SUBSTRUCTURE =
  'designsafe.project.hybrid_simulation.sim_substructure';
export const HYBRID_SIM_EXP_SUBSTRUCTURE =
  'designsafe.project.hybrid_simulation.exp_substructure';
export const HYBRID_SIM_COORDINATOR_OUTPUT =
  'designsafe.project.hybrid_simulation.coordinator_output';
export const HYBRID_SIM_SIM_OUTPUT =
  'designsafe.project.hybrid_simulation.sim_output';
export const HYBRID_SIM_EXP_OUTPUT =
  'designsafe.project.hybrid_simulation.exp_output';
export const HYBRID_SIM_ANALYSIS =
  'designsafe.project.hybrid_simulation.analysis';
export const HYBRID_SIM_REPORT = 'designsafe.project.hybrid_simulation.report';

export const PROJECT_COLORS: Record<string, { outline: string; fill: string }> =
  {
    [PROJECT]: { outline: 'black', fill: 'white' },
    [EXPERIMENT]: { outline: 'black', fill: 'white' },
    [EXPERIMENT_REPORT]: { outline: '#cccccc', fill: '#f5f5f5' },
    [EXPERIMENT_ANALYSIS]: { outline: '#56C0E0', fill: '#CCECF6' },
    [EXPERIMENT_MODEL_CONFIG]: { outline: '#1568C9', fill: '#C4D9F2' },
    [EXPERIMENT_SENSOR]: { outline: '#43A59D', fill: '#CAE9E6' },
    [EXPERIMENT_EVENT]: { outline: '#B59300', fill: '#ECE4BF' },

    [SIMULATION]: { outline: '#cccccc', fill: '#f5f5f5' },
    [SIMULATION_REPORT]: { outline: '#cccccc', fill: '#f5f5f5' },
    [SIMULATION_ANALYSIS]: { outline: '#56C0E0', fill: '#CCECF6' },
    [SIMULATION_MODEL]: { outline: '#1568C9', fill: '#C4D9F2' },
    [SIMULATION_INPUT]: { outline: '#43A59D', fill: '#CAE9E6' },
    [SIMULATION_OUTPUT]: { outline: '#B59300', fill: '#ECE4BF' },

    [HYBRID_SIM]: { outline: '#cccccc', fill: '#f5f5f5' },
    [HYBRID_SIM_ANALYSIS]: { outline: '#56C0E0', fill: '#CCECF6' },
    [HYBRID_SIM_REPORT]: { outline: '#cccccc', fill: '#f5f5f5' },
    [HYBRID_SIM_GLOBAL_MODEL]: { outline: '#1568C9', fill: '#C4D9F2' },
    [HYBRID_SIM_COORDINATOR]: { outline: '#43A59D', fill: '#CAE9E6' },
    [HYBRID_SIM_COORDINATOR_OUTPUT]: { outline: '#B59300', fill: '#ECE4BF' },
    [HYBRID_SIM_EXP_SUBSTRUCTURE]: { outline: '#4B3181', fill: '#C8C0D9' },
    [HYBRID_SIM_EXP_OUTPUT]: { outline: '#B59300', fill: '#ECE4BF' },
    [HYBRID_SIM_SIM_SUBSTRUCTURE]: { outline: '#BD5717', fill: '#EBCCB9' },
    [HYBRID_SIM_SIM_OUTPUT]: { outline: '#B59300', fill: '#ECE4BF' },

    [FIELD_RECON_REPORT]: { outline: '#cccccc', fill: '#f5f5f5' },
    [FIELD_RECON_MISSION]: { outline: '#000000', fill: '#ffffff' },
    [FIELD_RECON_GEOSCIENCE]: { outline: '#43A59D', fill: '#CAE9E6' },
    [FIELD_RECON_SOCIAL_SCIENCE]: { outline: '#B59300', fill: '#ECE4BF' },
    [FIELD_RECON_PLANNING]: { outline: '#43A59D', fill: '#CAE9E6' },
  };

export const ALLOWED_RELATIONS: Record<string, string[]> = {
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

// Configures which entity types can have files associated to them.
export const ENTITIES_WITH_FILES: Record<
  TBaseProjectValue['projectType'],
  string[]
> = {
  experimental: [
    EXPERIMENT_ANALYSIS,
    EXPERIMENT_REPORT,
    EXPERIMENT_MODEL_CONFIG,
    EXPERIMENT_SENSOR,
    EXPERIMENT_EVENT,
  ],
  simulation: [
    SIMULATION_ANALYSIS,
    SIMULATION_REPORT,
    SIMULATION_MODEL,
    SIMULATION_INPUT,
    SIMULATION_OUTPUT,
  ],
  hybrid_simulation: [
    HYBRID_SIM_ANALYSIS,
    HYBRID_SIM_REPORT,
    HYBRID_SIM_COORDINATOR,
    HYBRID_SIM_COORDINATOR_OUTPUT,
    HYBRID_SIM_GLOBAL_MODEL,
    HYBRID_SIM_EXP_OUTPUT,
    HYBRID_SIM_EXP_SUBSTRUCTURE,
    HYBRID_SIM_SIM_OUTPUT,
    HYBRID_SIM_SIM_SUBSTRUCTURE,
  ],
  field_recon: [
    FIELD_RECON_GEOSCIENCE,
    FIELD_RECON_PLANNING,
    FIELD_RECON_REPORT,
    FIELD_RECON_SOCIAL_SCIENCE,
  ],
  field_reconnaissance: [],
  other: [PROJECT],
  None: [],
};

export const DISPLAY_NAMES: Record<string, string> = {
  [PROJECT]: 'Project',
  // Experimental
  [EXPERIMENT]: 'Experiment',
  [EXPERIMENT_MODEL_CONFIG]: 'Model Configuration',
  [EXPERIMENT_SENSOR]: 'Sensor',
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
  [FIELD_RECON_PLANNING]: 'Research Planning Collection',
};

export const PUBLISHABLE_NAMES = [
  PROJECT,
  EXPERIMENT,
  SIMULATION,
  HYBRID_SIM,
  FIELD_RECON_MISSION,
  FIELD_RECON_REPORT,
];

// Enumeration of non-publishable entities that can be added in the "Add Categories" modal
export const CATEGORIES_BY_PROJECT_TYPE: Record<string, string[]> = {
  experimental: [
    EXPERIMENT_ANALYSIS,
    EXPERIMENT_REPORT,
    EXPERIMENT_MODEL_CONFIG,
    EXPERIMENT_SENSOR,
    EXPERIMENT_EVENT,
  ],
  simulation: [
    SIMULATION_ANALYSIS,
    SIMULATION_REPORT,
    SIMULATION_MODEL,
    SIMULATION_INPUT,
    SIMULATION_OUTPUT,
  ],
  hybrid_simulation: [
    HYBRID_SIM_ANALYSIS,
    HYBRID_SIM_REPORT,
    HYBRID_SIM_COORDINATOR,
    HYBRID_SIM_COORDINATOR_OUTPUT,
    HYBRID_SIM_GLOBAL_MODEL,
    HYBRID_SIM_EXP_OUTPUT,
    HYBRID_SIM_EXP_SUBSTRUCTURE,
    HYBRID_SIM_SIM_OUTPUT,
    HYBRID_SIM_SIM_SUBSTRUCTURE,
  ],
  field_recon: [
    FIELD_RECON_GEOSCIENCE,
    FIELD_RECON_PLANNING,
    FIELD_RECON_SOCIAL_SCIENCE,
  ],
};
