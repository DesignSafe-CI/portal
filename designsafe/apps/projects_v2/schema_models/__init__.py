"""Pydantic models for all project entities."""
from designsafe.apps.projects_v2 import constants
from designsafe.apps.projects_v2.schema_models import (
    base,
    experimental,
    hybrid_sim,
    simulation,
    field_recon,
)

SCHEMA_MAPPING = {
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
