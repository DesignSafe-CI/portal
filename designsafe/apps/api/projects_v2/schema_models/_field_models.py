"""Utiity models used in multiple field types"""
from datetime import datetime
from functools import partial
from typing import Annotated, Literal, Optional
from pydantic import AliasChoices, BaseModel, BeforeValidator, ConfigDict, Field
from pydantic.alias_generators import to_camel
from django.contrib.auth import get_user_model
from pytas.http import TASClient


class MetadataModel(BaseModel):
    """Subclass BaseModel with custom config."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
        coerce_numbers_to_str=True,
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

    @classmethod
    def from_username(cls, username: str, role: str = "team_member", **kwargs):
        """Fill in a user object using values from the db."""
        user_model = get_user_model()
        try:
            user_obj = user_model.objects.get(username=username)
            return cls(
                username=username,
                fname=user_obj.first_name,
                lname=user_obj.last_name,
                email=user_obj.email,
                inst=user_obj.profile.institution,
                role=role,
                **kwargs
            )
        except user_model.DoesNotExist:
            try:
                tas_client = TASClient()
                tas_user = tas_client.get_user(username=username)
                return cls(
                    username=username,
                    fname=tas_user["firstName"],
                    lname=tas_user["lastName"],
                    email=tas_user["email"],
                    inst=tas_user["institution"],
                    role=role,
                    **kwargs
                )
            # pylint:disable=broad-exception-caught
            except Exception as _:
                print(username)
                print("unrecoverable username")
            return cls(username=username, role=role, guest=False)


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
    funding_source: Optional[str] = None


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

    file_uuid: Optional[str] = Field(default=None, exclude=True)
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
