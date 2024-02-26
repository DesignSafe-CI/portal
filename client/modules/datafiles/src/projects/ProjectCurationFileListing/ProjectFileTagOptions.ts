import { DefaultOptionType } from 'antd/es/select';
import * as constants from '../constants';

function toOptions(options: string[], key: string = '') {
  return options.map((o) => ({ label: o, value: o, key: o + key }));
}

const OTHER_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      'Audiovisual',
      'Checksheet',
      'CSV',
      'Codebook',
      'Data',
      'Data Dictionary',
      'Data Report',
      'GeoJSON',
      'IRB',
      'Image',
      'Instrument',
      'Jupyter Notebook',
      'KML',
      'Literary Review',
      'Map',
      'Matlab Code',
      'Powerpoint',
      'Python Code',
      'README',
      'Referenced Data and Software',
      'Report',
      'Secondary Data Analysis',
      'Series',
      'Spreadsheet',
      'Team Photo',
      'Transcript',
      'Variables',
      'White Paper',
    ]),
  },
  {
    label: 'SimCenter Software',
    options: toOptions([
      'Simcenter QuoFEM',
      'SimCenter PBE Application',
      'SimCenter Regional Resilience Determination (R2D)',
      'SimCenter EE-UQ',
      'SimCenter WE-UQ Application',
      'SimCenter Hydro-UQ',
    ]),
  },
  {
    label: 'SimCenter Workflow',
    options: toOptions([
      'Exposure',
      'Hazard',
      'Damage',
      'Consequences',
      'Recovery',
    ]),
  },
];

const MODEL_CONFIG_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions(['Image', 'Model Drawing', 'Video']),
  },
  {
    label: 'Centrifuge',
    options: toOptions(
      [
        'Clay',
        'Flexible Shear Beam Container',
        'Gravel',
        'Hinged Plate Container',
        'Pit',
        'Rigid Container',
        'Sand',
        'Silt',
        'Soil Strength',
        'Structural Model',
        'Triaxial Test',
      ],
      'centrifuge'
    ),
  },
  {
    label: 'Shake Table',
    options: toOptions(
      [
        'Concrete',
        'Loading Protocol Ground Motions',
        'Loading Protocol Intensity',
        'Masonry',
        'Material Test',
        'Numerical Model',
        'Protective System Damping',
        'Protective System Isolation',
        'Protective System Rocking',
        'Soil',
        'Steel',
        'Structural Model',
        'Wood',
      ],
      'shaketable'
    ),
  },
  {
    label: 'Wind',
    options: toOptions(
      [
        'Bridge',
        'Building Low Rise',
        'Building Tail',
        'Chimney',
        'Mast',
        'Model Aeroelastic',
        'Model Full',
        'Model Rigid',
        'Model Section',
        'Scale Full',
        'Scale Small',
        'Scale Large',
        'Tower',
      ],
      'wind'
    ),
  },
  {
    label: 'Wave',
    options: toOptions(
      [
        'Board Displacement',
        'Directional Wave Basin',
        'Free Surface Height',
        'Hydrodynamic Conditions',
        'Large Wave Flume',
        'Wavemaker Input file',
      ],
      'wave'
    ),
  },
];

const EVENT_TAGS: DefaultOptionType[] = [
  { label: 'General', options: toOptions(['Data Units', 'Image', 'Video']) },
  {
    label: 'Centrifuge',
    options: toOptions(
      [
        'Actuator',
        'Bender Element Test',
        'Calibrated',
        'Cone Penetrometer',
        'Fast Data',
        'Raw Data',
        'Shaking',
        'Centrifuge Speed',
        'T-bar Test',
      ],
      'centrifuge'
    ),
  },
  { label: 'Shake Table', options: toOptions(['Shake Table Test']) },
  { label: 'Mobile Shaker', options: toOptions(['Field Notes', 'Load']) },
  {
    label: 'Wave',
    options: toOptions(
      [
        'Bathymetric Survey Data',
        'Channel Name',
        'Experimental Conditions',
        'Physical Units',
        'Raw',
      ],
      'wave'
    ),
  },
  {
    label: 'Wind',
    options: toOptions(
      [
        'Aerodynamic roughness',
        'Flow Boundary Layer',
        'Flow Gusting',
        'Flow Profile',
        'Flow Steady',
        'Flow Uniform',
        'Incident Flow',
        'Reynolds Number',
        'Reynolds Stress',
        'Scale Integral Length',
        'Terrain Open',
        'Terrain Urban',
        'Terrain Aerodynamic',
        'Test Complex Topography',
        'Test Destructive',
        'Test Dispersion',
        'Test Environmental',
        'Test External Pressure',
        'Test High Frequency Force Balance',
        'Test Internal Pressure',
        'Test Pedestrian Level Winds',
        'Turbulence Profile',
        'Turbulence Spectrum',
        'Velocity Mean',
        'Velocity Profile',
        'Wind Direction',
        'Wind Duration',
        'Wind Speed',
        'Wind Tunnel Open Circuit',
        'Wind Tunnel Open Jet',
        'Wind Tunnel closed Circuit',
        '3 Sec Gust',
      ],
      'wind'
    ),
  },
];

const SENSOR_TAGS: DefaultOptionType[] = [
  { label: 'General', options: toOptions(['Sensor Drawing', 'Sensor List']) },
  {
    label: 'Centrifuge',
    options: toOptions(
      [
        'Accelerometer',
        'Bender Element',
        'Linear Potentiometer',
        'Linear Variable Differential Transformer',
        'Load Cell',
        'Pore Pressure Transducer',
        'Sensor Calibration',
        'Strain Gauge',
        'Tactile Pressure',
      ],
      'centrifuge'
    ),
  },
  {
    label: 'Shake Table',
    options: toOptions(
      [
        'Accelerometer',
        'Displacement Sensor',
        'Load Cell',
        'Linear Potentiometer',
        'Soil Sensor',
        'Strain Gauge',
      ],
      'shaketable'
    ),
  },
  {
    label: 'Wind',
    options: toOptions(
      [
        'Accelerometer',
        'Component Velocity & Statistic Pressure Probes',
        'Inertial',
        'Particle Image Velocimetry',
        'Pilot Tube',
        'Pressure Scanner',
        'Laser',
        'Linear Variable differential Transformer',
        'Load Cells',
        'String Potentiometer',
        'Strain Gauge',
      ],
      'wind'
    ),
  },
  {
    label: 'Wave',
    options: toOptions(
      [
        'Absolute Timing',
        'Calibration Summary',
        'Instrument Survey',
        'Project Instrumentation Locations',
        'Sample Synchronization',
        'Self Calibrating',
        'Synchronization',
        'Wave Gauge Calibration',
        'Wiring Details',
      ],
      'wave'
    ),
  },
];

const EXPERIMENT_ANALYSIS_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions(['Graph', 'Visualization', 'Table', 'Script', 'README']),
  },
];

const EXPERIMENT_REPORT_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions(['README', 'Data Report']),
  },
];

const SIM_MODEL_TAGS: DefaultOptionType[] = [
  { label: 'General', options: toOptions(['Diagram', 'image']) },
];
const SIM_INPUT_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      'Boundary Condition',
      'Control Parameters',
      'Domain Parameters',
      'Mesh',
      'Inflow Conditions',
      'Material Properties',
      'Nodal Attributes',
      'Physical Domain',
      'Simulation Script',
    ]),
  },
];
const SIM_OUTPUT_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      'Acceleration',
      'Displacement',
      'Forces',
      'Pressure',
      'Recorder / Monitoring Station',
      'Strain',
      'Stress',
      'Elevation',
      'Velocity',
    ]),
  },
];

const SIM_ANALYSIS_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions(['Graph', 'README', 'Script', 'Table', 'Visualization']),
  },
];

const SIM_REPORT_TAGS = EXPERIMENT_REPORT_TAGS;

const HYBRID_SIM_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      'Assembly Document',
      'Connectivity File',
      'Drawings',
      'Load',
      'Photos',
      'Model Component',
      'Model Configuration',
      'Simulation Input',
      'Simulation Model',
      'Simulation Script',
      'Sensor Information',
    ]),
  },
];

const FR_SOCIAL_SCIENCE_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      'Audio',
      'Data Documentation',
      'Image',
      'Instrument',
      'Raw Data',
      'Report',
      'Transcript',
      'Variables',
    ]),
  },
];

const FR_PLANNING_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      'Consent Forms',
      'Data Management Plan',
      'IRB Application',
      'Letters of Support',
      'Planning Document',
      'Permits',
      'Protocol',
      'Quality Assurance Plan',
      'Report',
      'Reflexivity Report',
      'Team Training',
    ]),
  },
];

const FR_GEOSCIENCE_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      '3D Model',
      'Area',
      'Audio',
      'Building Code',
      'Coastal Observation',
      'Collapsed',
      'Cracked',
      'Data Processing Method',
      'Erosion',
      'Forensic Observation',
      'Ground Investigation',
      'Geotechnical Observation',
      'Image',
      'Lat Long',
      'Location',
      'Lidar',
      'Marker',
      'Note',
      'Point Cloud',
      'Questionnaire',
      'Report',
      'Route',
      'Sample Observation',
      'Scan',
      'Structural Observation',
      'Survey Observation',
      'Track',
      'Video',
      'Virtual Recon',
      'Wind Observation',
    ]),
  },
];

const FR_REPORT_TAGS: DefaultOptionType[] = [
  {
    label: 'General',
    options: toOptions([
      'README',
      'IRB',
      'Codebook',
      'Instrument',
      'Data Report',
      'Data Dictionary',
      'Virtual Reconnaissance',
      'Field Assessment',
      'Preliminary Virtual Assessment',
    ]),
  },
];

export const FILE_TAG_OPTIONS: Record<string, DefaultOptionType[]> = {
  //Other
  [constants.PROJECT]: OTHER_TAGS,
  // Experimental
  [constants.EXPERIMENT_MODEL_CONFIG]: MODEL_CONFIG_TAGS,
  [constants.EXPERIMENT_EVENT]: EVENT_TAGS,
  [constants.EXPERIMENT_SENSOR]: SENSOR_TAGS,
  [constants.EXPERIMENT_REPORT]: EXPERIMENT_REPORT_TAGS,
  [constants.EXPERIMENT_ANALYSIS]: EXPERIMENT_ANALYSIS_TAGS,

  //Simulation
  [constants.SIMULATION_ANALYSIS]: SIM_ANALYSIS_TAGS,
  [constants.SIMULATION_REPORT]: SIM_REPORT_TAGS,
  [constants.SIMULATION_MODEL]: SIM_MODEL_TAGS,
  [constants.SIMULATION_INPUT]: SIM_INPUT_TAGS,
  [constants.SIMULATION_OUTPUT]: SIM_OUTPUT_TAGS,

  //Hybrid Sim
  [constants.HYBRID_SIM_ANALYSIS]: HYBRID_SIM_TAGS,
  [constants.HYBRID_SIM_COORDINATOR]: HYBRID_SIM_TAGS,
  [constants.HYBRID_SIM_GLOBAL_MODEL]: HYBRID_SIM_TAGS,
  [constants.HYBRID_SIM_COORDINATOR_OUTPUT]: HYBRID_SIM_TAGS,
  [constants.HYBRID_SIM_EXP_SUBSTRUCTURE]: HYBRID_SIM_TAGS,
  [constants.HYBRID_SIM_SIM_SUBSTRUCTURE]: HYBRID_SIM_TAGS,
  [constants.HYBRID_SIM_EXP_OUTPUT]: HYBRID_SIM_TAGS,
  [constants.HYBRID_SIM_SIM_OUTPUT]: HYBRID_SIM_TAGS,

  //Field Recon
  [constants.FIELD_RECON_PLANNING]: FR_PLANNING_TAGS,
  [constants.FIELD_RECON_REPORT]: FR_REPORT_TAGS,
  [constants.FIELD_RECON_SOCIAL_SCIENCE]: FR_SOCIAL_SCIENCE_TAGS,
  [constants.FIELD_RECON_GEOSCIENCE]: FR_GEOSCIENCE_TAGS,
};
