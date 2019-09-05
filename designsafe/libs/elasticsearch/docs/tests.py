from mock import Mock, patch, MagicMock, PropertyMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
import datetime
from designsafe.libs.elasticsearch.docs.files import BaseESFile
from designsafe.apps.data.models.elasticsearch import IndexedFile
from designsafe.libs.elasticsearch.docs.base import BaseESResource
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound
from elasticsearch.exceptions import TransportError

class TestBaseESFile(TestCase):
    def setUp(self):

        self.patch_base_init = patch(
            'designsafe.libs.elasticsearch.docs.files.BaseESResource.__init__')
        self.mock_base_init = self.patch_base_init.start()

        self.patch_base_setattr = patch(
            'designsafe.libs.elasticsearch.docs.files.BaseESResource.__setattr__')
        self.mock_base_setattr = self.patch_base_setattr.start()

        self.patch_base_getattr = patch(
            'designsafe.libs.elasticsearch.docs.files.BaseESResource.__getattr__')
        self.mock_base_getattr = self.patch_base_getattr.start()

        self.patch_base_update = patch(
            'designsafe.libs.elasticsearch.docs.files.BaseESResource.update')
        self.mock_base_update = self.patch_base_update.start()

        self.addCleanup(self.patch_base_init.stop)
        self.addCleanup(self.patch_base_setattr.stop)
        self.addCleanup(self.patch_base_getattr.stop)
        self.addCleanup(self.patch_base_update.stop)

    def test_class_init_with_wrap(self):
        wd = IndexedFile(
            **{'name': 'file1', 'system': 'test.system', 'path': '/path/to/file'})
        base = BaseESFile('test_user', wrapped_doc=wd)
        self.mock_base_init.assert_called_with(wd)

        self.mock_base_setattr.assert_has_calls([
            call('username', 'test_user'),
            call('_reindex', False)
        ])

    @patch('designsafe.libs.elasticsearch.docs.files.BaseESFile._populate')
    def test_class_init_no_wrap(self, mock_populate):
        base = BaseESFile('test_user', system='test.system', wrapped_doc=None)
        self.mock_base_init.assert_called_with(None)

        mock_populate.assert_called_with('test.system', '/')

        self.mock_base_setattr.assert_has_calls([
            call('username', 'test_user'),
            call('_reindex', False)
        ])

    @patch('designsafe.libs.elasticsearch.docs.files.BaseESFile._index_cls')
    def test_populate_if_doc_exists(self, mock_index):
        base = BaseESFile('test_user', system='test.system', wrapped_doc=None)
        mock_index().from_path.assert_called_with('test.system', '/')

    @patch('designsafe.libs.elasticsearch.docs.files.BaseESFile._index_cls')
    def test_populate_if_no_doc_exists(self, mock_index):
        mock_index.return_value.from_path.side_effect = DocumentNotFound
        base = BaseESFile('test_user', system='test.system', wrapped_doc=None)
        mock_index().assert_called_with(system='test.system', path='/')

    def test_indexed_file_class_getter(self):
        index_cls_1 = BaseESFile._index_cls(False)
        self.assertEqual(index_cls_1, IndexedFile)

    @patch('designsafe.libs.elasticsearch.docs.files.BaseESFile._index_cls')
    def test_children_function(self, mock_index):
        child_doc1 = IndexedFile(
            **{'name': 'child1', 'system': 'test.system', 'path': '/path/to/child1'})
        child_doc2 = IndexedFile(
            **{'name': 'child2', 'system': 'test.system', 'path': '/path/to/child2'})

        mock_index.return_value.children.side_effect = [
            ([child_doc1], 'KEY1'),
            ([child_doc2], 'KEY2'),
            ([], None)
        ]

        wrapped_doc = IndexedFile(
            **{'name': 'file1', 'system': 'test.system', 'path': '/path/to/file'})
        base = BaseESFile('test_user', system='test.system',
                          wrapped_doc=wrapped_doc)

        # Need to set attrs manually because the custom setter/getter in BaseESResource are mocked

        object.__setattr__(base, 'username', 'test_user')
        object.__setattr__(base, '_reindex', False)
        object.__setattr__(base, 'system', 'test.system')
        object.__setattr__(base, 'path', '/path/to/file')

        child_generator = base.children(limit=1)
        for child in child_generator:
            continue

        mock_index().children.assert_has_calls([
            call('test_user', 'test.system', '/path/to/file', limit=1),
            call('test_user', 'test.system', '/path/to/file', limit=1, search_after='KEY1'),
            call('test_user', 'test.system', '/path/to/file', limit=1, search_after='KEY2'),
        ])

        # Check that iteration ends after all children have been listed.
        self.assertRaises(StopIteration, child_generator.__next__)

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.save')
    def test_save(self, mock_save):
        wrapped_doc = IndexedFile(
            **{'name': 'file1', 'system': 'test.system', 'path': '/path/to/file'})
        base = BaseESFile('test_user', system='test.system',
                          wrapped_doc=wrapped_doc)

        # Need to set attrs manually because the custom setter/getter in BaseESResource are mocked
        object.__setattr__(base, 'path', '/path/to/file')
        object.__setattr__(base, '_wrapped', wrapped_doc)

        base.save()
        # self.mock_base_update.assert_called_with(**{'basePath': '/path/to'})
        mock_save.assert_called_with()

    
    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.delete')
    def test_delete_no_dir(self, mock_delete):
        wrapped_doc = IndexedFile(
            **{'name': 'file1', 'system': 'test.system', 'path': '/path/to/file', 'format': 'file'})
        base = BaseESFile('test_user', system='test.system',
                          wrapped_doc=wrapped_doc)

        object.__setattr__(base, '_wrapped', wrapped_doc)

        base.delete()
        mock_delete.assert_called_with()

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.delete')
    @patch('designsafe.libs.elasticsearch.docs.files.BaseESFile.children')
    def test_delete_recursive(self, mock_children, mock_delete):
        wrapped_doc = IndexedFile(
            **{'name': 'folder1', 'system': 'test.system', 'path': '/path/to/folder', 'format': 'folder'})
        base = BaseESFile('test_user', system='test.system',
                          wrapped_doc=wrapped_doc)
        object.__setattr__(base, '_wrapped', wrapped_doc)
        object.__setattr__(base, 'format', 'folder')

        child_doc = IndexedFile(
            **{'name': 'child1', 'system': 'test.system', 'path': '/path/to/child1', 'format': 'file'})
        base_child = BaseESFile('test_user', system='test.system',
                          wrapped_doc=child_doc)
        object.__setattr__(base_child, '_wrapped', child_doc)
        object.__setattr__(base_child, 'format', 'file')

        mock_children.return_value = iter( [base_child] )

        base.delete()
        # Assert 2 delete calls: 1 for parent, 1 for child
        self.assertEqual(mock_delete.call_count, 2)


class TestBaseESResource(TestCase):
    @patch('designsafe.libs.elasticsearch.docs.base.BaseESResource._wrap')
    def test_init(self, mock_wrap):
        wrapped_doc = IndexedFile(
            **{'name': 'folder1', 'system': 'test.system', 'path': '/path/to/folder', 'format': 'folder'})

        BaseESResource(wrapped_doc=wrapped_doc)
        mock_wrap.assert_called_with(wrapped_doc)

    def test_getter_and_setter(self):
        wrapped_doc = IndexedFile(
            **{'name': 'folder1', 'system': 'test.system', 'path': '/path/to/folder', 'format': 'folder'})
        base = BaseESResource(wrapped_doc=wrapped_doc)     

        base.name = 'folder2'
        self.assertEqual(base.name, 'folder2')
        self.assertEqual(base._wrapped.name, 'folder2')

        base.newAttr = 'this attr is not in the wrapped doc'
        self.assertEqual(base.newAttr, 'this attr is not in the wrapped doc')
        self.assertFalse(hasattr(base._wrapped, 'newAttr'))

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.update')
    def test_wrap(self, mock_update):
        wrapped_doc = IndexedFile(
            **{'name': 'folder1', 'system': 'test.system', 'path': '/path/to/folder', 'format': 'folder'})
        base = BaseESResource(wrapped_doc=wrapped_doc)
        self.assertEqual(base._wrapped, wrapped_doc)

        base_with_kwargs = BaseESResource(wrapped_doc=wrapped_doc, **{'name': 'folder2'}) 
        mock_update.assert_called_with(**{'name': 'folder2'})

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.update')
    def test_update(self, mock_update):
        wrapped_doc = IndexedFile(
            **{'name': 'folder1', 'system': 'test.system', 'path': '/path/to/folder', 'format': 'folder'})
        base = BaseESResource(wrapped_doc=wrapped_doc)
        base.update(**{'name': 'folder2'})
        mock_update.assert_called_with(**{'name': 'folder2'})

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.to_dict')
    def test_to_dict(self, mock_to_dict):
        wrapped_doc = IndexedFile(
            **{'name': 'folder1', 'system': 'test.system', 'path': '/path/to/folder', 'format': 'folder'})
        base = BaseESResource(wrapped_doc=wrapped_doc)   

        base.to_dict()
        mock_to_dict.assert_called_with()

class TestIndexedFile(TestCase):
    def test_attrs(self):
        f = IndexedFile()
        self.assertTrue(hasattr(f, 'name'))
        self.assertTrue(hasattr(f, 'path'))
        self.assertTrue(hasattr(f, 'lastModified'))
        self.assertTrue(hasattr(f, 'length'))
        self.assertTrue(hasattr(f, 'format'))
        self.assertTrue(hasattr(f, 'mimeType'))
        self.assertTrue(hasattr(f, 'type'))
        self.assertTrue(hasattr(f, 'system'))
        # self.assertTrue(hasattr(f, 'basePath'))
        # self.assertTrue(hasattr(f, 'lastUpdated'))
        # self.assertTrue(hasattr(f, 'pems'))

    @patch('designsafe.apps.data.models.elasticsearch.DocType.save')
    def test_save(self, mock_save):
        f = IndexedFile()
        f.save()
        mock_save.assert_called_with()

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.search')
    def test_from_path_with_404(self, mock_search):
        mock_search().filter().filter().execute.side_effect = TransportError(404)
        with self.assertRaises(TransportError):
            IndexedFile.from_path('test.system', '/')

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.search')
    def test_from_path_raises_when_no_hits(self, mock_search):
        mock_search().filter().filter().execute.return_value.hits.total = 0
        with self.assertRaises(DocumentNotFound):
            IndexedFile.from_path('test.system', '/')

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.search')
    def test_from_path_1_hit(self, mock_search):
        search_res = IndexedFile(
            **{'name': 'res1', 'system': 'test.system', 'path': '/path/to/res1'})

        mock_res = MagicMock()
        mock_res.hits.total = 1
        mock_res.__getitem__.return_value = search_res
        mock_search().filter().filter().execute.return_value = mock_res

        doc_from_path = IndexedFile.from_path('test.system', '/path/to/res1')

        
        mock_search().filter.assert_called_with('term', **{'system._exact': 'test.system'})
        mock_search().filter().filter.assert_called_with('term', **{'path._exact': '/path/to/res1'})

        self.assertEqual(doc_from_path, search_res)

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.delete')
    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.search')
    def test_from_path_multiple_hits(self, mock_search, mock_delete):
        """
        When there are multiple files sharing a system and path, ensure we delete
        all but one and return the remaining document.
        """
        search_res = IndexedFile(
            **{'name': 'res1', 'system': 'test.system', 'path': '/path/to/res1'})

        # Need to mock either slicing the result or retrieving a single element.
        def mock_getitem(i):
            if type(i) is slice:
                return [search_res, search_res]
            else:
                return search_res

        # mock a search result with 3 hits and the ability to get/slice.
        mock_res = MagicMock()
        mock_res.hits.total = 3
        mock_res.__getitem__.side_effect = mock_getitem
        mock_search().filter().filter().execute.return_value = mock_res

        doc_from_path = IndexedFile.from_path('test.system', '/path/to/res1')

        mock_search().filter.assert_called_with('term', **{'system._exact': 'test.system'})
        mock_search().filter().filter.assert_called_with('term', **{'path._exact': '/path/to/res1'})

        self.assertEqual(mock_delete.call_count, 2)
        self.assertEqual(doc_from_path, search_res)

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.search')
    def test_children_raises_on_404(self, mock_search):
        mock_search().filter().filter().sort().extra().execute.side_effect = TransportError(404)
        with self.assertRaises(TransportError):
            IndexedFile.children('test_user', system='test.system', path='/')

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.search')
    def test_children_returns_when_no_hits(self, mock_search):
        mock_search().filter().filter().sort().extra().execute.return_value.hits.__len__.return_value = 0
        children = IndexedFile.children('test_user', system='test.system', path='/')
        self.assertEqual(children, ([], None))

    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.get')
    @patch('designsafe.apps.data.models.elasticsearch.IndexedFile.search')
    def test_children_returns_when_hits(self, mock_search, mock_get):
        
        search_res = IndexedFile(
            **{'name': 'res1', 'system': 'test.system', 'path': '/path/to/res1'})

        search_res._id = 'MOCK ID'

        mock_search().filter().filter().sort().extra().execute.return_value.hits.__len__.return_value = 1
        mock_search().filter().filter().sort().extra().execute().__iter__.return_value = [search_res]
        mock_search().filter().filter().sort().extra().execute.return_value.hits.hits = [{'sort': 'MOCK SORTKEY'}]

        mock_get.return_value = search_res

        children = IndexedFile.children('test_user', system='test.system', path='/')
        mock_get.assert_called_with('MOCK ID')
        self.assertEqual(children, ([search_res], 'MOCK SORTKEY'))