"""Pydantic schema models for base-level project entities."""
from functools import partial
from typing import Literal, Optional, Annotated
from pydantic import (
    BaseModel,
    ConfigDict,
    BeforeValidator,
    AliasChoices,
    Field,
)
from pydantic.alias_generators import to_camel


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
    href: str = ""
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
    length: int


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
    name: Optional[str] = None


def handle_award_number(award: list[dict] | str) -> list[dict]:
    """Handle the case where awards are saved as strings."""
    if isinstance(award, list):
        return award
    if isinstance(award, str):
        return [{"name": award}]
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


nh_options = [
    "Drought",
    "Earthquake",
    "Extreme Temperatures",
    "Wildfire",
    "Flood",
    "Hurricane/Tropical Storm",
    "Landslide",
    "Tornado",
    "Tsunami",
    "Thunderstorm",
    "Storm Surge",
    "Pandemic",
    "Wind",
]
nh_options_map = {val: {"id": val.lower(), "name": val} for val in nh_options}
nh_options_map["Fire"] = {"id": "Fire".lower(), "name": "Wildfire"}
nh_options_map["Wildfire"] = {"id": "Fire".lower(), "name": "Wildfire"}
nh_options_map["Hurricane"] = {
    "id": "Hurricane/Tropical Storm".lower(),
    "name": "Hurricane/Tropical Storm",
}
nh_options_map["Tropical Storm"] = {
    "id": "Hurricane/Tropical Storm".lower(),
    "name": "Hurricane/Tropical Storm",
}


def handle_nh_types(nh_types: list):
    """Convert nh_types from list of strings to list of id/name pairs"""
    nh_types_validated = []
    for name in nh_types:
        if isinstance(name, str):
            nh_value = nh_options_map.get(name, {"id": "other", "name": name})
            nh_types_validated.append(nh_value)
        else:
            nh_types_validated.append(name)
    return nh_types_validated


fr_type_options = [
    "Engineering",
    "Geosciences",
    "Public Health",
    "Social Sciences",
    "Interdisciplinary",
    "Field Experiment",
    "Cross-Sectional Study",
    "Longitudinal Study",
    "Reconnaissance",
    "Other",
]
fr_type_options_map = {val: {"id": val.lower(), "name": val} for val in fr_type_options}


def handle_fr_types(fr_types: list):
    """Convert nh_types from list of strings to list of id/name pairs"""
    fr_types_validated = []
    for name in fr_types:
        if isinstance(name, str):
            fr_value = fr_type_options_map.get(name, {"id": "other", "name": name})
            fr_types_validated.append(fr_value)
        else:
            fr_types_validated.append(name)
    return fr_types_validated


data_type_options = [
    "Archival Materials",
    "Audio",
    "Benchmark Dataset",
    "Check Sheet",
    "Code",
    "Database",
    "Dataset",
    "Engineering",
    "Image",
    "Interdisciplinary",
    "Jupyter Notebook",
    "Learning Object",
    "Model",
    "Paper",
    "Proceeding",
    "Poster",
    "Presentation",
    "Report",
    "Research Experience for Undergraduates",
    "SimCenter Testbed",
    "Social Sciences",
    "Survey Instrument",
    "Testbed",
    "Video",
]
data_type_options_map = {
    val: {"id": val.lower(), "name": val} for val in data_type_options
}


def handle_data_type(data_type):
    """Convert data_type from string to id/name pair"""
    if isinstance(data_type, str):
        return data_type_options_map.get(data_type, {"id": "other", "name": data_type})
    return data_type


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
    guest_members: Annotated[
        list[GuestMember], BeforeValidator(handle_array_of_none)
    ] = []
    pi: str
    co_pis: list[str] = []
    data_type: str = Annotated(DropdownValue, BeforeValidator(handle_data_type))
    team_order: list[ProjectUser] = []
    award_number: Annotated[
        list[ProjectAward], BeforeValidator(handle_award_number)
    ] = []
    award_numbers: list[str] = []
    associated_projects: list[AssociatedProject] = []
    referenced_data: list[ReferencedWork] = []
    ef: Optional[str] = None
    keywords: str = ""

    nh_event: str = ""
    nh_event_start: str = ""
    nh_event_end: str = ""
    nh_location: str = ""
    nh_latitude: str = ""
    nh_longitude: str = ""

    nh_types: Annotated[list[DropdownValue], BeforeValidator(handle_nh_types)] = []

    fr_types: Annotated[list[DropdownValue], BeforeValidator(handle_fr_types)] = []
    dois: list[str] = []

    file_tags: list[FileTag] = []
    hazmapper_maps: list[HazmapperMap] = []

    facilities: list[DropdownValue] = []
