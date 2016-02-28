from django.core.management.base import BaseCommand, CommandError
from designsafe.libs.elasticsearch import api as documents
import json

class Command(BaseCommand):
    help = 'Reindexes documents in ES'

    def add_arguments(self, parser):
        parser.add_argument('document_type', type=str)
        parser.add_argument('query', type=str)

    def handle(self, *args, **options):
        cls = getattr(documents, options['document_type'])
        s = cls.search()
        s.update_from_dict(json.loads(options['query']))
        res, s = s.execute()
        cnt = 0
        while cnt <= res.hits.total - len(objs):
            for o in s[cnt:cnt+len(objs)]:
                o.save()
            cnt = cnt + len(objs)
