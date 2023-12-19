"""Pydantic models for Experimental entities"""
import itertools
from typing import Optional, Annotated
from pydantic import BeforeValidator, Field, ConfigDict, model_validator, AliasChoices
from designsafe.apps.projects_v2.schema_models.base import (
    MetadataModel,
    AssociatedProject,
    ReferencedWork,
    ProjectUser,
    FileTag,
    FileObj,
    DropdownValue,
    Ref,
    handle_legacy_authors,
    handle_array_of_none,
    handle_dropdown_value,
)
from designsafe.apps.projects_v2.constants import (
    FACILITY_OPTIONS,
    EQUIPMENT_TYPES,
    EXPERIMENT_TYPES,
)

equipment_type_options = list(itertools.chain(*EQUIPMENT_TYPES.values()))
experiment_type_options = list(itertools.chain(*EXPERIMENT_TYPES.values()))


class Experiment(MetadataModel):
    """Model for Experiments."""

    title: str
    description: str = ""

    referenced_data: list[ReferencedWork] = []
    related_work: list[AssociatedProject] = []

    facility: Annotated[
        Optional[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_value(v, FACILITY_OPTIONS)),
        Field(
            exclude=True,
            validation_alias=AliasChoices("facility", "experimentalFacility"),
        ),
    ] = None
    experimental_facility_other: str = Field(default="", exclude=True)

    experiment_type: Annotated[
        Optional[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_value(v, experiment_type_options)),
    ] = None
    experiment_type_other: str = Field(default="", exclude=True)

    equipment_type: Annotated[
        Optional[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_value(v, equipment_type_options)),
    ] = None
    equipment_type_other: str = Field(default="", exclude=True)

    procedure_start: str = ""
    procedure_end: str = ""

    authors: Annotated[list[ProjectUser], BeforeValidator(handle_legacy_authors)] = []
    project: list[str] = []
    dois: list[str] = []

    @model_validator(mode="after")
    def handle_other(self):
        """Use values of XXX_other fields to fill in dropdown values."""
        if (
            self.equipment_type_other
            and self.equipment_type
            and not self.equipment_type.name
        ):
            self.equipment_type.name = self.equipment_type_other
        if (
            self.experiment_type_other
            and self.experiment_type
            and not self.experiment_type.name
        ):
            self.experiment_type.name = self.experiment_type_other
        if (
            self.experimental_facility_other
            and self.facility
            and not self.facility.name
        ):
            self.facility.name = self.experimental_facility_other
        return self


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
    sensor_list_type: Optional[str] = None
    sensor_drawing: Optional[list[str]] = None
    tags: Optional[dict] = Field(default=None, exclude=True)

    sensor_lists: Optional[list[str]] = Field(default=None, exclude=True)
    event_type: Optional[str] = None

    # This field is ONLY present on pub PRJ-1649
    analysis: Optional[list[str]] = None


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
    file_objs: list[FileObj] = []

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
    file_objs: list[FileObj] = []
