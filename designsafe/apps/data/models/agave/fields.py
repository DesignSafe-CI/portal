""" Base field classes  """
import six
import datetime
import dateutil.parser
import collections
from decimal import Decimal
from designsafe.apps.data.models.agave.base import register_lazy_rel

import logging

logger = logging.getLogger(__name__)

class NOT_PROVIDED(object):
    pass

class BaseField(object):
    """ Base field class """
    related_model = None

    def __init__(self, verbose_name=None, name=None,
                 max_length=None, blank=False, null=False,
                 related=None, default=None, choices=None,
                 help_text='', validators=(), error_messages=None,
                 nested_cls=None, related_name=None, list_cls=None):
        self.verbose_name = verbose_name
        self.name = name
        self.max_length = max_length
        self.blank = blank
        self.null = null
        self.related = related
        self.default = default
        self.choices = choices
        self.help_text = help_text
        self.validators = validators
        self.error_messages = error_messages
        self.nested_cls = nested_cls
        self.attname = None
        self.related_name = related_name
        self.list_cls = list_cls
        
        if not isinstance(self.choices, collections.Iterator):
            self.choices = []
        else:
            self.choices = list( self.choices)

        if not self.name and self.verbose_name:
            self.name = self.verbose_name.lower()
            self.name = self.name.replace(' ', '_')

        self.choices = self.choices or []

    def contribute_to_class(self, cls, name):
        """ Register the field with the model class it belongs to. """
        if not self.name:
            self.name = name

        self.attname = name
        if self.verbose_name is None:
            self.verbose_name = name.replace('_', ' ')
        self.model = cls
        cls._meta.add_field(self)

    def get_default(self):
        if not isinstance(self.default, NOT_PROVIDED):
            return self.default
        else:
            raise ValueError('No default set')

    def to_python(self, value):
        return value

    def serialize(self, value):
        return value

    def clean(self, value):
            return self.to_python(value)            

class CharField(BaseField):
    """ Char Field """
    def __init__(self, *args, **kwargs):
        super(CharField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        return str(value)

    def serialize(self, value):
        return self.to_python(value)

class UuidField(CharField):
    """ Uuid Field """
    def __init__(self, *args, **kwargs):
        kwargs['schema_field'] = True
        super(UuidField, self).__init__(*args, **kwargs)

class DateTimeField(BaseField):
    """ Date Time Field """
    def __init__(self, *args, **kwargs):
        super(DateTimeField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        if not isinstance(value, datetime):
            return dateutil.parser.parse(value)

        return value

    def serialize(self, value):
        val = self.to_python(value)
        return val.isoformat()

class IntField(BaseField):
    """ Int Field """
    def __init__(self, *args, **kwargs):
        super(IntField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        return int(value)

    def serialize(self, value):
        return self.to_python(value)

class DecimalField(BaseField):
    """ Decimal Field """
    def __init__(self, *args, **kwargs):
        super(DecimalField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        return Decimal(value)

    def serialize(self, value):
        val = self.to_python(value)
        return str(val)

class ListField(BaseField):
    """ List Field """
    def __init__(self, verbose_name, list_cls=None, *args, **kwargs):
        kwargs['default'] = kwargs.get('default', [])
        kwargs['list_cls'] = list_cls
        kwargs['verbose_name'] = verbose_name
        super(ListField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        try:
            if self.list_cls is not None:
                return [val.to_body_dict() for val in value]
        except AttributeError:
            pass

        return list(value)

    def serialize(self, value):
        val = self.to_python(value)
        if not len(val):
            return val

        try:
            return list(set(val))
        except TypeError:
            #We cannot create a set out of this list.
            pass
        try:
            val_list = [o.to_body_dict() for o in val]
        except AttributeError:
            #objects do not have `to_body_dict` attribute
            val_list = val
        try:
            seen = set()
            resp = []
            for obj in val_list:
                _tuple = tuple(obj.items())
                if _tuple not in seen:
                    seen.add(_tuple)
                    resp.append(obj)
        except TypeError:
            #dict is a bit more complicated, let's just return it.
            resp = val_list

        return resp

class NestedObjectField(BaseField):
    """ Nested Object Field """
    def __init__(self, nested_cls, *args, **kwargs):
        kwargs['nested_cls'] = nested_cls
        kwargs['default'] = kwargs.get('default', {})
        super(NestedObjectField, self).__init__(*args, **kwargs)

    def serialize(self, value):
        return value.to_body_dict()

class RelatedObjectField(BaseField):
    """ Related Object Field """
    def __init__(self, related, multiple=False, related_name=None, *args, **kwargs):
        kwargs['related_name'] = related_name
        kwargs['related'] = related
        super(RelatedObjectField, self).__init__(*args, **kwargs)
        self.multiple = multiple

    def contribute_to_class(self, cls, name):
        """ Register the field with the model class it belongs to. """
        super(RelatedObjectField, self).contribute_to_class(cls, name)
        related_name = self.related_name or '%s_set' % cls.__name__.lower()
        register_lazy_rel(self.related, related_name, cls.model_name, self.multiple, cls)
