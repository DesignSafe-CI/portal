"""Publication file manager.

.. module:: portal.apps.api.agave.managers.publications
   :synopsis: Manager handling Publications searches.
"""


import logging
import datetime
from elasticsearch_dsl import Q, Search, Index
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication
from designsafe.libs.elasticsearch.docs.publication_legacy import BaseESPublicationLegacy
from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager


LOG = logging.getLogger(__name__)


class PublicationsManager(AgaveFileManager):
    """File manager for listing publications."""

    @property
    def requires_auth(self):
        """Whether it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return False

    def construct_query(self):  # pylint: disable=no-self-use
        """Construct ES query."""
        published_index_name = list(Index('des-publications').get_alias().keys())[0]
        legacy_index_name = list(Index('des-publications_legacy').get_alias().keys())[0]

        published_query = Q(
            'bool',
            must=[
                Q('bool', should=[
                    Q({'term': {'_index': published_index_name}}),
                    Q({'term': {'_index': legacy_index_name}})
                ])
            ],
            must_not=[
                Q('term', status='unpublished'),
                Q('term', status='publishing'),
                Q('term', status='saved')
            ]
        )

        return published_query

    def listing(self, system=None, file_path=None, offset=0, limit=100, **kwargs):
        """Wrap the search result in a BaseFile object for serializtion."""
        query = self.construct_query()
        listing_search = Search()
        listing_search = listing_search.query(query).sort(
            '_index',
            {'project._exact': {'order': 'asc', 'unmapped_type': 'keyword'}},
            {'created': {'order': 'desc', 'unmapped_type': 'long'}}
        )
        listing_search = listing_search.extra(from_=offset, size=limit)

        res = listing_search.execute()
        children = []
        for hit in res:
            try:
                getattr(hit, 'projectId')
                children.append(BaseESPublication(**hit.to_dict()).to_file())
            except AttributeError:
                children.append(BaseESPublicationLegacy(**hit.to_dict()).to_file())

        result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/',
            'system': system,
            'type': 'dir',
            'children': children,
            'permissions': 'READ'
        }
        return result

    def save_publication(
            self,
            publication,
            status='publishing'
    ):  # pylint: disable=no-self-use
        """Save publication."""
        publication['projectId'] = publication['project']['value']['projectId']
        publication['created'] = datetime.datetime.now().isoformat()
        publication['status'] = status
        publication['version'] = 2
        publication['licenses'] = publication.pop('license', [])
        publication['license'] = ''

        pub = BaseESPublication(project_id=publication['projectId'], **publication)
        pub.save()
        return pub
