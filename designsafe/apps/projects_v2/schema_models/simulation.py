"""Pydantic models for Simulation entities."""

from typing import Optional, Annotated
from pydantic import BeforeValidator, ConfigDict
from designsafe.apps.projects_v2.schema_models.base import (
    MetadataModel,
    AssociatedProject,
    ReferencedWork,
    ProjectUser,
    FileTag,
    Ref,
    handle_legacy_authors,
    handle_array_of_none,
)


class Simulation(MetadataModel):
    """Model for a base simulation."""

    title: str
    description: str = ""
    simulation_type: str
    simulation_type_other: str
    referenced_data: list[ReferencedWork] = []
    related_work: list[AssociatedProject] = []
    authors: Annotated[list[ProjectUser], BeforeValidator(handle_legacy_authors)] = []
    project: list[str] = []
    dois: list[str] = []

    facility: Optional[str] = None
    facility_other: Optional[str] = None


class SimulationModel(MetadataModel):
    """Model for a simulation model."""

    title: str
    application_version: str = ""
    application_version_other: str = ""
    application_version_desc: str = ""
    nh_type: str = ""
    nh_type_other: str = ""
    simulated_system: str = ""
    description: str = ""

    project: list[str] = []
    simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []


class SimulationInput(MetadataModel):
    """Model for simulation input."""

    model_config = ConfigDict(protected_namespaces=())

    title: str
    description: str = ""

    project: list[str] = []
    model_configs: list[str] = []
    simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []


class SimulationOutput(MetadataModel):
    """Model for simulation output."""

    model_config = ConfigDict(protected_namespaces=())

    title: str
    description: str = ""

    project: list[str] = []
    model_configs: list[str] = []
    sim_inputs: list[str] = []
    simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []


class SimulationAnalysis(MetadataModel):
    """Model for simulation analysis."""

    title: str
    description: str = ""

    refs: Annotated[list[Ref], BeforeValidator(handle_array_of_none)] = []
    project: list[str] = []
    sim_inputs: list[str] = []
    sim_outputs: list[str] = []
    simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []

    reference: Optional[str] = None
    referencedoi: Optional[str] = None


class SimulationReport(MetadataModel):
    """Model for simulation reports."""

    title: str
    description: str = ""

    project: list[str] = []
    sim_inputs: list[str] = []
    sim_outputs: list[str] = []
    simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
