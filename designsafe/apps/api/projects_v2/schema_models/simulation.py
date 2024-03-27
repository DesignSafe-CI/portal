"""Pydantic models for Simulation entities."""

from typing import Optional, Annotated
from pydantic import BeforeValidator, ConfigDict, Field, model_validator
from designsafe.apps.api.projects_v2.schema_models._field_models import MetadataModel
from designsafe.apps.api.projects_v2.schema_models._field_models import (
    AssociatedProject,
    DropdownValue,
    FileObj,
    FileTag,
    ProjectUser,
    Ref,
    ReferencedWork,
)
from designsafe.apps.api.projects_v2.schema_models._field_transforms import (
    handle_array_of_none,
    handle_legacy_authors,
    handle_dropdown_value,
)
from designsafe.apps.api.projects_v2.constants import SIMULATION_TYPES


class Simulation(MetadataModel):
    """Model for a base simulation."""

    title: str
    description: str = ""
    simulation_type: Annotated[
        DropdownValue,
        BeforeValidator(lambda v: handle_dropdown_value(v, SIMULATION_TYPES)),
    ]
    simulation_type_other: Optional[str] = Field(exclude=True, default=None)
    referenced_data: list[ReferencedWork] = []
    related_work: list[AssociatedProject] = []
    authors: Annotated[list[ProjectUser], BeforeValidator(handle_legacy_authors)] = []
    project: list[str] = []
    dois: list[str] = []

    facility: Optional[DropdownValue] = None

    @model_validator(mode="after")
    def handle_other(self):
        """Use values of XXX_other fields to fill in dropdown values."""
        if (
            self.simulation_type_other
            and self.simulation_type
            and not self.simulation_type.name
        ):
            self.simulation_type.name = self.simulation_type_other
        return self


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
    file_objs: list[FileObj] = []


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
    file_objs: list[FileObj] = []


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
    file_objs: list[FileObj] = []


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
    file_objs: list[FileObj] = []

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
    file_objs: list[FileObj] = []
