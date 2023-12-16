"""Pydantic models for Experimental entities"""
import itertools
from typing import Optional, Annotated
from pydantic import BeforeValidator, Field, ConfigDict, model_validator
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
)
from designsafe.apps.projects_v2.constants import (
    FACILITY_OPTIONS,
    EQUIPMENT_TYPES,
    EXPERIMENT_TYPES,
)

equipment_type_options = list(itertools.chain(*EQUIPMENT_TYPES.values()))
experiment_type_options = list(itertools.chain(*EXPERIMENT_TYPES.values()))


def handle_dropdown_value(options):
    """Look up value if a string id/value is passed."""

    def inner_validator(dropdown_value) -> Optional[dict]:
        if not dropdown_value:
            return None

        if isinstance(dropdown_value, str):
            if dropdown_value.lower() == "other":
                return {"id": "other", "name": ""}

            return next(
                (
                    option
                    for option in options
                    if dropdown_value in (option["id"], option["name"])
                ),
                None,
            )

        return dropdown_value

    return inner_validator


class Experiment(MetadataModel):
    """Model for Experiments."""

    title: str
    description: str = ""

    referenced_data: list[ReferencedWork] = []
    related_work: list[AssociatedProject] = []

    experimental_facility: Annotated[
        Optional[DropdownValue],
        BeforeValidator(handle_dropdown_value(FACILITY_OPTIONS)),
        Field(exclude=True),  # shadowed by the "facility" attribute
    ] = None
    experimental_facility_other: str = Field(default="", exclude=True)
    facility: Optional[DropdownValue] = None

    experiment_type: Annotated[
        Optional[DropdownValue],
        BeforeValidator(handle_dropdown_value(experiment_type_options)),
    ] = None
    experiment_type_other: str = Field(default="", exclude=True)

    equipment_type: Annotated[
        Optional[DropdownValue],
        BeforeValidator(handle_dropdown_value(equipment_type_options)),
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
            and self.experimental_facility
            and not self.experimental_facility.name
        ):
            self.experimental_facility.name = self.experimental_facility_other

        if self.experimental_facility and not self.facility:
            self.facility = self.experimental_facility
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
