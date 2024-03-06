# pylint: disable=line-too-long
"""Mapping of possible metadata names."""

PROJECT = "designsafe.project"
PROJECT_GRAPH = "designsafe.project.graph"
# Experimental
EXPERIMENT = "designsafe.project.experiment"
EXPERIMENT_REPORT = "designsafe.project.report"
EXPERIMENT_ANALYSIS = "designsafe.project.analysis"
EXPERIMENT_MODEL_CONFIG = "designsafe.project.model_config"
EXPERIMENT_SENSOR = "designsafe.project.sensor_list"
EXPERIMENT_EVENT = "designsafe.project.event"
# Simulation
SIMULATION = "designsafe.project.simulation"
SIMULATION_REPORT = "designsafe.project.simulation.report"
SIMULATION_ANALYSIS = "designsafe.project.simulation.analysis"
SIMULATION_MODEL = "designsafe.project.simulation.model"
SIMULATION_INPUT = "designsafe.project.simulation.input"
SIMULATION_OUTPUT = "designsafe.project.simulation.output"
# Field Research
FIELD_RECON_MISSION = "designsafe.project.field_recon.mission"
FIELD_RECON_REPORT = "designsafe.project.field_recon.report"
FIELD_RECON_COLLECTION = "designsafe.project.field_recon.collection"
FIELD_RECON_SOCIAL_SCIENCE = "designsafe.project.field_recon.social_science"
FIELD_RECON_PLANNING = "designsafe.project.field_recon.planning"
FIELD_RECON_GEOSCIENCE = "designsafe.project.field_recon.geoscience"
# Hybrid Sim
HYBRID_SIM = "designsafe.project.hybrid_simulation"
HYBRID_SIM_GLOBAL_MODEL = "designsafe.project.hybrid_simulation.global_model"
HYBRID_SIM_COORDINATOR = "designsafe.project.hybrid_simulation.coordinator"
HYBRID_SIM_SIM_SUBSTRUCTURE = "designsafe.project.hybrid_simulation.sim_substructure"
HYBRID_SIM_EXP_SUBSTRUCTURE = "designsafe.project.hybrid_simulation.exp_substructure"
HYBRID_SIM_COORDINATOR_OUTPUT = (
    "designsafe.project.hybrid_simulation.coordinator_output"
)
HYBRID_SIM_SIM_OUTPUT = "designsafe.project.hybrid_simulation.sim_output"
HYBRID_SIM_EXP_OUTPUT = "designsafe.project.hybrid_simulation.exp_output"
HYBRID_SIM_ANALYSIS = "designsafe.project.hybrid_simulation.analysis"
HYBRID_SIM_REPORT = "designsafe.project.hybrid_simulation.report"

FACILITY_OPTIONS = [
    {
        "id": "rapid-uw",
        "name": (
            "RAPID - Natural Hazard and Disasters Reconnaissance Facility "
            "- University of Washington"
        ),
    },
    {
        "id": "converge-boulder",
        "name": (
            "CONVERGE - Social Science/Interdisciplinary Resources and Extreme "
            "Events Coordination - University of Colorado Boulder"
        ),
    },
    {"id": "geer", "name": "GEER - Geotechnical Extreme Event Reconnaissance"},
    {
        "id": "iseeer",
        "name": "ISEEER - Interdisciplinary Science and Engineering Extreme Events Research",
    },
    {"id": "neer", "name": "NEER - Nearshore Extreme Event Reconnaissance"},
    {
        "id": "oseer",
        "name": "OSEER - Operations and Systems Engineering Extreme Events Research",
    },
    {"id": "pheer", "name": "PHEER - Public Health Extreme Events Research"},
    {
        "id": "summeer",
        "name": "SUMMEER - Sustainable Material Management Extreme Events Reconnaissance",
    },
    {"id": "sseer", "name": "SSEER - Social Science Extreme Events Research"},
    {
        "id": "steer",
        "name": "StEER - Structural Engineering Extreme Event Reconnaissance",
    },
    {
        "id": "ohhwrl-oregon",
        "name": "Large Wave Flume and Directional Wave Basin - Oregon State University",
    },
    {
        "id": "eqss-utaustin",
        "name": "Mobile Field Shakers - University of Texas at Austin",
    },
    {
        "id": "cgm-ucdavis",
        "name": "Center for Geotechnical Modeling - University of California, Davis",
    },
    {"id": "cgm-ucdavis", "name": "Center for Geotechnical Modeling, UC Davis"},
    {
        "id": "lhpost-sandiego",
        "name": (
            "Six Degree of Freedom Large High-Performance Outdoor Shake Table "
            "(LHPOST6) - University of California, San Diego"
        ),
    },
    {"id": "wwhr-florida", "name": "Wall of Wind - Florida International University"},
    {
        "id": "niche",
        "name": (
            (
                "National Full-Scale Testing Infrastructure for Community Hardening "
                "in Extreme Wind, Surge, and Wave Events (NICHE)"
            )
        ),
    },
    {
        "id": "pfsml-florida",
        "name": "Boundary Layer Wind Tunnel - University of Florida",
    },
    {
        "id": "rtmd-lehigh",
        "name": (
            "Real-Time Multi-Directional (RTMD) Experimental Facility with "
            "Large-Scale Hybrid Simulation Testing Capabilities - LeHigh University"
        ),
    },
    {"id": "simcntr", "name": "SimCenter"},
    {"id": "nco-purdue", "name": "Network Coordination Office - Purdue University"},
    {"id": "crbcrp", "name": "Center for Risk-Based Community Resilience Planning"},
    {"id": "uc-berkeley", "name": "UC Berkeley"},
    {"id": "ut-austin", "name": "University of Texas at Austin"},
    {
        "id": "oh-hinsdale-osu",
        "name": "O.H. Hinsdale Wave Research Laboratory, Oregon State University",
    },
    {
        "id": "seel-ucla",
        "name": (
            "University of California, Los Angeles, "
            "Structural/Earthquake Engineering Laboratory"
        ),
    },
]

EQUIPMENT_TYPES = equipment_types = {
    "rtmd-lehigh": [
        {"id": "hybrid_simulation", "name": "Hybrid Simulation"},
        {
            "id": "lsrthcshas",
            "name": "Large-Scale, Real-Time/Hybrid Capable Servo-Hydraulic Actuator System",
        },
        {
            "id": "ssrthcshas",
            "name": "Small-Scale, Real-Time/Hybrid Capable Servo-Hydraulic Actuator System ",
        },
        {"id": "rssb", "name": "Reduced-Scale Soil Box"},
        {"id": "ssihb", "name": "Soil-Structure Interaction Hybrid Simulation"},
        {"id": "other", "name": "Other"},
    ],
    "cgm-ucdavis": [
        {
            "id": "9-m_radius_dynamic_geotechnical_centrifuge",
            "name": "9m Radius Dynamic Geotechnical Centrifuge",
        },
        {
            "id": "1-m_radius_dynamic_geotechnical_centrifuge",
            "name": "1m Radius Dynamic Geotechnical Centrifuge",
        },
        {"id": "other", "name": "Other"},
    ],
    "eqss-utaustin": [
        {
            "id": "liquidator",
            "name": "Low Frequency, Two Axis Shaker (Liquidator)",
        },
        {"id": "t-rex", "name": "High Force Three Axis Shaker (T Rex)"},
        {
            "id": "tractor-t-rex",
            "name": "Tractor-Trailer Rig, Big Rig, with T-Rex",
        },
        {"id": "raptor", "name": "Single Axis Vertical Shaker (Raptor)"},
        {"id": "rattler", "name": "Single Axis Horizontal Shaker (Rattler)"},
        {"id": "thumper", "name": "Urban, Three axis Shaker (Thumper)"},
        {"id": "other", "name": "Other"},
    ],
    "pfsml-florida": [
        {"id": "blwt", "name": "Boundary Layer Wind Tunnel (BLWT)"},
        {
            "id": "abl",
            "name": "Atmospheric Boundary Layer Wind Tunnel Test (ABL)",
        },
        {"id": "wdrt", "name": "Wind Driven Rain Test"},
        {"id": "wtdt", "name": "Wind Tunnel Destructive Test"},
        {"id": "dfs", "name": "Dynamic Flow Simulator (DFS)"},
        {
            "id": "hapla",
            "name": "High Airflow Pressure Loading Actuator (HAPLA)",
        },
        {
            "id": "spla",
            "name": "Spatiotemporal Pressure Loading Actuator (SPLA)",
        },
        {"id": "other", "name": "Other"},
    ],
    "wwhr-florida": [
        {"id": "pmtp", "name": "Physical Measurement Test Protocol"},
        {"id": "fmtp", "name": "Failure Mode Test Protocol"},
        {"id": "wdrtp", "name": "Wind Driven Rain Test Protocol"},
        {"id": "other", "name": "Other"},
    ],
    "lhpost-sandiego": [
        {
            "id": "lhpost",
            "name": "Large High Performance Outdoor Shake Table (LHPOST)",
        },
        {"id": "other", "name": "Other"},
    ],
    "ohhwrl-oregon": [
        {"id": "lwf", "name": "Large Wave Flume (LWF)"},
        {"id": "dwb", "name": "Directional Wave Basin (DWB)"},
        {"id": "mobs", "name": "Mobile Shaker"},
        {"id": "pla", "name": "Pressure Loading Actuator"},
        {"id": "other", "name": "Other"},
    ],
    "other": [{"id": "other", "name": "Other"}],
}


EXPERIMENT_TYPES = {
    "rtmd-lehigh": [
        {"id": "hybrid_simulation", "name": "Hybrid Simulation"},
        {"id": "large", "name": "Large-Scale"},
        {"id": "small", "name": "Small-Scale"},
        {"id": "char", "name": "Characterization"},
        {"id": "qstatic", "name": "Quasi-Static"},
        {"id": "dynamic", "name": "Dynamic"},
        {"id": "ssi", "name": "Soil-Structure Interaction"},
        {"id": "other", "name": "Other"},
    ],
    "cgm-ucdavis": [
        {"id": "centrifuge", "name": "Centrifuge"},
        {"id": "other", "name": "Other"},
    ],
    "eqss-utaustin": [
        {"id": "mobile_shaker", "name": "Mobile Shaker"},
        {"id": "other", "name": "Other"},
    ],
    "pfsml-florida": [
        {"id": "wind", "name": "Wind"},
        {"id": "other", "name": "Other"},
    ],
    "wwhr-florida": [
        {"id": "wind", "name": "Wind"},
        {"id": "other", "name": "Other"},
    ],
    "lhpost-sandiego": [
        {"id": "shake", "name": "Shake"},
        {"id": "other", "name": "Other"},
    ],
    "ohhwrl-oregon": [
        {"id": "wave", "name": "Wave"},
        {"id": "other", "name": "Other"},
    ],
    "other": [{"id": "other", "name": "Other"}],
}

NATURAL_HAZARD_TYPES = [
    {"id": "drought", "name": "Drought"},
    {"id": "earthquake", "name": "Earthquake"},
    {"id": "extreme temperatures", "name": "Extreme Temperatures"},
    {"id": "fire", "name": "Wildfire"},
    {"id": "flood", "name": "Flood"},
    {"id": "hurricane/tropical storm", "name": "Hurricane/Tropical Storm"},
    {"id": "landslide", "name": "Landslide"},
    {"id": "tornado", "name": "Tornado"},
    {"id": "tsunami", "name": "Tsunami"},
    {"id": "thunderstorm", "name": "Thunderstorm"},
    {"id": "storm surge", "name": "Storm Surge"},
    {"id": "pandemic", "name": "Pandemic"},
    {"id": "wind", "name": "Wind"},
    {"id": "fire", "name": "Fire"},
    {"id": "hurricane/tropical storm", "name": "Hurricane"},
    {"id": "hurricane/tropical storm", "name": "Tropical Storm"},
]

FIELD_RESEARCH_TYPES = [
    {"id": "engineering", "name": "Engineering"},
    {"id": "geosciences", "name": "Geosciences"},
    {"id": "public health", "name": "Public Health"},
    {"id": "social sciences", "name": "Social Sciences"},
    {"id": "interdisciplinary", "name": "Interdisciplinary"},
    {"id": "field experiment", "name": "Field Experiment"},
    {"id": "cross-sectional study", "name": "Cross-Sectional Study"},
    {"id": "longitudinal study", "name": "Longitudinal Study"},
    {"id": "reconnaissance", "name": "Reconnaissance"},
    {"id": "other", "name": "Other"},
]

OTHER_DATA_TYPES = [
    {"id": "archival materials", "name": "Archival Materials"},
    {"id": "audio", "name": "Audio"},
    {"id": "benchmark dataset", "name": "Benchmark Dataset"},
    {"id": "check sheet", "name": "Check Sheet"},
    {"id": "code", "name": "Code"},
    {"id": "database", "name": "Database"},
    {"id": "dataset", "name": "Dataset"},
    {"id": "engineering", "name": "Engineering"},
    {"id": "image", "name": "Image"},
    {"id": "interdisciplinary", "name": "Interdisciplinary"},
    {"id": "jupyter notebook", "name": "Jupyter Notebook"},
    {"id": "learning object", "name": "Learning Object"},
    {"id": "model", "name": "Model"},
    {"id": "paper", "name": "Paper"},
    {"id": "proceeding", "name": "Proceeding"},
    {"id": "poster", "name": "Poster"},
    {"id": "presentation", "name": "Presentation"},
    {"id": "report", "name": "Report"},
    {
        "id": "research experience for undergraduates",
        "name": "Research Experience for Undergraduates",
    },
    {"id": "simcenter testbed", "name": "SimCenter Testbed"},
    {"id": "social sciences", "name": "Social Sciences"},
    {"id": "survey instrument", "name": "Survey Instrument"},
    {"id": "testbed", "name": "Testbed"},
    {"id": "video", "name": "Video"},
]

SIMULATION_TYPES = [
    {"id": "Geotechnical", "name": "Geotechnical"},
    {"id": "Structural", "name": "Structural"},
    {"id": "Soil Structure System", "name": "Soil Structure System"},
    {"id": "Storm Surge", "name": "Storm Surge"},
    {"id": "Wind", "name": "Wind"},
    {"id": "Other", "name": "Other"},
]

HYBRID_SIM_TYPES = [
    {"id": "Earthquake", "name": "Earthquake"},
    {"id": "Wind", "name": "Wind"},
    {"id": "Other", "name": "Other"},
]


FR_EQUIPMENT_TYPES = {
    "General": [{"id": "none", "name": "None"}, {"id": "other", "name": "Other"}],
    "IT/Electronics": [
        {
            "id": "ipad pro 10.5 | 256 gb, wifi+cellular ",
            "name": "iPad Pro 10.5 | 256 GB, WiFi+Cellular ",
        },
        {
            "id": "ipad rugged case w/keyboard | zagg rugged messenger",
            "name": "iPad Rugged Case w/Keyboard | ZAGG Rugged Messenger",
        },
        {
            "id": "ipad accessories | tripod, hd microphone, external battery, apple pencil",
            "name": "iPAD accessories | Tripod, HD Microphone, External battery, Apple Pencil",
        },
        {
            "id": "flash drive | for backing up ipad (sandisk wireless stick 256gb)",
            "name": "Flash Drive | For backing up iPad (SanDisk Wireless Stick 256GB)",
        },
        {
            "id": "external hard drive | 2 tb drive for drone footage, protective bumpers, integrated microsd, usb-c",
            "name": "External Hard Drive | 2 TB Drive for drone footage, protective bumpers, integrated microSD, USB-C",
        },
        {
            "id": "custom processing desktop pc | 3.3 ghz i9-7900x, 128gb ddr4 ram, nvidia geforce rtx 2080 ti",
            "name": "Custom Processing Desktop PC | 3.3 GHz i9-7900X, 128GB DDR4 RAM, Nvidia GeForce RTX 2080 Ti",
        },
        {
            "id": "processing laptop | 2.9ghz intel i9-8950hk, 64gb ddr4 ram, nvidia geforce rtx 2070",
            "name": "Processing Laptop | 2.9GHz Intel i9-8950HK, 64GB DDR4 RAM, NVIDIA GeForce RTX 2070",
        },
    ],
    "Terrestrial Laser Scanning": [
        {
            "id": "short range scanner | leica blk360",
            "name": "Short Range Scanner | Leica BLK360",
        },
        {
            "id": "medium range scanner | leica rtc360 ",
            "name": "Medium Range Scanner | Leica RTC360 ",
        },
        {
            "id": "medium range scanner | leica scanstation p50",
            "name": "Medium Range Scanner | Leica Scanstation P50",
        },
        {
            "id": "long range scanner | maptek i-site xr3",
            "name": "Long Range Scanner | Maptek I-Site XR3",
        },
        {
            "id": "long range scanner | maptek i-site lr3",
            "name": "Long Range Scanner | Maptek I-Site LR3",
        },
    ],
    "Survey": [
        {
            "id": "robotic total station | leica nova ts16i instrument package",
            "name": "Robotic Total Station | Leica Nova TS16I instrument package",
        },
        {
            "id": "survey (digital level) | leica ls15 digital level package",
            "name": "Survey (Digital level) | Leica LS15 digital level package",
        },
        {
            "id": "survey (gnss receiver) | leica gs18t smartantenna package",
            "name": "Survey (GNSS receiver) | Leica GS18T SmartAntenna package",
        },
        {
            "id": "thermometer/digital compass/barometer/humidity sensor | kestrel meter 5500 weather meter",
            "name": "Thermometer/Digital Compass/Barometer/Humidity Sensor | Kestrel Meter 5500 Weather Meter",
        },
    ],
    "Unmanned Aerial Systems": [
        {
            "id": "small portable (backpack-size) drone | dji mavic pro",
            "name": "Small Portable (backpack-size) Drone | DJI Mavic Pro",
        },
        {
            "id": "small portable (backpack-size) drone | dji mavic pro 2",
            "name": "Small Portable (backpack-size) Drone | DJI Mavic Pro 2",
        },
        {
            "id": "small to medium-sized drone | dji phantom 4 pro+ ",
            "name": "Small to Medium-Sized Drone | DJI Phantom 4 Pro+ ",
        },
        {
            "id": "small to medium-sized drone | dji phantom 4 pro+ rtk ",
            "name": "Small to Medium-Sized Drone | DJI Phantom 4 Pro+ RTK ",
        },
        {
            "id": "medium size drone | dji inspire2",
            "name": "Medium Size Drone | DJI Inspire2",
        },
        {
            "id": "mid-grade industral weather resistant drone | dji matrice 210 ",
            "name": "Mid-grade Industral Weather Resistant Drone | DJI Matrice 210 ",
        },
        {
            "id": "high-end industrial weather resistant drone | dji matrice 210 rtk",
            "name": "High-end Industrial Weather Resistant Drone | DJI Matrice 210 RTK",
        },
        {
            "id": "large fixed wing drone | sense fly ebee with rtk and base station",
            "name": "Large Fixed Wing Drone | Sense fly Ebee with RTK and base station",
        },
        {
            "id": "kite balloon with tether | skyshot hybrid helikite (already purchased)",
            "name": "Kite Balloon with Tether | SkyShot Hybrid HeliKite (already purchased)",
        },
        {
            "id": "high-end drone with uas lidar system | dji m600 drone with phoenix aerial mini ranger lidar system",
            "name": "High-end Drone with UAS LiDAR System | DJI M600 drone with Phoenix Aerial Mini Ranger LiDAR system",
        },
        {
            "id": "drone imaging systems (compatible with all matrice platforms) | zenmuse x4s, x5s, and x30 (zoom) camera. micasense altum multispectral sensor.",
            "name": "Drone Imaging systems (compatible with all Matrice platforms) | Zenmuse X4S, X5S, and X30 (zoom) camera. MicaSense Altum Multispectral Sensor.",
        },
    ],
    "Imaging": [
        {
            "id": "digital slr camera | canon 7d mark ii, with narrow and wide angle lenses",
            "name": "Digital SLR Camera | Canon 7D Mark II, with narrow and wide angle lenses",
        },
        {
            "id": "robotic camera mount | gigapan epic pro v (for dslr) and tripod",
            "name": "Robotic Camera Mount | GigaPan Epic Pro V (for DSLR) and Tripod",
        },
        {
            "id": "360 degree camera | insta360 one for apple products",
            "name": "360 Degree Camera | Insta360 One for Apple Products",
        },
        {
            "id": "car camera system | applied streetview 360 degree panorama gps camera system",
            "name": "Car Camera System | Applied Streetview 360 degree panorama GPS camera system",
        },
        {
            "id": "car camera system | nctech istar pulsar+ (streetview) 360 degree panorama gps camera system",
            "name": "Car Camera System | NCTech iSTAR Pulsar+ (streetview) 360 degree Panorama GPS Camera system",
        },
        {
            "id": "thermal camera | flir one pro",
            "name": "Thermal Camera | Flir One Pro",
        },
    ],
    "3D Visualization": [
        {
            "id": "computer automated virtual environment (cave) system | at rapid facility headquarters only. b363d tv, tv stand, computer, tracking camera and accessories. ",
            "name": "Computer Automated Virtual Environment (CAVE) System | at RAPID Facility Headquarters ONLY. B363D TV, TV stand, computer, tracking camera and accessories. ",
        }
    ],
    "Site Characterization": [
        {
            "id": "seismometers | nanometrics triaxial, 20s, trillium seismometer with centaur digital recorder",
            "name": "Seismometers | Nanometrics triaxial, 20s, Trillium seismometer with Centaur digital recorder",
        },
        {
            "id": "multichannel analysis of surface waves (masw) system | atom wireless seismic system, 24-channel system with gps and wifi",
            "name": "Multichannel Analysis of Surface Waves (MASW) System | ATOM wireless seismic system, 24-channel system with GPS and WiFi",
        },
    ],
    "Structural": [
        {
            "id": "accelerograph system | nanometrics standalone accelerographs with batteries, cases, and data loggers",
            "name": "Accelerograph system | Nanometrics standalone accelerographs with batteries, cases, and data loggers",
        }
    ],
    "Ground Investigation": [
        {
            "id": "hand operated dynamic cone penetrometer (dcp) system | smartdcp digital recording system and hand operated dcp",
            "name": "Hand Operated Dynamic Cone Penetrometer (DCP) System | SmartDCP digital recording system and hand operated DCP",
        },
        {
            "id": "lightweight, portable dcp | sol'solution panda dcp",
            "name": "Lightweight, Portable DCP | Sol'Solution Panda DCP",
        },
        {
            "id": "pocket penetrometer | geotester pocket penetrometer",
            "name": "Pocket Penetrometer | Geotester pocket penetrometer",
        },
        {
            "id": "schmidt hammer | digi-schmidt 2000, digital measuring system",
            "name": "Schmidt Hammer | Digi-Schmidt 2000, digital measuring system",
        },
        {
            "id": "basic soil sampling kit | ams 3-1/4-inch basic soil sampling kit, hand augers and samplers",
            "name": "Basic Soil Sampling Kit | AMS 3-1/4-inch basic soil sampling kit, hand augers and samplers",
        },
    ],
    "Coastal": [
        {
            "id": "remote-operated hydrographic survey boat | z-boat 1800 with single beam echo sounder",
            "name": "Remote-Operated Hydrographic Survey Boat | Z-boat 1800 with single beam echo sounder",
        },
        {
            "id": "acousitc beacons | ulb 350/37 underwater acoustic beacon",
            "name": "Acousitc Beacons | ULB 350/37 underwater acoustic beacon",
        },
        {
            "id": "beacon locator - diver operated pinger receiver system | dpr-275 diver pinger receiver",
            "name": "Beacon Locator - Diver Operated Pinger Receiver System | DPR-275 Diver Pinger Receiver",
        },
        {
            "id": "water level data logger | trublue 255",
            "name": "Water Level Data Logger | TruBlue 255",
        },
        {
            "id": "acoustic doppler velocimeter | aquadopp profiler with 90deg angle head",
            "name": "Acoustic Doppler Velocimeter | AquaDopp profiler with 90deg angle head",
        },
        {
            "id": 'grab sampler | petite ponar 6"x6" w/ 50 ft of rope',
            "name": 'Grab Sampler | Petite Ponar 6"x6" w/ 50 ft of rope',
        },
    ],
    "Social": [
        {
            "id": "eeg headset | emotiv 14-channel headset",
            "name": "EEG Headset | Emotiv 14-channel headset",
        },
        {
            "id": "eeg headset | emotiv 5-channel headset",
            "name": "EEG Headset | Emotiv 5-channel headset",
        },
        {"id": "pen and paper", "name": "Pen and Paper"},
    ],
    "Support": [
        {
            "id": "smaller battery | goal zero yeti 150",
            "name": "Smaller Battery | Goal Zero Yeti 150",
        },
        {
            "id": "high capacity battery | goal zero yeti 400",
            "name": "High Capacity Battery | Goal Zero Yeti 400",
        },
        {
            "id": "safety vest | custom nheri rapid safety vests with ipad pocket",
            "name": "Safety Vest | Custom NHERI Rapid safety vests with iPad pocket",
        },
        {
            "id": "safety helmet | rock climbing helmet",
            "name": "Safety Helmet | Rock climbing helmet",
        },
        {
            "id": "power inverters | 300w dc 12v to 110v car outlet",
            "name": "Power Inverters | 300W DC 12V to 110V car outlet",
        },
        {
            "id": "walkie talkies (pair) | waterproof, weather proof, long range",
            "name": "Walkie Talkies (pair) | Waterproof, weather proof, long range",
        },
        {
            "id": "rapp pack | swiss gear scansmart backpack w/plumb bob, measuring tape, digital caliper, safety glasses, hand level, pocket rod, first aid kit, weld gauge, crack gauge, range finder,",
            "name": "RAPP Pack | Swiss Gear ScanSmart backpack w/Plumb Bob, Measuring tape, Digital Caliper, Safety Glasses, Hand level, Pocket Rod, First Aid Kit, Weld Gauge, Crack Gauge, Range Finder,",
        },
    ],
}

FR_OBSERVATION_TYPES = [
    {"id": "wind", "name": "Wind"},
    {"id": "structural", "name": "Structural"},
    {"id": "storm surge / coastal", "name": "Storm Surge / Coastal"},
    {"id": "social science", "name": "Social Science"},
    {"id": "geotechnical", "name": "Geotechnical"},
    {"id": "field sensors", "name": "Field Sensors"},
    {"id": "coastal", "name": "Coastal"},
    {"id": "other", "name": "Other"},
]
