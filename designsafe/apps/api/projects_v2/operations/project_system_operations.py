"""Utilities for creating project systems and managing access permissions."""

# from portal.utils.encryption import createKeyPair
import logging
from typing import Literal
from tapipy.tapis import Tapis
from django.conf import settings
import celery
from designsafe.apps.api.agave import service_account
from celery import shared_task

# from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials, register_public_key


logger = logging.getLogger(__name__)


def set_workspace_permissions(
    client: Tapis, username: str, system_id: str, role: str = "writer"
):
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


def set_workspace_acls(client, system_id, path, username, operation, role="writer"):
    operation_map = {"add": "ADD", "remove": "REMOVE"}

    acl_string_map = {
        "reader": f"d:u:{username}:rX,u:{username}:rX",
        "writer": f"d:u:{username}:rwX,u:{username}:rwX",
        "none": f"d:u:{username},u:{username}",
    }

    client.files.setFacl(
        systemId=system_id,
        path=path,
        operation=operation_map[operation],
        recursionMethod="PHYSICAL",
        aclString=acl_string_map[role],
    )


def submit_workspace_acls_job(
    username: str, project_uuid: str, action=Literal["add", "remove"]
):
    """
    Submit a job to set ACLs on a project for a specific user. This should be used if
    we are setting ACLs on an existing project, since there might be too many files for
    the synchronous Tapis endpoint to be performant.
    """
    client = service_account()

    job_body = {
        "name": f"setfacl-project-{project_uuid.split('-')[0]}-{username}-{action}",
        "appId": "setfacl-corral-tg458981",
        "appVersion": "0.0.1",
        "description": "Add/Remove ACLs on a directory",
        "fileInputs": [],
        "parameterSet": {
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {"key": "username", "value": username},
                {
                    "key": "directory",
                    "value": f"/corral/projects/NHERI/projects/{project_uuid}",
                },
                {"key": "action", "value": action},
            ],
        },
        "tags": ["portalName:designsafe"],
    }
    res = client.jobs.submitJob(**job_body)
    return res


def create_workspace_dir(project_uuid: str) -> str:
    client = service_account()
    system_id = "designsafe.storage.projects"
    path = f"{project_uuid}"
    client.files.mkdir(systemId=system_id, path=path)
    return path


def create_workspace_system(client, project_uuid: str) -> str:
    system_id = f"project-{project_uuid}"
    system_args = {
        "id": system_id,
        "host": "cloud.corral.tacc.utexas.edu",
        "port": 22,
        "systemType": "LINUX",
        "defaultAuthnMethod": "PKI_KEYS",
        "canExec": False,
        "rootDir": f"/corral-repl/projects/NHERI/projects/{project_uuid}",
        "effectiveUserId": "tg458981",
        "authnCredential": {
            "privateKey": settings.PROJECT_STORAGE_SYSTEM_CREDENTIALS["privateKey"],
            "publicKey": settings.PROJECT_STORAGE_SYSTEM_CREDENTIALS["username"],
        },
    }

    client.systems.createSystem(**system_args)
    return system_id


def increment_workspace_count(force=None) -> int:
    client = service_account()
    root_sys = client.systems.getSystem(systemId="designsafe.storage.projects")
    new_count = int(root_sys.notes.count) + 1

    # Allow manual setting of the increment.
    if force:
        new_count = force

    client.systems.patchSystem(
        systemId="designsafe.storage.projects", notes={"count": new_count}
    )
    return new_count


##########################################
# HIGH-LEVEL OPERATIONS TIED TO API ROUTES
##########################################


def setup_project_file_system(project_uuid: str, users: list[str]):
    """
    Create a workspace system owned by user whose client is passed.
    """
    service_client = service_account()

    # Service client creates directory and gives owner write permissions
    create_workspace_dir(project_uuid)

    # User creates the system and adds their credential
    resp = create_workspace_system(service_client, project_uuid)

    for username in users:
        add_user_to_project_async.apply_async(args=[project_uuid, username])

    return resp


def add_user_to_project(project_uuid: str, username: str, set_acls=True):
    """
    Give a user POSIX and Tapis permissions on a workspace system.
    """
    service_client = service_account()
    system_id = f"project-{project_uuid}"
    logger.debug("Adding user %s to system %s", username, system_id)
    if set_acls:
        job_res = submit_workspace_acls_job(username, project_uuid, action="add")
        logger.debug(
            "Submitted workspace ACL job %s with UUID %s", job_res.name, job_res.uuid
        )
    service_client.systems.shareSystem(systemId=system_id, users=[username])
    set_workspace_permissions(service_client, username, system_id, role="writer")

    return project_uuid


def remove_user_from_project(project_uuid: str, username: str):
    """
    Unshare the system and remove all permissions and credentials.
    """
    service_client = service_account()
    system_id = f"project-{project_uuid}"
    logger.debug("Removing user %s from system %s", username, system_id)
    job_res = submit_workspace_acls_job(username, project_uuid, action="remove")
    logger.debug(
        "Submitted workspace ACL job %s with UUID %s", job_res.name, job_res.uuid
    )

    service_client.systems.unShareSystem(systemId=system_id, users=[username])
    service_client.systems.revokeUserPerms(
        systemId=system_id, userName=username, permissions=["READ", "MODIFY", "EXECUTE"]
    )
    service_client.files.deletePermissions(
        systemId=system_id, username=username, path="/"
    )

    return project_uuid


##########################################
# ASYNC TASKS FOR USER ADDITION/REMOVAL
##########################################


@shared_task(bind=True)
def add_user_to_project_async(self, project_uuid: str, username: str):
    """Async wrapper around add_user_to_project"""
    add_user_to_project(project_uuid, username)


@shared_task(bind=True)
def remove_user_from_project_async(self, project_uuid: str, username: str):
    """Async wrapper around remove_user_from_project"""
    remove_user_from_project(project_uuid, username)
