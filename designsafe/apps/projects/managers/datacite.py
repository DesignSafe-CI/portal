"""Datacite utils.

.. module:: designsafe.apps.project.managers.datacite
    :synopsis: Python interface to Datacite's rest API.
        Visit: https://support.datacite.org/docs/api for more info.
"""
from __future__ import unicode_literals, absolute_import
import json
import logging
# from future.utils import python_2_unicode_compatible
from django.conf import settings
import requests
from requests import HTTPError

LOGGER = logging.getLogger(__name__)
DATACITE_USER = settings.DATACITE_USER
DATACITE_PASS = settings.DATACITE_PASS
DATACITE_URL = settings.DATACITE_URL
SHOULDER = getattr(settings, 'DATACITE_SHOULDER', '').strip('doi:')
DOIS_URL = '{base_url}/dois'.format(base_url=DATACITE_URL.strip('/'))


def get_doi(doi):
    """Retrieve a DOI from datacite.

    Response format: https://support.datacite.org/docs/api-get-doi

    :param str doi: DOI to retrieve.
    :return: Dictionary with DOI's data.
    :rtype: dict
    """
    res = requests.get(
        '{api_url}/{doi}'.format(api_url=DOIS_URL, doi=doi),
        auth=(DATACITE_USER, DATACITE_PASS),
    )
    res.raise_for_status()
    return res.json()


def create_or_update_doi(attributes=None, doi=None):
    """Create or updates a DOI.

    There are three main use cases for this function:
        1. The DOI's attributes and the DOI string is optional in this
            function. If no attributes or a doi are specified an empty
            doi will be created using the pre-configured prefix.
        2. If the attributes are specified but no doi is specified
            then an automatic DOI will be created with the given
            attributes using the pre-configured prefix.
        3. If a DOI is specified then the DOI's attributes will be
            updated. The given attributes will get merged with whatever
            is saved in Datacite. Meaning, there is no need to
            send all the values on every update and it's possible
            to do partial updates.
    Response format: https://support.datacite.org/docs/api-get-doi

    ..note::
        DOIs will always be created as drafts first. To publish them use
        :func:`publish_doi`.

    .. warning::
        Fields which value is a list will be overwritten if they are
        passed as :param:`attributes`. For instance, if the
        :param:`attributes` dictionary containes a `titles` value,
        and the stored DOI in Datacite already contains some titles
        then the new values will not be appended but will overwrite
        the stored values in Datacite.
        Meaning, to append a new value to a list field we have to
        retrieve the stored value, append it and then update the DOI
        data.

    :param dict attributes: Attributes to initialize DOI.
    :param str doi: Doi to create or update.
    :return: Dictionary with DOI's data.
    :rtype: dict
    """
    attributes = attributes or {}
    payload = {
        "data": {
            "type": "dois",
            "relationships": {
                "client": {
                    "data": {
                        "type": "clients",
                        "id": "tdl.tacc"
                    }
                }
            }
        }
    }
    if doi:
        doi_data = get_doi(doi)
        datacite_attrs = doi_data['data']['attributes']
        datacite_attrs.update(attributes)
        attributes = datacite_attrs
        http_verb = requests.put
        url = "{base_url}/{doi}".format(base_url=DOIS_URL, doi=doi)
        payload['data']['id'] = doi
        attributes.pop('prefix', None)
    else:
        attributes["prefix"] = SHOULDER
        http_verb = requests.post
        url = DOIS_URL

    # Remove non kernel-4 schema fields. We cannot update these fields.
    # These fields are part of the metadata handled by DataCite.
    # For more info:
    # https://schema.datacite.org/meta/kernel-4.3/example/datacite-example-full-v4.xml
    for field in ['xml', 'created', 'state', 'updated', 'suffix',
                  'container', 'metadataVersion', 'isActive',
                  'contentUrl', 'published']:
        attributes.pop(field, None)

    payload["data"]["attributes"] = attributes
    res = http_verb(
        url,
        auth=(DATACITE_USER, DATACITE_PASS),
        data=json.dumps(payload),
        headers={
            "Content-Type": "application/vnd.api+json"
        }
    )
    try:
        res.raise_for_status()
    except HTTPError as exc:
        LOGGER.exception(
            "Error creating or updating a DOI: (%s) - %s - %s: %s \n %s",
            exc.response.status_code,
            exc.request.method,
            exc.response.reason,
            exc.response.elapsed,
            exc.response.text
        )
        raise
    return res.json()


def publish_doi(doi):
    """Publish a DOI.

    This function will change a DOI from 'Draft' to 'Findable'.

    :param str doi: Doi to publish.
    """
    attributes = {'event': 'publish'}
    return create_or_update_doi(attributes, doi)


def register_doi(doi):
    """Register a DOI.

    This function will change a DOI from 'Draft' to 'Registered'.

    :param str doi: Doi to register.
    """
    attributes = {'event': 'register'}
    return create_or_update_doi(attributes, doi)


def hide_doi(doi):
    """Hide a DOI.

    This function will change a DOI from 'Findable' to 'Registered'.

    :param str doi: Doi to hide.
    """
    attributes = {'event': 'hide'}
    return create_or_update_doi(attributes, doi)


def delete_doi(doi):
    """Delete a DOI.

    .. warning:: Only 'Draft' DOIs can be deleted.

    :param str doi: DOI to delete.
    """
    res = requests.delete(
        "{base_url}/{doi}".format(base_url=DOIS_URL, doi=doi),
        auth=(DATACITE_USER, DATACITE_PASS)
    )
    res.raise_for_status()
    return res
