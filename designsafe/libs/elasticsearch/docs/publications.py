"""
.. module: portal.libs.elasticsearch.docs.files
   :synopsis: Wrapper classes for ES ``files`` doc type.
"""
from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import os
import zipfile
from django.conf import settings
from designsafe.apps.data.models.elasticsearch import IndexedFile, IndexedPublication
from designsafe.libs.elasticsearch.docs.base import BaseESResource
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound
from django.contrib.auth import get_user_model

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class BaseESPublication(BaseESResource):
    """Wrapper class for Elastic Search indexed publication.

    .. rubric:: Rationale

    This wrapper class is needed in order to separate concerns.
    Any thing specific to Elastic Search must live in
    :mod:`libs.elasticsearch.docs.base` and any logic needed
    to manipulate data must live here.
    Also, by manipulating data outside a ``DocType`` subclass
    we avoid the use of ``AttrDict`` and ``AttrList``.

    """
    def __init__(self, wrapped_doc=None, project_id=None, **kwargs):
        """Elastic Search File representation.

        This class directly wraps an Agave indexed file.

        """
        super(BaseESPublication, self).__init__(wrapped_doc, **kwargs)

        if not wrapped_doc:
            self._populate(project_id, **kwargs)

    def _populate(self, project_id, **kwargs):

        try:
            wrapped_doc = self._index_cls.from_id(project_id)
            self._wrap(wrapped_doc, **kwargs)
        except DocumentNotFound:
            self._wrapped = self._index_cls(project_id=project_id,
                                            **dict(kwargs))
    @property
    def _index_cls(self):
        return IndexedPublication


    def save(self, using=None, index=None, validate=True, **kwargs):
        """Save document
        """
        self._wrapped.save()

    def delete(self):
        self._wrapped.delete()

    def to_file(self):
        dict_obj = {'agavePath': 'agave://designsafe.storage.published/{}'.\
                                 format(self.project.value.projectId),
                     'children': [],
                     'deleted': False,
                     'format': 'folder',
                     'length': 24731027,
                     'meta': {
                         'title': self.project['value']['title'],
                         'pi': self.project['value']['pi'],
                         'dateOfPublication': self.created,
                         'type': self.project['value']['projectType'],
                         'projectId': self.project['value']['projectId'],
                         'keywords': self.project['value']['keywords'],
                         'description': self.project['value']['description']
                         },
                     'name': self.project.value.projectId,
                     'path': '/{}'.format(self.project.value.projectId),
                     'permissions': 'READ',
                     'project': self.project.value.projectId,
                     'system': 'designsafe.storage.published',
                     'systemId': 'designsafe.storage.published',
                     'type': 'dir',
                     'version': getattr(self, 'version', 1)}
        pi = self.project['value']['pi']
        pi_user = filter(lambda x: x['username'] == pi, getattr(self, 'users', []))
        if pi_user:
            pi_user = pi_user[0]
            dict_obj['meta']['piLabel'] = '{last_name}, {first_name}'.format(
                last_name=pi_user['last_name'], first_name=pi_user['first_name'])
        else:
            try:
                pi_user = get_user_model().objects.get(username=pi)
                dict_obj['meta']['piLabel'] = '{last_name}, {first_name}'.format(
                    last_name=pi_user.last_name, first_name=pi_user.first_name)
            except:
                dict_obj['meta']['piLabel'] = '({pi})'.format(pi=pi)
        return dict_obj

    def related_file_paths(self):
        dict_obj = self._wrapped.to_dict()
        related_objs = []
        if dict_obj['project']['value']['projectType'] == 'experimental':
            related_objs = (
                dict_obj.get('modelConfigs', []) +
                dict_obj.get('analysisList', []) +
                dict_obj.get('sensorLists', []) +
                dict_obj.get('eventsList', []) +
                dict_obj.get('reportsList', [])
            )
        elif dict_obj['project']['value']['projectType'] == 'simulation':
            related_objs = (
                dict_obj.get('models', []) +
                dict_obj.get('inputs', []) +
                dict_obj.get('outputs', []) +
                dict_obj.get('analysiss', []) +
                dict_obj.get('reports', [])
            )
        elif dict_obj['project']['value']['projectType'] == 'hybrid_simulation':
            related_objs = (
                dict_obj.get('global_models', []) +
                dict_obj.get('coordinators', []) +
                dict_obj.get('sim_substructures', []) +
                dict_obj.get('exp_substructures', []) +
                dict_obj.get('coordinator_outputs', []) +
                dict_obj.get('sim_outputs', []) +
                dict_obj.get('exp_outputs', []) +
                dict_obj.get('reports', []) +
                dict_obj.get('analysiss', [])
            )

        file_paths = []
        proj_sys = 'project-{}'.format(dict_obj['project']['uuid'])
        for obj in related_objs:
            for file_dict in obj['fileObjs']:
                file_paths.append(file_dict['path'])

        return file_paths

    def archive(self):
        archive_name = '{}_archive.zip'.format(self.projectId)
        pub_dir = '/corral-repl/tacc/NHERI/published/'
        arc_dir = os.path.join(pub_dir, 'archives/')

        def set_perms(dir, octal, subdir=None):
            try:
                os.chmod(dir, octal)
                if subdir:
                    if not os.path.isdir(subdir):
                        raise Exception('subdirectory does not exist!')
                    for root, dirs, files in os.walk(subdir):
                        os.chmod(root, octal)
                        for d in dirs:
                            os.chmod(os.path.join(root, d), octal)
                        for f in files:
                            os.chmod(os.path.join(root, f), octal)
            except Exception as e:
                logger.exception("Failed to set permissions for {}".format(dir))
                os.chmod(dir, 0555)

        def create_archive():
            arc_source = os.path.join(pub_dir, self.projectId)
            archive_path = os.path.join(arc_dir, archive_name)

            try:
                logger.debug("Creating archive for {}".format(self.projectId))

                zf = zipfile.ZipFile(archive_path, mode='w', allowZip64=True)
                for dirs, _, files in os.walk(arc_source):
                    for f in files:
                        if f == archive_name:
                            continue
                        zf.write(os.path.join(dirs, f), os.path.join(dirs.replace(pub_dir,''), f))
                zf.close()
            except Exception as e:
                logger.exception("Archive creation failed for {}".format(arc_source))
            finally:
                set_perms(pub_dir, 0555, arc_source)
                set_perms(arc_dir, 0555)

        try:
            set_perms(pub_dir, 0755, os.path.join(pub_dir, self.projectId))
            set_perms(arc_dir, 0755)
            create_archive()
        except Exception as e:
            logger.exception('Failed to archive publication!')