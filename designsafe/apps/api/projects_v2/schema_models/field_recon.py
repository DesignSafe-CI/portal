"""Pydantic schema models for Field Recon entities"""
from typing import Annotated, Optional
import itertools
from pydantic import BeforeValidator, Field, AliasChoices
from designsafe.apps.api.projects_v2.schema_models._field_models import MetadataModel
from designsafe.apps.api.projects_v2.schema_models._field_models import (
    AssociatedProject,
    DropdownValue,
    FileObj,
    FileTag,
    ProjectUser,
    ReferencedWork,
)
from designsafe.apps.api.projects_v2.schema_models._field_transforms import (
    handle_array_of_none,
    handle_legacy_authors,
    handle_dropdown_values,
)
from designsafe.apps.api.projects_v2.constants import (
    FR_EQUIPMENT_TYPES,
    FR_OBSERVATION_TYPES,
)

equipment_type_options = list(itertools.chain(*FR_EQUIPMENT_TYPES.values()))


class Mission(MetadataModel):
    """Model for field recon missions."""

    title: str
    description: str = ""

    referenced_data: list[ReferencedWork] = []
    related_work: list[AssociatedProject] = []

    event: str = ""
    date_start: str = ""
    date_end: str = ""
    location: str = ""
    latitude: str = ""
    longitude: str = ""
    elevation: str = ""

    authors: Annotated[list[ProjectUser], BeforeValidator(handle_legacy_authors)] = []
    project: list[str] = []
    dois: list[str] = []
    tombstone: bool = False

    # Deprecate these later
    facility: Optional[DropdownValue] = None


class FieldReconReport(MetadataModel):
    """Model for field recon reports."""

    title: str
    description: str = ""

    referenced_data: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []
    related_work: list[AssociatedProject] = []

    file_tags: list[FileTag] = []
    authors: Annotated[
        list[ProjectUser], BeforeValidator(handle_legacy_authors)
    ] = Field(default=[], validation_alias=AliasChoices("authors", "dataCollectors"))

    guest_data_collectors: list[str] = []
    project: list[str] = []
    files: list[str] = []
    file_objs: list[FileObj] = []
    dois: list[str] = []

    # deprecated, only appears in test projects
    facility: Optional[DropdownValue] = None
    missions: list[str] = Field(default=[], exclude=True)
    referenced_datas: list[ReferencedWork] = Field(default=[], exclude=True)

    tombstone: bool = False


class Instrument(MetadataModel):
    """model for instruments used in field recon projects."""

    model: str = "other"
    name: str = ""


class FieldReconCollection(MetadataModel):
    """Model for field recon collections without a specific type (deprecated)"""

    title: str
    description: str = ""

    observation_types: list[str | None] = []
    date_start: str = ""
    date_end: str = ""

    data_collectors: list[ProjectUser] = []
    guest_data_collectors: list[str] = []

    location: str = ""
    latitude: str = ""
    longitude: str = ""
    elevation: str = ""
    instruments: list[Instrument] = []
    referenced_datas: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []

    project: list[str] = []
    missions: list[str] = []
    files: list[str] = []
    file_objs: list[FileObj] = []
    file_tags: list[FileTag] = []


class SocialScienceCollection(MetadataModel):
    """Model for social science collections"""

    title: str
    description: str
    unit: str = ""
    modes: Annotated[list[str], BeforeValidator(handle_array_of_none)] = []
    sample_approach: Annotated[list[str], BeforeValidator(handle_array_of_none)] = []
    sample_size: str
    date_start: str
    date_end: Optional[str] = None
    data_collectors: list[ProjectUser] = []
    location: str = ""
    latitude: str = ""
    longitude: str = ""
    equipment: Annotated[
        list[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_values(v, equipment_type_options)),
    ] = []
    restriction: str = ""
    referenced_data: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []
    project: list[str] = []
    missions: list[str] = []
    files: list[str] = []
    file_objs: list[FileObj] = []
    file_tags: list[FileTag] = []

    # Deprecated test fields
    methods: list[str | None] = Field(default=[], exclude=True)


class PlanningCollection(MetadataModel):
    """Model for planning collections."""

    title: str
    description: str = ""
    data_collectors: list[ProjectUser] = []
    referenced_data: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []

    project: list[str] = []
    missions: list[str] = []
    files: list[str] = []
    file_objs: list[FileObj] = []
    file_tags: list[FileTag] = []


class GeoscienceCollection(MetadataModel):
    """Model for geoscience collections."""

    title: str
    description: str = ""
    data_collectors: list[ProjectUser] = []
    referenced_data: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []

    observation_types: Annotated[
        list[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_values(v, FR_OBSERVATION_TYPES)),
    ] = []
    date_start: str
    date_end: Optional[str] = None
    location: str = ""
    latitude: str = ""
    longitude: str = ""
    equipment: Annotated[
        list[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_values(v, equipment_type_options)),
    ] = []

    project: list[str] = []
    missions: list[str] = []
    files: list[str] = []
    file_objs: list[FileObj] = []
    file_tags: list[FileTag] = []
