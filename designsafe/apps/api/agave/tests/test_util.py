from django.test import TestCase
from .. import to_camel_case


class MiscTests(TestCase):

    def test_to_camel_case(self):

        # test cases, first is expected output, second is input
        cases = (
            ('camelCase', 'camelCase'),
            ('_camelCase', '_camelCase'),
            ('snakeCase', 'snake_case'),
            ('_snakeCase', '_snake_case'),
            ('snakeCaseCase', 'snake_case_case'),
        )

        for case in cases:
            self.assertEqual(case[0], to_camel_case(case[1]))
