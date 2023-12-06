"""Pydantic schema models for Hybrid Simulation entities"""
from typing import Annotated, Optional
from pydantic import BeforeValidator, Field
from designsafe.apps.projects_v2.schema_models.base import (
    MetadataModel,
    AssociatedProject,
    ReferencedWork,
    ProjectUser,
    FileTag,
    FileObj,
    Ref,
    handle_array_of_none,
    handle_legacy_authors,
)


class HybridSimulation(MetadataModel):
    """Model for a base simulation."""

    title: str
    description: str = ""
    simulation_type: str
    simulation_type_other: str
    procedure_start: str = ""
    procedure_end: str = ""
    referenced_data: list[ReferencedWork] = []
    related_work: list[AssociatedProject] = []
    authors: Annotated[list[ProjectUser], BeforeValidator(handle_legacy_authors)] = []
    project: list[str] = []
    dois: list[str] = []

    facility: Optional[str] = None
    facility_other: Optional[str] = None


class HybridSimGlobalModel(MetadataModel):
    """Model for hybrid sim global models."""

    title: str
    description: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []

    tags: Optional[dict] = Field(default=None, exclude=True)


class HybridSimCoordinator(MetadataModel):
    """Model for coordinators."""

    title: str
    description: str = ""
    application_version: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    global_models: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []

    tags: Optional[dict] = Field(default=None, exclude=True)


class HybridSimSimSubstructure(MetadataModel):
    """Model for simulation substructures."""

    title: str
    description: str = ""
    application_version: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    global_models: list[str] = []
    coordinators: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []

    tags: Optional[dict] = Field(default=None, exclude=True)


class HybridSimExpSubstructure(MetadataModel):
    """Model for experimental substructures."""

    title: str
    description: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    global_models: list[str] = []
    coordinators: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    tags: Optional[dict] = Field(default=None, exclude=True)


class HybridSimCoordinatorOutput(MetadataModel):
    """Model for coordinator output."""

    title: str
    description: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    global_models: list[str] = []
    coordinators: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    tags: Optional[dict] = Field(default=None, exclude=True)


class HybridSimSimOutput(MetadataModel):
    """Model for coordinator output."""

    title: str
    description: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    global_models: list[str] = []
    sim_substructures: list[str] = []
    coordinators: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    tags: Optional[dict] = Field(default=None, exclude=True)


class HybridSimExpOutput(MetadataModel):
    """Model for experimental substructure output."""

    title: str
    description: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    global_models: list[str] = []
    exp_substructures: list[str] = []
    coordinators: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    tags: Optional[dict] = Field(default=None, exclude=True)


class HybridSimAnalysis(MetadataModel):
    """Model for hybrid sim analysis entities."""

    title: str
    description: str = ""
    refs: Annotated[list[Ref], BeforeValidator(handle_array_of_none)] = []

    project: list[str] = []
    hybrid_simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    tags: Optional[dict] = Field(default=None, exclude=True)
    reference: Optional[str] = None
    referencedoi: Optional[str] = None


class HybridSimReport(MetadataModel):
    """Model for hybrid sim reports."""

    title: str
    description: str = ""

    project: list[str] = []
    hybrid_simulations: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    tags: Optional[dict] = Field(default=None, exclude=True)
