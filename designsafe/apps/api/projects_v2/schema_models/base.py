"""Pydantic schema models for base-level project entities."""
from datetime import datetime
from typing import Literal, Optional, Annotated
from pydantic import (
    BeforeValidator,
    AliasChoices,
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
    pi: str
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

    file_tags: list[FileTag] = []
    hazmapper_maps: list[HazmapperMap] = []

    facilities: list[DropdownValue] = []

    # These fields are ONLY present on publication PRJ-1665
    natural_hazard_type: Optional[str] = None
    natural_hazard_event: Optional[str] = None
    coverage_temporal: Optional[str] = None
    lat_long_name: Optional[str] = None

    @model_validator(mode="after")
    def post_validate(self):
        """Populate derived fields if they don't exist yet."""
        _authors = sorted(self.authors or [], key=lambda a: getattr(a, "order", 0))
        if self.authors != _authors:
            self.authors = _authors
        if self.data_type and not self.data_types:
            self.data_types = [self.data_type]
        if self.nh_event and not self.nh_events:
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
        return self
