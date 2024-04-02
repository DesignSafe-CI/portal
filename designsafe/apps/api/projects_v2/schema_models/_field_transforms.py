"""Transforms for converting legacy metadata to fit our Pydantic schemas."""
from typing import Optional, TypedDict


def handle_award_number(award: list[dict] | list[str] | str) -> list[dict]:
    """Handle the case where awards are saved as strings."""
    if isinstance(award, list):
        if award and isinstance(award[0], str):
            return [{"number": "".join(award)}]
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
    if not bool(author_list):
        return []
    if isinstance(author_list[0], str):
        author_map = map(
            lambda author: {"name": author, "guest": False, "authorship": True},
            author_list,
        )
        return list(author_map)
    return author_list


def handle_keywords(keywords: str | list[str]) -> list[str]:
    """Split keywords into an array."""
    if isinstance(keywords, str):
        return [
            keyword.strip()
            for keyword in keywords.split(",")
            if keyword not in ("", "None")
        ]
    return keywords


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
