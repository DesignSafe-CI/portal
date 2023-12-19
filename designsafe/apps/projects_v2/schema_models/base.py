"""Pydantic schema models for base-level project entities."""
from functools import partial
from datetime import datetime
from typing import Literal, Optional, Annotated, TypedDict
from pydantic import (
    BaseModel,
    ConfigDict,
    BeforeValidator,
    AliasChoices,
    model_validator,
    Field,
)
from pydantic.alias_generators import to_camel
from designsafe.apps.projects_v2.constants import (
    NATURAL_HAZARD_TYPES,
    FIELD_RESEARCH_TYPES,
    OTHER_DATA_TYPES,
)


class MetadataModel(BaseModel):
    """Subclass BaseModel with custom config."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
    )

    def model_dump(self, *args, **kwargs):
        # default by_alias to true for camelCase serialization
        return partial(super().model_dump, by_alias=True)(*args, **kwargs)


class ProjectUser(MetadataModel):
    """Model for project users."""

    order: Optional[int] = None
    guest: Optional[bool] = None
    fname: Optional[str] = None
    lname: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    inst: Optional[str] = None
    user: Optional[str] = None
    username: Optional[str] = None
    role: Optional[Literal["pi", "co_pi", "team_member", "guest"]] = None

    authorship: Optional[bool] = None


class GuestMember(MetadataModel):
    """Model for guest members."""

    order: Optional[int] = None
    guest: bool = True
    fname: str
    lname: str
    inst: Optional[str] = None
    email: Optional[str] = None
    user: str


class ProjectAward(MetadataModel):
    """Model for awards."""

    order: int = 0
    name: Annotated[
        str, BeforeValidator(lambda n: n if isinstance(n, str) else "")
    ] = ""
    number: str = ""


class AssociatedProject(MetadataModel):
    """model for associated projects."""

    # only title guaranteed
    type: str = "Linked Dataset"
    title: str
    href: Optional[str] = ""
    href_type: str = "URL"
    order: Optional[int] = None
    # Some test projects have this weird attribute.
    delete: Optional[bool] = None
    # Some legacy projects have a doi attribute.
    doi: str = ""


class ReferencedWork(MetadataModel):
    """Model for referenced works."""

    title: str
    doi: str = Field(validation_alias=AliasChoices("doi", "url"))
    href_type: str = "URL"


class FileTag(MetadataModel):
    """Model for file tags."""

    file_uuid: str
    tag_name: str
    path: Optional[str] = None


class FileObj(MetadataModel):
    """Model for associated files"""

    system: str
    name: str
    path: str
    type: str
    length: Optional[int] = None
    last_modified: Optional[str] = None
    uuid: Optional[str] = None


class HazmapperMap(MetadataModel):
    """Model for Hazmapper maps."""

    name: str
    uuid: str
    path: str
    deployment: str
    href: Optional[str] = None


class Ref(MetadataModel):
    """Model for refs attached to legacy analysis entities"""

    referencedoi: str = ""
    reference: str = ""


class DropdownValue(MetadataModel):
    """Model for a dropdown option with an ID and name"""

    id: str
    name: str


class NaturalHazardEvent(MetadataModel):
    """Model for natural hazard events"""

    event_name: str
    event_start: datetime
    event_end: Optional[datetime] = None
    location: str
    latitude: str
    longitude: str


def handle_award_number(award: list[dict] | str) -> list[dict]:
    """Handle the case where awards are saved as strings."""
    if isinstance(award, list):
        return award
    if isinstance(award, str):
        return [{"number": award}]
    return award


def handle_array_of_none(field):
    """Convert `[None]` and `[{}]` to empty lists."""
    if field in ([None], [{}]):
        return []
    return field


def handle_legacy_authors(author_list: list):
    """Handle the case where the author field is an array of usernames."""
    if not author_list:
        return []
    if isinstance(author_list[0], str):
        author_map = map(
            lambda author: {"name": author, "guest": False, "authorship": True},
            author_list,
        )
        return list(author_map)
    return author_list


class DropdownValueDict(TypedDict):
    """{"id": "X", "name": "Y"}"""

    id: str
    name: str


def handle_dropdown_value(
    dropdown_value: Optional[str | DropdownValueDict],
    options: list[DropdownValueDict],
    fallback: Optional[DropdownValueDict] = None,
) -> Optional[DropdownValueDict]:
    """Look up value if a string id/value is passed."""
    if not dropdown_value:
        return None

    if isinstance(dropdown_value, str):
        if dropdown_value.lower() == "other":
            return fallback or {"id": "other", "name": ""}
        return next(
            (
                option
                for option in options
                if dropdown_value in (option["id"], option["name"])
            ),
            fallback,
        )
    return dropdown_value


def handle_dropdown_values(
    dropdown_values: list[str | DropdownValueDict | None],
    options: list[DropdownValueDict],
) -> list[DropdownValueDict]:
    """Handle an array of dropdown values."""
    dropdown_values_validated = []
    for value in dropdown_values:
        if isinstance(value, str):
            dropdown_value = handle_dropdown_value(
                value, options, fallback={"id": "other", "name": value}
            )
            dropdown_values_validated.append(dropdown_value)
        else:
            dropdown_values_validated.append(value)
    return list(filter(bool, dropdown_values_validated))


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

    team_order: list[ProjectUser] = []
    authors: list[ProjectUser] = []

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
    keywords: str = ""

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
        if self.team_order and not self.authors:
            self.authors = sorted(self.team_order, key=lambda a: getattr(a, "order", 0))
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
