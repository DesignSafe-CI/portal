from elasticsearch import TransportError, ConnectionTimeout

class BaseSearchManager(object):
    """ Wraps elastic search result object

        This class wraps the elasticsearch result object
        to add extra functionality"""

    def __init__(self, doc_class, search, page_size=100):
        self._doc_class = doc_class
        self._search = search
        self._page_size = page_size

    def count(self):
        return self._search.count()

    def source(self, **kwargs):
        self._search = self._search.source(**kwargs)
        return self._search

    def filter(self, *args, **kwargs):
        self._search = self._search.filter(*args, **kwargs)
        return self._search

    def query(self, *args, **kwargs):
        self._search = self._search.query(*args, **kwargs)
        return self._search

    def sort(self, *keys):
        self._search = self._search.sort(*keys)
        return self._search

    def extra(self, *args, **kwargs):
        self._search = self._search.extra(*args, **kwargs)
        return self._search

    def highlight(self, *args, **kwargs):
        self._search = self._search.highlight(*args, **kwargs)
        return self._search

    def execute(self):
        try:
            res = self._search.execute()
        except (TransportError, ConnectionTimeout) as err:
            if getattr(err, 'status_code', 500) == 404:
                raise
            res = self._search.execute()

        return res

    def all(self):
        res = self._search.execute()
        if res.success() and res.hits.total:
            res_offset = 0
            page_size = len(res)
            res_limit = page_size
            while res_limit <= res.hits.total:
                for doc in self._search[res_offset:res_limit]:
                    yield self._doc_class(doc)

                res_limit += page_size
                res_offset += page_size

            res_limit = res.hits.total - \
                ((res.hits.total / page_size) * page_size)
            if res_limit > 0:
                res_offset -= page_size
                res_limit += res_offset
                for doc in self._search[res_offset:res_limit]:
                    yield self._doc_class(doc)

    def results(self, offset):
        res = self._search.execute()
        limit = offset + self._page_size
        if res.hits.total < limit:
            limit = res.hits.total

        if offset > limit:
            offset = 0
            limit = 0

        for doc in self._search[offset:limit]:
            yield self._doc_class(doc)

    def __iter__(self):
        for doc in self._search.execute():
            yield self._doc_class(doc)

    def scan(self):
        self._search.execute()
        for doc in self._search.scan():
            yield self._doc_class(doc)

    def __getitem__(self, index):
        return self._search.__getitem__(index)

    def __getattr__(self, name):
        search = self._search
        val = getattr(search, name, None)
        if val:
            return val
        else:
            raise AttributeError(
                '\'PublicSearchManager\' has no attribute \'{}\''.format(name))
