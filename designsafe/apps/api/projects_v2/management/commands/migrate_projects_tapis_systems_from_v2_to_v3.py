"""Migrate Projects Tapis Systems from V2 to V3.

This module contains a Django management command which migrates Tapis systems associated with
projects from Tapis V2 to Tapis V3.
"""

# pylint: disable=logging-fstring-interpolation
# pylint: disable=no-member

import logging
import os

from django.conf import settings
from django.core.management.base import BaseCommand

from tapipy.tapis import Tapis

from designsafe.apps.api.projects_v2.tests.schema_integration import iterate_entities


logger = logging.getLogger(__name__)


def remove_user(client, system_id: str, username: str):
    """
    Unshare the system and remove all permissions and credentials.
    """
    client.systems.removeUserCredential(systemId=system_id, userName=username)
    client.systems.unShareSystem(systemId=system_id, users=[username])
    client.systems.revokeUserPerms(
        systemId=system_id, userName=username, permissions=["READ", "MODIFY", "EXECUTE"]
    )
    client.files.deletePermissions(systemId=system_id, username=username, path="/")


def set_workspace_permissions(client: Tapis, username: str, system_id: str, role: str):
    """Apply read/write/execute permissions to a user on a system."""

    system_pems = {"reader": ["READ", "EXECUTE"], "writer": ["READ", "EXECUTE"]}

    files_pems = {"reader": "READ", "writer": "MODIFY"}

    logger.info(f"Adding {username} permissions to Tapis system {system_id}")
    client.systems.grantUserPerms(
        systemId=system_id, userName=username, permissions=system_pems[role]
    )

    if role == "reader":
        client.systems.revokeUserPerms(
            systemId=system_id, userName=username, permissions=["MODIFY"]
        )
        client.files.deletePermissions(systemId=system_id, path="/", username=username)

    client.files.grantPermissions(
        systemId=system_id, path="/", username=username, permission=files_pems[role]
    )


def create_or_update_workspace_system(
    create,
    client,
    system_id: str,
    title: str,
    description: str,  # pylint: disable=too-many-arguments
    project_root_dir: str,
    owner=None,
) -> str:
    """Create or update a system."""

    system_args = {
        "id": system_id,
        "host": HOST,
        "port": int(PORT),
        "systemType": "LINUX",
        "defaultAuthnMethod": "PKI_KEYS",
        "canExec": False,
        "rootDir": project_root_dir,
        "effectiveUserId": TG_USER,
        "authnCredential": {
            "privateKey": TG_USER_PRIVATE_KEY,
            "publicKey": TG_USER_PUBLIC_KEY,
        },
        "notes": {"title": title, "description": description},
    }
    if owner:
        system_args["owner"] = owner
    if create:
        client.systems.createSystem(**system_args)
    else:
        client.systems.patchSystem(systemId=system_id, **system_args)


# pylint: disable=invalid-name
HOST = settings.PROJECT_STORAGE_SYSTEM_TEMPLATE["storage"][
    "host"
]  # cloud.corral.tacc.utexas.edu
PORT = 22
TG_USER = settings.PROJECT_STORAGE_SYSTEM_TEMPLATE["storage"]["auth"][
    "username"
]  # i.e. tg458981
TG_USER_PRIVATE_KEY = settings.PROJECT_STORAGE_SYSTEM_TEMPLATE["storage"]["auth"][
    "privateKey"
]
TG_USER_PUBLIC_KEY = settings.PROJECT_STORAGE_SYSTEM_TEMPLATE["storage"]["auth"][
    "publicKey"
]
OWNER = "wma_prtl"
# pylint: enable=invalid-name


class Command(BaseCommand):
    """Command for migrating projects from Tapis v2 to v3"""

    help = (
        "Facilitates the migration of project systems from Tapis v2 to v3,"
        " with options for a dry run and updating existing systems."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Executes the command in a simulation mode, logging actions "
            "without applying any changes to the systems or data.",
        )

        parser.add_argument(
            "--update-existing",
            action="store_true",
            help="Allows the command to update systems that already exist in Tapis V3,"
            "ensuring they are synchronized with their V2 counterparts.",
        )

    def handle(
        self, *args, **options
    ):  # pylint: disable=too-many-statements disable=too-many-locals
        dry_run = options["dry_run"]
        update_existing = options["update_existing"]

        TAPIS_TENANT_BASEURL = os.environ.get(
            "TAPIS_TENANT_BASEURL"
        )  # pylint: disable=invalid-name
        TAPIS_ADMIN_JWT = os.environ.get(
            "TAPIS_ADMIN_JWT"
        )  # pylint: disable=invalid-name
        client = Tapis(base_url=TAPIS_TENANT_BASEURL, access_token=TAPIS_ADMIN_JWT)

        if dry_run:
            logger.info("Running in dry-run mode. No changes will be made.")

        total_number_projects = len(list(iterate_entities()))

        for i, project in enumerate(iterate_entities()):
            uuid = project["uuid"]
            project_id = project["value"]["projectId"]
            system = f"project-{uuid}"
            project_root_dir = f"/corral-repl/projects/NHERI/projects/{uuid}"
            title = project["value"]["title"]
            description = (
                project["value"]["description"]
                if "description" in project["value"]
                else ""
            )
            pi = project["value"]["pi"]  # pylint: disable=invalid-name
            co_pis = project["value"]["coPis"] if "coPis" in project["value"] else []
            team_members = (
                project["value"]["teamMembers"]
                if "teamMembers" in project["value"]
                else []
            )
            guest_members = (
                project["value"]["guestMembers"]
                if ("guestMembers" in project["value"])
                else []
            )
            guest_members = [u["user"] for u in guest_members if u is not None]

            all_writers = co_pis + team_members + guest_members
            if pi is not None:
                all_writers.append(pi)

            logger.info(
                f"Migrating {i}/{total_number_projects} {project_id} ({uuid}) "
                f"('{title}') pi:{pi} coPis:{co_pis} teamMembers:{team_members} "
                f"guestMembers:{guest_members}"
            )

            all_readers = guest_members
            all_users = all_readers + all_writers

            system_exists = True
            try:
                client.systems.getSystem(systemId=system)
            except Exception:  # pylint: disable=broad-exception-caught
                system_exists = False

            if not dry_run:
                if system_exists and not update_existing:
                    logger.info(
                        "System already exists so skipping (update_existing=False)"
                    )
                    continue
                if system_exists:
                    shared_information = client.systems.getShareInfo(systemId=system)
                    user_to_remove = set(shared_information.get("users")) - set(
                        all_users
                    )
                    for user in user_to_remove:
                        logger.info(f"removing user: {user}")
                        remove_user(client, system, user)

                create = not system_exists

                try:
                    create_or_update_workspace_system(
                        create,
                        client,
                        system_id=system,
                        title=title,
                        description=description,
                        project_root_dir=project_root_dir,
                        owner=OWNER,
                    )
                    client.systems.shareSystem(systemId=system, users=all_users)

                    for user in all_writers:
                        set_workspace_permissions(client, user, system, "writer")

                    for user in all_readers:
                        set_workspace_permissions(client, user, system, "reader")
                except Exception:  # pylint: disable=broad-exception-caught
                    logger.exception(f"Error for system:{system}")
            else:
                system_exists_text = (
                    "System already exists"
                    if system_exists
                    else "System does not exist"
                )
                logger.info(
                    f"Running in dry-run mode. No changes will be made. "
                    f""
                    f"Note: {system_exists_text}"
                )
        logger.info("Successfully migrated systems")
