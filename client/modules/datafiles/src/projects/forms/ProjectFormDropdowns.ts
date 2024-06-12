import { DefaultOptionType } from 'antd/es/select';
function toOptions(options: string[], key: string = '') {
  return options.map((o) => ({ label: o, value: o, key: o + key }));
}

export const nhTypeOptions = [
  { value: 'drought', label: 'Drought' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'extreme temperatures', label: 'Extreme Temperatures' },
  { value: 'fire', label: 'Wildfire' },
  { value: 'flood', label: 'Flood' },
  { value: 'hurricane/tropical storm', label: 'Hurricane/Tropical Storm' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'tornado', label: 'Tornado' },
  { value: 'tsunami', label: 'Tsunami' },
  { value: 'thunderstorm', label: 'Thunderstorm' },
  { value: 'storm surge', label: 'Storm Surge' },
  { value: 'pandemic', label: 'Pandemic' },
  { value: 'wind', label: 'Wind' },
];

export const frTypeOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'geosciences', label: 'Geosciences' },
  { value: 'public health', label: 'Public Health' },
  { value: 'social sciences', label: 'Social Sciences' },
  { value: 'interdisciplinary', label: 'Interdisciplinary' },
  { value: 'field experiment', label: 'Field Experiment' },
  { value: 'cross-sectional study', label: 'Cross-Sectional Study' },
  { value: 'longitudinal study', label: 'Longitudinal Study' },
  { value: 'reconnaissance', label: 'Reconnaissance' },
];

export const facilityOptions = [
  {
    value: 'rapid-uw',
    label:
      'RAPID - Natural Hazard and Disasters Reconnaissance Facility - University of Washington',
  },
  {
    value: 'converge-boulder',
    label:
      'CONVERGE - Social Science/Interdisciplinary Resources and Extreme Events Coordination - University of Colorado Boulder',
  },
  { value: 'geer', label: 'GEER - Geotechnical Extreme Event Reconnaissance' },
  {
    value: 'iseeer',
    label:
      'ISEEER - Interdisciplinary Science and Engineering Extreme Events Research',
  },
  { value: 'neer', label: 'NEER - Nearshore Extreme Event Reconnaissance' },
  {
    value: 'oseer',
    label: 'OSEER - Operations and Systems Engineering Extreme Events Research',
  },
  { value: 'pheer', label: 'PHEER - Public Health Extreme Events Research' },
  {
    value: 'summeer',
    label:
      'SUMMEER - Sustainable Material Management Extreme Events Reconnaissance',
  },
  { value: 'sseer', label: 'SSEER - Social Science Extreme Events Research' },
  {
    value: 'steer',
    label: 'StEER - Structural Engineering Extreme Event Reconnaissance',
  },
  {
    value: 'ohhwrl-oregon',
    label:
      'Large Wave Flume and Directional Wave Basin - Oregon State University',
  },
  {
    value: 'eqss-utaustin',
    label: 'Mobile Field Shakers - University of Texas at Austin',
  },
  {
    value: 'cgm-ucdavis',
    label: 'Center for Geotechnical Modeling - University of California, Davis',
  },
  {
    value: 'lhpost-sandiego',
    label:
      'Six Degree of Freedom Large High-Performance Outdoor Shake Table (LHPOST6) - University of California, San Diego',
  },
  {
    value: 'wwhr-florida',
    label: 'Wall of Wind - Florida International University',
  },
  {
    value: 'niche',
    label:
      'National Full-Scale Testing Infrastructure for Community Hardening in Extreme Wind, Surge, and Wave Events (NICHE)',
  },
  {
    value: 'pfsml-florida',
    label: 'Boundary Layer Wind Tunnel - University of Florida',
  },
  {
    value: 'rtmd-lehigh',
    label:
      'Real-Time Multi-Directional (RTMD) Experimental Facility with Large-Scale Hybrid Simulation Testing Capabilities - LeHigh University',
  },
  { value: 'simcntr', label: 'SimCenter' },
  {
    value: 'nco-purdue',
    label: 'Network Coordination Office - Purdue University',
  },
  {
    value: 'crbcrp',
    label: 'Center for Risk-Based Community Resilience Planning',
  },
  { value: 'uc-berkeley', label: 'UC Berkeley' },
  { value: 'ut-austin', label: 'University of Texas at Austin' },
  {
    value: 'oh-hinsdale-osu',
    label: 'O.H. Hinsdale Wave Research Laboratory, Oregon State University',
  },
  {
    value: 'seel-ucla',
    label:
      'University of California, Los Angeles, Structural/Earthquake Engineering Laboratory',
  },
];

export const dataTypeOptions = [
  { value: 'archival materials', label: 'Archival Materials' },
  { value: 'audio', label: 'Audio' },
  { value: 'benchmark dataset', label: 'Benchmark Dataset' },
  { value: 'check sheet', label: 'Check Sheet' },
  { value: 'code', label: 'Code' },
  { value: 'database', label: 'Database' },
  { value: 'dataset', label: 'Dataset' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'image', label: 'Image' },
  { value: 'interdisciplinary', label: 'Interdisciplinary' },
  { value: 'jupyter notebook', label: 'Jupyter Notebook' },
  { value: 'learning object', label: 'Learning Object' },
  { value: 'model', label: 'Model' },
  { value: 'paper', label: 'Paper' },
  { value: 'proceeding', label: 'Proceeding' },
  { value: 'poster', label: 'Poster' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'report', label: 'Report' },
  {
    value: 'research experience for undergraduates',
    label: 'Research Experience for Undergraduates',
  },
  { value: 'simcenter testbed', label: 'SimCenter Testbed' },
  { value: 'social sciences', label: 'Social Sciences' },
  { value: 'survey instrument', label: 'Survey Instrument' },
  { value: 'testbed', label: 'Testbed' },
  { value: 'video', label: 'Video' },
];

export const equipmentOptions: DefaultOptionType[] = [
  {
    label: 'IT/Electronics',
    options: toOptions([
      'iPad Pro 10.5 | 256 GB, WiFi+Cellular ',
      'iPad Rugged Case w/Keyboard | ZAGG Rugged Messenger',
      'iPAD accessories | Tripod, HD Microphone, External battery, Apple Pencil',
      'Flash Drive | For backing up iPad (SanDisk Wireless Stick 256GB)',
      'External Hard Drive | 2 TB Drive for drone footage, protective bumpers, integrated microSD, USB-C',
      'Custom Processing Desktop PC | 3.3 GHz i9-7900X, 128GB DDR4 RAM, Nvidia GeForce RTX 2080 Ti',
      'Processing Laptop | 2.9GHz Intel i9-8950HK, 64GB DDR4 RAM, NVIDIA GeForce RTX 2070',
    ]),
  },
  {
    label: 'Terrestrial Laser Scanning',
    options: toOptions([
      'Short Range Scanner | Leica BLK360',
      'Medium Range Scanner | Leica RTC360 ',
      'Medium Range Scanner | Leica Scanstation P50',
      'Long Range Scanner | Maptek I-Site XR3',
      'Long Range Scanner | Maptek I-Site LR3',
    ]),
  },
  {
    label: 'Survey',
    options: toOptions([
      'Robotic Total Station | Leica Nova TS16I instrument package',
      'Survey (Digital level) | Leica LS15 digital level package',
      'Survey (GNSS receiver) | Leica GS18T SmartAntenna package',
      'Thermometer/Digital Compass/Barometer/Humidity Sensor | Kestrel Meter 5500 Weather Meter',
    ]),
  },
  {
    label: 'Unmanned Aerial Systems',
    options: toOptions([
      'Small Portable (backpack-size) Drone | DJI Mavic Pro',
      'Small Portable (backpack-size) Drone | DJI Mavic Pro 2',
      'Small to Medium-Sized Drone | DJI Phantom 4 Pro+ ',
      'Small to Medium-Sized Drone | DJI Phantom 4 Pro+ RTK ',
      'Medium Size Drone | DJI Inspire2',
      'Mid-grade Industral Weather Resistant Drone | DJI Matrice 210 ',
      'High-end Industrial Weather Resistant Drone | DJI Matrice 210 RTK',
      'Large Fixed Wing Drone | Sense fly Ebee with RTK and base station',
      'Kite Balloon with Tether | SkyShot Hybrid HeliKite (already purchased)',
      'High-end Drone with UAS LiDAR System | DJI M600 drone with Phoenix Aerial Mini Ranger LiDAR system',
      'Drone Imaging systems (compatible with all Matrice platforms) | Zenmuse X4S, X5S, and X30 (zoom) camera. MicaSense Altum Multispectral Sensor.',
    ]),
  },
  {
    label: 'Imaging',
    options: toOptions([
      'Digital SLR Camera | Canon 7D Mark II, with narrow and wide angle lenses',
      'Robotic Camera Mount | GigaPan Epic Pro V (for DSLR) and Tripod',
      '360 Degree Camera | Insta360 One for Apple Products',
      'Car Camera System | Applied Streetview 360 degree panorama GPS camera system',
      'Car Camera System | NCTech iSTAR Pulsar+ (streetview) 360 degree Panorama GPS Camera system',
      'Thermal Camera | Flir One Pro',
    ]),
  },
  {
    label: '3D Visualization',
    options: toOptions([
      'Computer Automated Virtual Environment (CAVE) System | at RAPID Facility Headquarters ONLY. B363D TV, TV stand, computer, tracking camera and accessories. ',
    ]),
  },
  {
    label: 'Site Characterization',
    options: toOptions([
      'Seismometers | Nanometrics triaxial, 20s, Trillium seismometer with Centaur digital recorder',
      'Multichannel Analysis of Surface Waves (MASW) System | ATOM wireless seismic system, 24-channel system with GPS and WiFi',
    ]),
  },
  {
    label: 'Structural',
    options: toOptions([
      'Accelerograph system | Nanometrics standalone accelerographs with batteries, cases, and data loggers',
    ]),
  },
  {
    label: 'Ground Investigation',
    options: toOptions([
      'Hand Operated Dynamic Cone Penetrometer (DCP) System | SmartDCP digital recording system and hand operated DCP',
      "Lightweight, Portable DCP | Sol'Solution Panda DCP",
      'Pocket Penetrometer | Geotester pocket penetrometer',
      'Schmidt Hammer | Digi-Schmidt 2000, digital measuring system',
      'Basic Soil Sampling Kit | AMS 3-1/4-inch basic soil sampling kit, hand augers and samplers',
    ]),
  },
  {
    label: 'Coastal',
    options: toOptions([
      'Remote-Operated Hydrographic Survey Boat | Z-boat 1800 with single beam echo sounder',
      'Acousitc Beacons | ULB 350/37 underwater acoustic beacon',
      'Beacon Locator - Diver Operated Pinger Receiver System | DPR-275 Diver Pinger Receiver',
      'Water Level Data Logger | TruBlue 255',
      'Acoustic Doppler Velocimeter | AquaDopp profiler with 90deg angle head',
      'Grab Sampler | Petite Ponar 6"x6" w/ 50 ft of rope',
    ]),
  },
  {
    label: 'Social',
    options: toOptions([
      'EEG Headset | Emotiv 14-channel headset',
      'EEG Headset | Emotiv 5-channel headset',
      'Pen and Paper',
    ]),
  },
  {
    label: 'Support',
    options: toOptions([
      'Smaller Battery | Goal Zero Yeti 150',
      'High Capacity Battery | Goal Zero Yeti 400',
      'Safety Vest | Custom NHERI Rapid safety vests with iPad pocket',
      'Safety Helmet | Rock climbing helmet',
      'Power Inverters | 300W DC 12V to 110V car outlet',
      'Walkie Talkies (pair) | Waterproof, weather proof, long range',
      'RAPP Pack | Swiss Gear ScanSmart backpack w/Plumb Bob, Measuring tape, Digital Caliper, Safety Glasses, Hand level, Pocket Rod, First Aid Kit, Weld Gauge, Crack Gauge, Range Finder,',
    ]),
  },
];

export const observationTypeOptions = [
  { value: 'wind', label: 'Wind' },
  { value: 'structural', label: 'Structural' },
  { value: 'storm surge / coastal', label: 'Storm Surge / Coastal' },
  { value: 'social science', label: 'Social Science' },
  { value: 'geotechnical', label: 'Geotechnical' },
  { value: 'field sensors', label: 'Field Sensors' },
  { value: 'coastal', label: 'Coastal' },
];

export const experimentEquipmentTypeOptions: Record<
  string,
  DefaultOptionType[]
> = {
  'rtmd-lehigh': [
    { value: 'hybrid_simulation', label: 'Hybrid Simulation' },
    {
      value: 'lsrthcshas',
      label:
        'Large-Scale, Real-Time/Hybrid Capable Servo-Hydraulic Actuator System',
    },
    {
      value: 'ssrthcshas',
      label:
        'Small-Scale, Real-Time/Hybrid Capable Servo-Hydraulic Actuator System ',
    },
    { value: 'rssb', label: 'Reduced-Scale Soil Box' },
    { value: 'ssihb', label: 'Soil-Structure Interaction Hybrid Simulation' },
  ],
  'cgm-ucdavis': [
    {
      value: '9-m_radius_dynamic_geotechnical_centrifuge',
      label: '9m Radius Dynamic Geotechnical Centrifuge',
    },
    {
      value: '1-m_radius_dynamic_geotechnical_centrifuge',
      label: '1m Radius Dynamic Geotechnical Centrifuge',
    },
  ],
  'eqss-utaustin': [
    {
      value: 'liquidator',
      label: 'Low Frequency, Two Axis Shaker (Liquidator)',
    },
    { value: 't-rex', label: 'High Force Three Axis Shaker (T Rex)' },
    {
      value: 'tractor-t-rex',
      label: 'Tractor-Trailer Rig, Big Rig, with T-Rex',
    },
    { value: 'raptor', label: 'Single Axis Vertical Shaker (Raptor)' },
    { value: 'rattler', label: 'Single Axis Horizontal Shaker (Rattler)' },
    { value: 'thumper', label: 'Urban, Three axis Shaker (Thumper)' },
  ],
  'pfsml-florida': [
    { value: 'blwt', label: 'Boundary Layer Wind Tunnel (BLWT)' },
    {
      value: 'abl',
      label: 'Atmospheric Boundary Layer Wind Tunnel Test (ABL)',
    },
    { value: 'wdrt', label: 'Wind Driven Rain Test' },
    { value: 'wtdt', label: 'Wind Tunnel Destructive Test' },
    { value: 'dfs', label: 'Dynamic Flow Simulator (DFS)' },
    { value: 'hapla', label: 'High Airflow Pressure Loading Actuator (HAPLA)' },
    { value: 'spla', label: 'Spatiotemporal Pressure Loading Actuator (SPLA)' },
  ],
  'wwhr-florida': [
    { value: 'pmtp', label: 'Physical Measurement Test Protocol' },
    { value: 'fmtp', label: 'Failure Mode Test Protocol' },
    { value: 'wdrtp', label: 'Wind Driven Rain Test Protocol' },
  ],
  'lhpost-sandiego': [
    {
      value: 'lhpost',
      label: 'Large High Performance Outdoor Shake Table (LHPOST)',
    },
  ],
  'ohhwrl-oregon': [
    { value: 'lwf', label: 'Large Wave Flume (LWF)' },
    { value: 'dwb', label: 'Directional Wave Basin (DWB)' },
    { value: 'mobs', label: 'Mobile Shaker' },
    { value: 'pla', label: 'Pressure Loading Actuator' },
  ],
  other: [],
};
export const experimentTypeOptions: Record<string, DefaultOptionType[]> = {
  'rtmd-lehigh': [
    { value: 'hybrid_simulation', label: 'Hybrid Simulation' },
    { value: 'large', label: 'Large-Scale' },
    { value: 'small', label: 'Small-Scale' },
    { value: 'char', label: 'Characterization' },
    { value: 'qstatic', label: 'Quasi-Static' },
    { value: 'dynamic', label: 'Dynamic' },
    { value: 'ssi', label: 'Soil-Structure Interaction' },
  ],
  'cgm-ucdavis': [{ value: 'centrifuge', label: 'Centrifuge' }],
  'eqss-utaustin': [{ value: 'mobile_shaker', label: 'Mobile Shaker' }],
  'pfsml-florida': [{ value: 'wind', label: 'Wind' }],
  'wwhr-florida': [{ value: 'wind', label: 'Wind' }],
  'lhpost-sandiego': [{ value: 'shake', label: 'Shake' }],
  'ohhwrl-oregon': [{ value: 'wave', label: 'Wave' }],
  other: [],
};

export const simulationTypeOptions = [
  { value: 'Geotechnical', label: 'Geotechnical' },
  { value: 'Structural', label: 'Structural' },
  { value: 'Soil Structure System', label: 'Soil Structure System' },
  { value: 'Storm Surge', label: 'Storm Surge' },
  { value: 'Wind', label: 'Wind' },
];

export const HybridSimTypeOptions = [
  { value: 'Earthquake', label: 'Earthquake' },
  { value: 'Wind', label: 'Wind' },
];
