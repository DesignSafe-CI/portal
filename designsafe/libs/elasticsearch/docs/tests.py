from mock import Mock, patch, MagicMock, PropertyMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
import datetime
from elasticsearch_dsl import Q
from unittest import skip
from designsafe.libs.elasticsearch.docs.files import BaseESFile
from designsafe.apps.data.models.elasticsearch import IndexedFile
from designsafe.libs.elasticsearch.docs.base import BaseESResource
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound
from elasticsearch.exceptions import TransportError


class TestBaseESFile(TestCase):
    def setUp(self):

        self.patch_base_init = patch(
            "designsafe.libs.elasticsearch.docs.files.BaseESResource.__init__"
        )
        self.mock_base_init = self.patch_base_init.start()

        self.patch_base_setattr = patch(
            "designsafe.libs.elasticsearch.docs.files.BaseESResource.__setattr__"
        )
        self.mock_base_setattr = self.patch_base_setattr.start()

        self.patch_base_getattr = patch(
            "designsafe.libs.elasticsearch.docs.files.BaseESResource.__getattr__"
        )
        self.mock_base_getattr = self.patch_base_getattr.start()

        self.patch_base_update = patch(
            "designsafe.libs.elasticsearch.docs.files.BaseESResource.update"
        )
        self.mock_base_update = self.patch_base_update.start()

        self.addCleanup(self.patch_base_init.stop)
        self.addCleanup(self.patch_base_setattr.stop)
        self.addCleanup(self.patch_base_getattr.stop)
        self.addCleanup(self.patch_base_update.stop)

    def test_class_init_with_wrap(self):
        wd = IndexedFile(
            **{"name": "file1", "system": "test.system", "path": "/path/to/file"}
        )
        base = BaseESFile("test_user", wrapped_doc=wd)
        self.mock_base_init.assert_called_with(wd)

        self.mock_base_setattr.assert_has_calls(
            [call("username", "test_user"), call("_reindex", False)]
        )

    @patch("designsafe.libs.elasticsearch.docs.files.BaseESFile._populate")
    def test_class_init_no_wrap(self, mock_populate):
        base = BaseESFile("test_user", system="test.system", wrapped_doc=None)
        self.mock_base_init.assert_called_with(None)

        mock_populate.assert_called_with("test.system", "/")

        self.mock_base_setattr.assert_has_calls(
            [call("username", "test_user"), call("_reindex", False)]
        )

    @patch("designsafe.libs.elasticsearch.docs.files.BaseESFile._index_cls")
    def test_populate_if_doc_exists(self, mock_index):
        base = BaseESFile("test_user", system="test.system", wrapped_doc=None)
        mock_index().from_path.assert_called_with("test.system", "/")

    @patch("designsafe.libs.elasticsearch.docs.files.BaseESFile._index_cls")
    def test_populate_if_no_doc_exists(self, mock_index):
        mock_index.return_value.from_path.side_effect = DocumentNotFound
        base = BaseESFile("test_user", system="test.system", wrapped_doc=None)
        mock_index().assert_called_with(system="test.system", path="/")

    def test_indexed_file_class_getter(self):
        index_cls_1 = BaseESFile._index_cls(False)
        self.assertEqual(index_cls_1, IndexedFile)

    @patch("designsafe.libs.elasticsearch.docs.files.BaseESFile._index_cls")
    def test_children_function(self, mock_index):
        child_doc1 = IndexedFile(
            **{"name": "child1", "system": "test.system", "path": "/path/to/child1"}
        )
        child_doc2 = IndexedFile(
            **{"name": "child2", "system": "test.system", "path": "/path/to/child2"}
        )

        mock_index.return_value.children.side_effect = [
            ([child_doc1], "KEY1"),
            ([child_doc2], "KEY2"),
            ([], None),
        ]

        wrapped_doc = IndexedFile(
            **{"name": "file1", "system": "test.system", "path": "/path/to/file"}
        )
        base = BaseESFile("test_user", system="test.system", wrapped_doc=wrapped_doc)

        # Need to set attrs manually because the custom setter/getter in BaseESResource are mocked

        object.__setattr__(base, "username", "test_user")
        object.__setattr__(base, "_reindex", False)
        object.__setattr__(base, "system", "test.system")
        object.__setattr__(base, "path", "/path/to/file")

        child_generator = base.children(limit=1)
        for child in child_generator:
            continue

        mock_index().children.assert_has_calls(
            [
                call("test_user", "test.system", "/path/to/file", limit=1),
                call(
                    "test_user",
                    "test.system",
                    "/path/to/file",
                    limit=1,
                    search_after="KEY1",
                ),
                call(
                    "test_user",
                    "test.system",
                    "/path/to/file",
                    limit=1,
                    search_after="KEY2",
                ),
            ]
        )

        # Check that iteration ends after all children have been listed.
        self.assertRaises(StopIteration, child_generator.__next__)

    @patch("designsafe.apps.data.models.elasticsearch.IndexedFile.save")
    def test_save(self, mock_save):
        wrapped_doc = IndexedFile(
            **{"name": "file1", "system": "test.system", "path": "/path/to/file"}
        )
        base = BaseESFile("test_user", system="test.system", wrapped_doc=wrapped_doc)

        # Need to set attrs manually because the custom setter/getter in BaseESResource are mocked
        object.__setattr__(base, "path", "/path/to/file")
        object.__setattr__(base, "_wrapped", wrapped_doc)

        base.save()
        # self.mock_base_update.assert_called_with(**{'basePath': '/path/to'})
        mock_save.assert_called_with()

    @patch("designsafe.apps.data.models.elasticsearch.IndexedFile.delete")
    def test_delete_no_dir(self, mock_delete):
        wrapped_doc = IndexedFile(
            **{
                "name": "file1",
                "system": "test.system",
                "path": "/path/to/file",
                "format": "file",
            }
        )
        base = BaseESFile("test_user", system="test.system", wrapped_doc=wrapped_doc)

        object.__setattr__(base, "_wrapped", wrapped_doc)

        base.delete()
        mock_delete.assert_called_with()

    @patch("designsafe.apps.data.models.elasticsearch.IndexedFile.delete")
    @patch("designsafe.libs.elasticsearch.docs.files.BaseESFile.children")
    def test_delete_recursive(self, mock_children, mock_delete):
        wrapped_doc = IndexedFile(
            **{
                "name": "folder1",
                "system": "test.system",
                "path": "/path/to/folder",
                "format": "folder",
            }
        )
        base = BaseESFile("test_user", system="test.system", wrapped_doc=wrapped_doc)
        object.__setattr__(base, "_wrapped", wrapped_doc)
        object.__setattr__(base, "format", "folder")
        object.__setattr__(base, "path", "/path/to/folder")

        child_doc = IndexedFile(
            **{
                "name": "child1",
                "system": "test.system",
                "path": "/path/to/child1",
                "format": "file",
            }
        )
        base_child = BaseESFile(
            "test_user", system="test.system", wrapped_doc=child_doc
        )
        object.__setattr__(base_child, "_wrapped", child_doc)
        object.__setattr__(base_child, "format", "file")
        object.__setattr__(base_child, "path", "/path/to/child1")

        mock_children.return_value = iter([base_child])

        base.delete()
        # Assert 2 delete calls: 1 for parent, 1 for child
        self.assertEqual(mock_delete.call_count, 2)


class TestBaseESResource(TestCase):
    @patch("designsafe.libs.elasticsearch.docs.base.BaseESResource._wrap")
    def test_init(self, mock_wrap):
        wrapped_doc = IndexedFile(
            **{
                "name": "folder1",
                "system": "test.system",
                "path": "/path/to/folder",
                "format": "folder",
            }
        )

        BaseESResource(wrapped_doc=wrapped_doc)
        mock_wrap.assert_called_with(wrapped_doc)

    def test_getter_and_setter(self):
        wrapped_doc = IndexedFile(
            **{
                "name": "folder1",
                "system": "test.system",
                "path": "/path/to/folder",
                "format": "folder",
            }
        )
        base = BaseESResource(wrapped_doc=wrapped_doc)

        base.name = "folder2"
        self.assertEqual(base.name, "folder2")
        self.assertEqual(base._wrapped.name, "folder2")

        base.newAttr = "this attr is not in the wrapped doc"
        self.assertEqual(base.newAttr, "this attr is not in the wrapped doc")
        self.assertFalse(hasattr(base._wrapped, "newAttr"))

    @patch("designsafe.apps.data.models.elasticsearch.IndexedFile.update")
    def test_wrap(self, mock_update):
        wrapped_doc = IndexedFile(
            **{
                "name": "folder1",
                "system": "test.system",
                "path": "/path/to/folder",
                "format": "folder",
            }
        )
        base = BaseESResource(wrapped_doc=wrapped_doc)
        self.assertEqual(base._wrapped, wrapped_doc)

        base_with_kwargs = BaseESResource(
            wrapped_doc=wrapped_doc, **{"name": "folder2"}
        )
        mock_update.assert_called_with(**{"name": "folder2"})

    @patch("designsafe.apps.data.models.elasticsearch.IndexedFile.update")
    def test_update(self, mock_update):
        wrapped_doc = IndexedFile(
            **{
                "name": "folder1",
                "system": "test.system",
                "path": "/path/to/folder",
                "format": "folder",
            }
        )
        base = BaseESResource(wrapped_doc=wrapped_doc)
        base.update(**{"name": "folder2"})
        mock_update.assert_called_with(**{"name": "folder2"})

    @patch("designsafe.apps.data.models.elasticsearch.IndexedFile.to_dict")
    def test_to_dict(self, mock_to_dict):
        wrapped_doc = IndexedFile(
            **{
                "name": "folder1",
                "system": "test.system",
                "path": "/path/to/folder",
                "format": "folder",
            }
        )
        base = BaseESResource(wrapped_doc=wrapped_doc)

        base.to_dict()
        mock_to_dict.assert_called_with()


class TestIndexedFile(TestCase):

    def setUp(self):
        self.depth = 1

    @patch("designsafe.apps.data.models.elasticsearch.Document.save")
    def test_save(self, mock_save):
        doc = IndexedFile()
        doc.save()
        mock_save.assert_called_once()

    @patch("designsafe.apps.data.models.elasticsearch.Document.update")
    def test_update(self, mock_update):
        doc = IndexedFile()
        doc.update()
        mock_update.assert_called_once()

    @patch("designsafe.apps.data.models.elasticsearch.Document.get")
    def test_from_path(self, mock_get):
        IndexedFile.from_path("test.system", "/path/to/file")
        mock_get.assert_called_once_with(
            "c7765edebe9d7b715865b83a8319703975680be5a3f5f77503bdc47e7978429c"
        )

    @patch("designsafe.apps.data.models.elasticsearch.Document.search")
    @patch("designsafe.apps.data.models.elasticsearch.Document.get")
    def test_children(self, mock_get, mock_search):
        res1 = MagicMock()
        res1.meta.id = "id1"

        def scan_side_effect():
            yield res1

        mock_search().filter().filter().scan.side_effect = scan_side_effect

        doc = IndexedFile(system="test.system", path="/test/path")
        children = doc.children()
        next(children)
        mock_get.assert_called_once_with("id1")

    @patch("designsafe.apps.data.models.elasticsearch.IndexedFile.children")
    @patch("designsafe.apps.data.models.elasticsearch.Document.delete")
    def test_delete(self, mock_delete, mock_children):
        child = IndexedFile()

        # Return children only on the first call to prevent infinite recursion
        def children_side_effect():
            if self.depth > 0:
                self.depth -= 1
                yield child
            else:
                return

        mock_children.side_effect = children_side_effect

        parent = IndexedFile()
        parent.delete_recursive()

        self.assertEqual(mock_delete.call_count, 2)
