"""Pydantic models for Experimental entities"""
from typing import Optional, Annotated
from pydantic import BeforeValidator, Field, ConfigDict
from designsafe.apps.projects_v2.schema_models.base import (
    MetadataModel,
    AssociatedProject,
    ReferencedWork,
    ProjectUser,
    FileTag,
    FileObj,
    Ref,
    handle_legacy_authors,
    handle_array_of_none,
)


class Experiment(MetadataModel):
    """Model for Experiments."""

    title: str
    description: str = ""

    referenced_data: list[ReferencedWork] = []
    related_work: list[AssociatedProject] = []

    experiment_type: str = ""
    experiment_type_other: str = ""

    experimental_facility: str = ""
    experimental_facility_other: str = ""

    equipment_type: str = ""
    equipment_type_other: str = ""

    procedure_start: str = ""
    procedure_end: str = ""

    authors: Annotated[list[ProjectUser], BeforeValidator(handle_legacy_authors)] = []
    project: list[str] = []
    dois: list[str] = []


class ExperimentModelConfig(MetadataModel):
    """Model for model configurations."""

    title: str
    description: str = ""
    project: list[str] = []
    experiments: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    # Deprecated/legacy fields
    drawing: Optional[list[str]] = Field(
        default=None, exclude=True, alias="modelDrawing"
    )
    tags: Optional[dict] = Field(default=None, exclude=True)
    image: Optional[dict] = Field(default=None, exclude=True)
    lat: Optional[str] = Field(default=None, exclude=True)
    lon: Optional[str] = Field(default=None, exclude=True)
    video: Optional[dict] = Field(default=None, exclude=True)
    spatial: Optional[str] = Field(default=None, exclude=True)
    coverage: Optional[str] = Field(default=None, exclude=True)


class ExperimentSensor(MetadataModel):
    """Model for sensors."""

    model_config = ConfigDict(protected_namespaces=())

    title: str
    description: str = ""
    project: list[str] = []
    experiments: list[str] = []
    model_configs: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    # Deprecated legacy fields
    sensor_list_type: Optional[str] = Field(default=None, exclude=True)
    sensor_drawing: Optional[list[str]] = Field(default=None, exclude=True)
    tags: Optional[dict] = Field(default=None, exclude=True)


class ExperimentEvent(MetadataModel):
    """Model for experimental events."""

    model_config = ConfigDict(protected_namespaces=())

    title: str
    description: str = ""
    event_type: str = ""
    project: list[str] = []
    experiments: list[str] = []
    sensor_lists: list[str] = []
    analysis: list[str] = []
    model_configs: list[str] = []

    files: list[str] = []
    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []

    tags: Optional[dict] = Field(default=None, exclude=True)
    load: Optional[list[str]] = Field(default=None, exclude=True)


class ExperimentAnalysis(MetadataModel):
    """Model for experimental analysis."""

    title: str
    description: str = ""
    analysis_type: str = ""
    refs: Annotated[list[Ref], BeforeValidator(handle_array_of_none)] = []

    analysis_data: str = ""
    application: str = ""
    script: list[str] = []
    project: list[str] = []
    experiments: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []

    tags: Optional[dict] = Field(default=None, exclude=True)
    reference: Optional[str] = Field(default=None, exclude=True)
    referencedoi: Optional[str] = Field(default=None, exclude=True)


class ExperimentReport(MetadataModel):
    """Model for experimental reports."""

    title: str
    description: str = ""

    project: list[str] = []
    experiments: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
