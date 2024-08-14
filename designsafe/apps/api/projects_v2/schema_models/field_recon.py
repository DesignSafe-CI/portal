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
    date_start: Optional[str] = None
    date_end: Optional[str] = None
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

    def to_fedora_json(self):
        """Metadata representation for the Fedora repository"""
        fedora_json = {
            "title": self.title,
            "description": self.description,
            "publisher": "Designsafe",
        }
        fedora_json["creator"] = [
            f"{author.lname}, {author.fname}" for author in self.authors
        ]

        fedora_json["coverage"] = []
        if self.date_start:
            fedora_json["coverage"].append(self.date_start)
        if self.date_end:
            fedora_json["coverage"].append(self.date_end)
        if self.location:
            fedora_json["coverage"].append(self.location)

        fedora_json["identifier"] = self.dois
        if self.facility:
            fedora_json["contributor"] = self.facility.name

        for referenced_data in self.referenced_data:
            reference_mapping = referenced_data.to_fedora_json()
            for key in reference_mapping:
                fedora_json[key] = fedora_json.get(key, []) + [reference_mapping[key]]

        for related_work in self.related_work:
            related_mapping = related_work.to_fedora_json()
            for key in related_mapping:
                fedora_json[key] = fedora_json.get(key, []) + [related_mapping[key]]

        return fedora_json


class FieldReconReport(MetadataModel):
    """Model for field recon reports."""

    title: str
    description: str = ""

    referenced_data: Annotated[
        list[ReferencedWork], BeforeValidator(handle_array_of_none)
    ] = []
    related_work: list[AssociatedProject] = []

    file_tags: list[FileTag] = []
    authors: Annotated[list[ProjectUser], BeforeValidator(handle_legacy_authors)] = (
        Field(default=[], validation_alias=AliasChoices("authors", "dataCollectors"))
    )

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

    def to_fedora_json(self):
        """Metadata representation for the Fedora repository"""
        fedora_json = {
            "title": self.title,
            "description": self.description,
            "publisher": "Designsafe",
        }
        # pylint:disable=not-an-iterable
        fedora_json["creator"] = [
            f"{author.lname}, {author.fname}" for author in self.authors
        ]

        fedora_json["identifier"] = self.dois
        if self.facility:
            fedora_json["contributor"] = self.facility.name

        for referenced_data in self.referenced_data:
            reference_mapping = referenced_data.to_fedora_json()
            for key in reference_mapping:
                fedora_json[key] = fedora_json.get(key, []) + [reference_mapping[key]]

        for related_work in self.related_work:
            related_mapping = related_work.to_fedora_json()
            for key in related_mapping:
                fedora_json[key] = fedora_json.get(key, []) + [related_mapping[key]]

        return fedora_json


class Instrument(MetadataModel):
    """model for instruments used in field recon projects."""

    model: str = "other"
    name: str = ""


class FieldReconCollection(MetadataModel):
    """Model for field recon collections without a specific type (deprecated)"""

    title: str
    description: str = ""

    observation_types: Annotated[
        list[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_values(v, FR_OBSERVATION_TYPES)),
    ] = []
    date_start: Optional[str] = None
    date_end: Optional[str] = None

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
    sample_size: str = ""
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

    def to_fedora_json(self):
        """Metadata representation for the Fedora repository"""
        fedora_json = {
            "type": "Social Science/dataset",
            "title": self.title,
            "description": self.description,
        }
        fedora_json["subject"] = []
        if self.unit:
            fedora_json["subject"] += self.unit
        if self.modes:
            fedora_json["subject"].append(self.modes)
        if self.sample_approach:
            fedora_json["subject"] += self.sample_approach
        if self.sample_size:
            fedora_json["subject"].append(self.sample_size)
        for equipment in self.equipment:
            fedora_json["subject"].append(equipment.name)

        fedora_json["coverage"] = []
        if self.date_start:
            fedora_json["coverage"].append(self.date_start)
        if self.date_end:
            fedora_json["coverage"].append(self.date_end)
        if self.location:
            fedora_json["coverage"].append(self.location)

        if self.restriction:
            fedora_json["accessRights"] = self.restriction

        fedora_json["contributor"] = [
            f"{author.lname}, {author.fname}" for author in self.data_collectors
        ]
        return fedora_json


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

    def to_fedora_json(self):
        """Metadata representation for the Fedora repository"""
        fedora_json = {
            "type": "Research Planning Collection",
            "title": self.title,
            "description": self.description,
        }
        fedora_json["contributor"] = [
            f"{author.lname}, {author.fname}" for author in self.data_collectors
        ]
        return fedora_json


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

    def to_fedora_json(self):
        """Metadata representation for the Fedora repository"""
        fedora_json = {
            "type": "Engineering Geosciences Collection",
            "title": self.title,
            "description": self.description,
        }

        fedora_json["subject"] = []
        fedora_json["subject"] += [o.name for o in self.observation_types]
        fedora_json["subject"] += [e.name for e in self.equipment]

        fedora_json["coverage"] = []
        if self.date_start:
            fedora_json["coverage"] += self.date_start
        if self.date_end:
            fedora_json["coverage"] += self.date_end

        if self.location:
            fedora_json["coverage"].append(self.location)

        return fedora_json
