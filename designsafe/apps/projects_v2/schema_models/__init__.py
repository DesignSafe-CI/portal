"""Pydantic models for all project entities."""
from designsafe.apps.projects_v2 import constants
from designsafe.apps.projects_v2.schema_models import (
    base,
    experimental,
    hybrid_sim,
    simulation,
    field_recon,
)

SCHEMA_MAPPING: dict[str, base.MetadataModel] = {
    constants.PROJECT: base.BaseProject,
    # Experimental
    constants.EXPERIMENT: experimental.Experiment,
    constants.EXPERIMENT_ANALYSIS: experimental.ExperimentAnalysis,
    constants.EXPERIMENT_REPORT: experimental.ExperimentReport,
    constants.EXPERIMENT_MODEL_CONFIG: experimental.ExperimentModelConfig,
    constants.EXPERIMENT_SENSOR: experimental.ExperimentSensor,
    constants.EXPERIMENT_EVENT: experimental.ExperimentSensor,
    # Simulation
    constants.SIMULATION: simulation.Simulation,
    constants.SIMULATION_REPORT: simulation.SimulationReport,
    constants.SIMULATION_ANALYSIS: simulation.SimulationAnalysis,
    constants.SIMULATION_MODEL: simulation.SimulationModel,
    constants.SIMULATION_INPUT: simulation.SimulationInput,
    constants.SIMULATION_OUTPUT: simulation.SimulationOutput,
    # Field Research
    constants.FIELD_RECON_MISSION: field_recon.Mission,
    constants.FIELD_RECON_COLLECTION: field_recon.FieldReconCollection,
    constants.FIELD_RECON_PLANNING: field_recon.PlanningCollection,
    constants.FIELD_RECON_GEOSCIENCE: field_recon.GeoscienceCollection,
    constants.FIELD_RECON_SOCIAL_SCIENCE: field_recon.SocialScienceCollection,
    constants.FIELD_RECON_REPORT: field_recon.FieldReconReport,
    # Hybrid Sim
    constants.HYBRID_SIM: hybrid_sim.HybridSimulation,
    constants.HYBRID_SIM_ANALYSIS: hybrid_sim.HybridSimAnalysis,
    constants.HYBRID_SIM_REPORT: hybrid_sim.HybridSimReport,
    constants.HYBRID_SIM_GLOBAL_MODEL: hybrid_sim.HybridSimGlobalModel,
    constants.HYBRID_SIM_COORDINATOR: hybrid_sim.HybridSimCoordinator,
    constants.HYBRID_SIM_COORDINATOR_OUTPUT: hybrid_sim.HybridSimCoordinatorOutput,
    constants.HYBRID_SIM_SIM_SUBSTRUCTURE: hybrid_sim.HybridSimSimSubstructure,
    constants.HYBRID_SIM_SIM_OUTPUT: hybrid_sim.HybridSimSimOutput,
    constants.HYBRID_SIM_EXP_SUBSTRUCTURE: hybrid_sim.HybridSimExpSubstructure,
    constants.HYBRID_SIM_EXP_OUTPUT: hybrid_sim.HybridSimExpOutput,
}

PATH_SLUGS = {
    constants.PROJECT: "Project",
    # Experimental
    constants.EXPERIMENT: "Experiment",
    constants.EXPERIMENT_ANALYSIS: "Analysis",
    constants.EXPERIMENT_REPORT: "Report",
    constants.EXPERIMENT_MODEL_CONFIG: "Model-config",
    constants.EXPERIMENT_SENSOR: "Sensor",
    constants.EXPERIMENT_EVENT: "Event",
    # Simulation
    constants.SIMULATION: "Simulation",
    constants.SIMULATION_REPORT: "Report",
    constants.SIMULATION_ANALYSIS: "Analysis",
    constants.SIMULATION_MODEL: "Model",
    constants.SIMULATION_INPUT: "Input",
    constants.SIMULATION_OUTPUT: "Output",
    # Field Research
    constants.FIELD_RECON_MISSION: "Mission",
    constants.FIELD_RECON_COLLECTION: "Collection",
    constants.FIELD_RECON_PLANNING: "Planning-collection",
    constants.FIELD_RECON_GEOSCIENCE: "Geoscience-collection",
    constants.FIELD_RECON_SOCIAL_SCIENCE: "Social-science-collection",
    constants.FIELD_RECON_REPORT: "Report",
    # Hybrid Sim
    constants.HYBRID_SIM: "Hybrid-simulation",
    constants.HYBRID_SIM_ANALYSIS: "Analysis",
    constants.HYBRID_SIM_REPORT: "Report",
    constants.HYBRID_SIM_GLOBAL_MODEL: "Global-model",
    constants.HYBRID_SIM_COORDINATOR: "Coordinator",
    constants.HYBRID_SIM_COORDINATOR_OUTPUT: "Coordinator-output",
    constants.HYBRID_SIM_SIM_SUBSTRUCTURE: "Simulation-substructure",
    constants.HYBRID_SIM_SIM_OUTPUT: "Simulation-output",
    constants.HYBRID_SIM_EXP_SUBSTRUCTURE: "Experimental-substructure",
    constants.HYBRID_SIM_EXP_OUTPUT: "Experimental-output",
}
