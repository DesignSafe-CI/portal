"""Pydantic schema models for base-level project entities."""

from datetime import datetime
from typing import Literal, Optional, Annotated
from pydantic import (
    BeforeValidator,
    AliasChoices,
    ConfigDict,
    model_validator,
    Field,
)
from designsafe.apps.api.projects_v2.constants import (
    NATURAL_HAZARD_TYPES,
    FIELD_RESEARCH_TYPES,
    OTHER_DATA_TYPES,
)
from designsafe.apps.api.projects_v2.schema_models._field_models import MetadataModel
from designsafe.apps.api.projects_v2.schema_models._field_models import (
    AssociatedProject,
    DropdownValue,
    FileTag,
    FileObj,
    GuestMember,
    HazmapperMap,
    NaturalHazardEvent,
    ProjectAward,
    ProjectUser,
    ReferencedWork,
)
from designsafe.apps.api.projects_v2.schema_models._field_transforms import (
    handle_array_of_none,
    handle_award_number,
    handle_dropdown_value,
    handle_dropdown_values,
    handle_keywords,
)


class PartialEntityWithFiles(MetadataModel):
    """Model for representing an entity with associated files."""

    model_config = ConfigDict(extra="ignore")

    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []


class BaseProject(MetadataModel):
    """Model for project root metadata."""

    project_id: str
    project_type: Literal[
        "other",
        "experimental",
        "simulation",
        "hybrid_simulation",
        "field_recon",
        "field_reconnaissance",
        "None",
    ] = "None"
    title: str
    description: str = ""
    team_members: list[str] = Field(
        default=[], validation_alias=AliasChoices("teamMembers", "teamMember")
    )
    users: list[ProjectUser] = []

    guest_members: Annotated[
        list[GuestMember], BeforeValidator(handle_array_of_none)
    ] = []
    pi: Optional[str] = None
    co_pis: list[str] = []
    data_type: Annotated[
        Optional[DropdownValue],
        BeforeValidator(
            lambda v: handle_dropdown_value(
                v, OTHER_DATA_TYPES, fallback={"id": "other", "name": v}
            )
        ),
    ] = None
    data_types: list[DropdownValue] = []

    authors: list[ProjectUser] = Field(
        default=[], validation_alias=AliasChoices("authors", "teamOrder")
    )

    # This field is stored as awardNumber in projects and awardNumbers in pubs
    award_number: Annotated[
        list[ProjectAward], BeforeValidator(handle_award_number)
    ] = Field(default=[], exclude=True)
    award_numbers: Annotated[
        list[ProjectAward], BeforeValidator(handle_award_number)
    ] = []
    associated_projects: list[AssociatedProject] = []
    referenced_data: list[ReferencedWork] = []
    ef: Optional[str] = None
    keywords: Annotated[list[str], BeforeValidator(handle_keywords)] = []

    nh_event: str = ""
    nh_event_start: Annotated[
        Optional[datetime], BeforeValidator(lambda v: v or None)
    ] = None
    nh_event_end: Annotated[
        Optional[datetime], BeforeValidator(lambda v: v or None)
    ] = None
    nh_location: str = ""
    nh_latitude: str = ""
    nh_longitude: str = ""
    nh_events: list[NaturalHazardEvent] = []

    nh_types: Annotated[
        list[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_values(v, NATURAL_HAZARD_TYPES)),
    ] = []

    fr_types: Annotated[
        list[DropdownValue],
        BeforeValidator(lambda v: handle_dropdown_values(v, FIELD_RESEARCH_TYPES)),
    ] = []
    dois: list[str] = []
    license: Optional[str] = None

    file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []
    hazmapper_maps: list[HazmapperMap] = []

    facilities: list[DropdownValue] = []

    # These fields are ONLY present on publication PRJ-1665
    natural_hazard_type: Optional[str] = None
    natural_hazard_event: Optional[str] = None
    coverage_temporal: Optional[str] = None
    lat_long_name: Optional[str] = None

    tombstone: bool = False
    tombstone_message: Optional[str] = None

    def construct_users(self) -> list[ProjectUser]:
        """Fill in missing user information from the database."""
        users = []
        if self.pi and self.pi != "None":
            users.append(ProjectUser.from_username(self.pi, role="pi"))
        for co_pi in self.co_pis:
            if len(co_pi) == 1 or co_pi == "None":
                continue
            users.append(ProjectUser.from_username(co_pi, role="co_pi"))
        for team_member in self.team_members:
            if len(team_member) == 1 or team_member == "None":
                continue
            users.append(ProjectUser.from_username(team_member, role="team_member"))
        return users

    @model_validator(mode="after")
    def post_validate(self):
        """Populate derived fields if they don't exist yet."""
        _authors = sorted(self.authors or [], key=lambda a: getattr(a, "order", 0) or 0)
        if self.authors != _authors:
            self.authors = _authors
        if self.data_type and not self.data_types:
            self.data_types = [self.data_type]
        if self.nh_event and self.nh_event_start and not self.nh_events:
            self.nh_events = [
                NaturalHazardEvent(
                    event_name=self.nh_event,
                    event_start=self.nh_event_start,
                    event_end=self.nh_event_end,
                    location=self.nh_location,
                    latitude=self.nh_latitude,
                    longitude=self.nh_longitude,
                )
            ]
        if self.award_number and not self.award_numbers:
            self.award_numbers = self.award_number
        if (not self.users) and (users := self.construct_users()):
            self.users = users
        return self

    def to_fedora_json(self):
        """format project metadata for Fedora"""
        fedora_json = {}
        fedora_json["title"] = self.title
        fedora_json["description"] = self.description
        fedora_json["identifier"] = [
            self.project_id,
            f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{self.project_id}",
        ]
        if self.dois:
            fedora_json["identifier"] += self.dois

        fedora_json["coverage"] = []
        for nh_event in self.nh_events:
            if nh_event.event_start:
                fedora_json["coverage"].append(nh_event.event_start.isoformat())
            if nh_event.event_end:
                fedora_json["coverage"].append(nh_event.event_end.isoformat())
            fedora_json["coverage"].append(nh_event.location)

        fedora_json["subject"] = self.keywords
        if self.nh_event:
            fedora_json["subject"].append(self.nh_event)
        if self.fr_types:
            fedora_json["subject"] += [t.name for t in self.fr_types]
        if self.nh_types:
            fedora_json["subject"] += [t.name for t in self.nh_types]
        fedora_json["subject"] = [s for s in fedora_json["subject"] if s]

        fedora_json["contributors"] = []
        for award in self.award_numbers:
            fedora_json["contributors"].append(award.name)
            fedora_json["contributors"].append(award.number)
        for facility in self.facilities:
            fedora_json["contributors"].append(facility.name)
        fedora_json["contributors"] = [c for c in fedora_json["contributors"] if c]

        fedora_json["type"] = self.project_type
        if self.project_type == "other":
            fedora_json["type"] = [t.name for t in self.data_types]

        fedora_json["creator"] = [
            f"{author.lname}, {author.fname}" for author in self.authors
        ]
        if self.license:
            fedora_json["license"] = self.license
        fedora_json["publisher"] = "Designsafe"

        for referenced_data in self.referenced_data:
            reference_mapping = referenced_data.to_fedora_json()
            for key in reference_mapping:
                fedora_json[key] = fedora_json.get(key, []) + [reference_mapping[key]]

        for related_work in self.associated_projects:
            related_mapping = related_work.to_fedora_json()
            for key in related_mapping:
                fedora_json[key] = fedora_json.get(key, []) + [related_mapping[key]]

        return fedora_json
