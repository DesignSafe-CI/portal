"""Mapping of possible metadata names."""

PROJECT = "designsafe.project"
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
