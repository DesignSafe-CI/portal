import logging


class BaseESResource(object):
    """Base class used to represent an Elastic Search resource.

    This class implements basic wrapping functionality.
    .. note::

        Params stored in ``_wrapped`` are made available as attributes
        of the class.
    """

    def __init__(self, wrapped_doc=None, **kwargs):
        self._wrap(wrapped_doc, **kwargs)

    def to_dict(self):
        """Return wrapped doc as dict"""
        return self._wrapped.to_dict()

    def _wrap(self, wrapped_doc, **kwargs):
        if wrapped_doc and kwargs:
            wrapped_doc.update(**kwargs)
        object.__setattr__(self, "_wrapped", wrapped_doc)

    def update(self, **kwargs):
        self._wrapped.update(**kwargs)

    def __getattr__(self, name):
        """Custom attribute getter"""
        _wrapped = object.__getattribute__(self, "_wrapped")
        if _wrapped and hasattr(_wrapped, name):
            return getattr(_wrapped, name)
        else:
            return object.__getattribute__(self, name)

    def __setattr__(self, name, value):
        _wrapped = object.__getattribute__(self, "_wrapped")
        if _wrapped and hasattr(_wrapped, name):
            setattr(self._wrapped, name, value)
            return
        else:
            object.__setattr__(self, name, value)
            return
