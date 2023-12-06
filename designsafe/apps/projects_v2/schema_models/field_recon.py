"""Pydantic schema models for Field Recon entities"""
from typing import Annotated, Optional
from pydantic import BeforeValidator, Field, AliasChoices
from designsafe.apps.projects_v2.schema_models.base import (
    MetadataModel,
    AssociatedProject,
    ReferencedWork,
    ProjectUser,
    FileTag,
    handle_array_of_none,
)


def handle_legacy_authors(author_list: list):
    """Handle the case where the author field is an array of usernames."""
    if not bool(author_list):
        return []
    if isinstance(author_list[0], str):
        author_map = map(
            lambda author: {"name": author, "guest": False, "authorship": True},
            author_list,
        )
        return list(author_map)
    return author_list


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

    # Deprecate these later
    facility: Optional[str] = None
    facility_other: Optional[str] = None


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
    dois: list[str] = []

    # deprecated, only appears in test projects
    facility: Optional[str] = None
    facility_other: Optional[str] = None
    missions: list[str] = Field(default=[], exclude=True)
    referenced_datas: list[ReferencedWork] = Field(default=[], exclude=True)


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
    date_end: str
    data_collectors: list[ProjectUser] = []
    location: str = ""
    latitude: str = ""
    longitude: str = ""
    equipment: list[str] = ""
    restriction: str = ""
    referenced_data: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []
    project: list[str] = []
    missions: list[str] = []
    files: list[str] = []
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
    file_tags: list[FileTag] = []


class GeoscienceCollection(MetadataModel):
    """Model for geoscience collections."""

    title: str
    description: str = ""
    data_collectors: list[ProjectUser] = []
    referenced_data: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []

    observation_types: list[str] = ""
    date_start: str
    date_end: str
    location: str = ""
    latitude: str = ""
    longitude: str = ""
    equipment: list[str] = ""

    project: list[str] = []
    missions: list[str] = []
    files: list[str] = []
    file_tags: list[FileTag] = []
