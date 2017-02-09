""" Base classes to handle agave metadata objects """
import inspect
import six
import json
import re
import logging

logger = logging.getLogger(__name__)

REGISTRY = {}
LAZY_OPS = []

class RelatedQuery(object):
    def __init__(self, uuid=None, uuids=None, related_obj_name=None, rel_cls=None):
        self.uuid = uuid
        self.uuids = uuids or []
        self.related_obj_name = related_obj_name
        self.rel_cls = rel_cls
        query = {'name': related_obj_name, 'associationIds': []}
        self.query = query

    def __call__(self, agave_client):
        if self.uuid:
            self.query['associationIds'] = [self.uuid]
        elif self.uuids is not None:
            if isinstance(self.uuids, basestring):
                self.uuids = [self.uuids]
            elif len(self.uuids) == 0:
                return []

            self.query = {'uuid': {'$in': self.uuids}}
        else:
            raise ValueError('Cannot create query')
        metas = agave_client.listMetadata(q=self.query)
        for meta in metas:
            yield self.rel_cls(**meta)

def register_lazy_rel(cls, field_name, related_obj_name, multiple):
    reg_key = '{}.{}'.format(cls.model_name, cls.__name__)
    LAZY_OPS.append((reg_key,
                      field_name,
                      RelatedQuery(related_obj_name=related_obj_name))
                    )

def set_lazy_rels():
    for lazy_args in LAZY_OPS:
        cls = REGISTRY[lazy_args[0]]
        lazy_args[2].rel_cls = cls
        cls._meta._reverse_fields.append(lazy_args[1])
        setattr(cls, lazy_args[1], lazy_args[2])

    del LAZY_OPS[:]

def register_class(cls, name, model_name):
    registry_key = '{}.{}'.format(model_name, name)
    if REGISTRY.get(registry_key) is None:
        REGISTRY[registry_key] = cls

def camelcase_to_spinal(string):
    rec = re.compile('([A-Z])+')
    return rec.sub(r'_\1', string).lower()

def spinal_to_camelcase(string):
    comps = string.split('_')
    if string.startswith('_'):
        comps = comps[1:]
        first = ''.join(['_', comps[0]])
    else:
        first = comps[0]
    camel = ''.join(x.capitalize() or '_' for x in comps[1:])
    camel = ''.join([first, camel])
    return camel

class Manager(object):
    def __init__(self, model_cls):
        self.model_cls = model_cls
        self.agave_client = None

    def set_client(self, agave_client):
        self.agave_client = agave_client
        setattr(self.model_cls._meta, 'agave_client', agave_client)

    def get(self, agave_client, uuid):
        meta = agave_client.getMetadata(uuid=uuid)
        return self.model_cls(**meta)

class Links(object):
    def __init__(self, values):
        for attrname, val in six.iteritems(values):
            setattr(self, attrname, val)

class Options(object):
    """Options class to store model's _meta data
    """

    def __init__(self, model_name):
        self._nested_fields = {}
        self._related_fields = {}
        self._reverse_fields = []
        self._fields_map = {}
        self._fields = []
        self._model = None
        self.name = model_name
        self.model_name = model_name
        self.uuid = None
        self.schema_id = None
        self.internal_username = None
        self.association_ids = []
        self.last_updated = None
        self.created = None
        self.owner = None
        self._links = None
        self.model_manager = None

    def add_field(self, field):
        if field.nested:
            self._nested_fields[field.attname] = field
        elif field.related:
            self._related_fields[field.attname] = field
        else:
            self._fields_map[field.attname] = field
        self._fields.append(field)

    def contribute_to_class(self, cls, name):
        cls._meta = self
        self._model = cls

    def _set_values(self, values):
        links = values.pop('_links')
        self._links = Links(links)
        for attrname, val in six.iteritems(values):
            attrname = camelcase_to_spinal(attrname)
            setattr(self, attrname, val)

class BaseModel(type):
    """
    Metaclass for models
    """
    def __new__(cls, name, bases, attrs):
        super_new = super(BaseModel, cls).__new__

        # Also ensure initialization is only performed for subclasses of Model
        # (excluding Model class itself).
        parents = [b for b in bases if isinstance(b, BaseModel)]
        if not parents:
            return super_new(cls, name, bases, attrs)

        module = attrs.pop('__module__')
        new_attrs = {'__module__': module}
        classcell = attrs.pop('__classcell__', None)
        if classcell is not None:
            new_attrs['__classcell__'] = classcell
        
        new_class = super_new(cls, name, bases, new_attrs)
        model_name = attrs.get('model_name')
        new_class.add_to_class('_meta', Options(model_name))
        setattr(new_class, 'model_name', model_name)
        setattr(new_class, '_is_nested', attrs.pop('_is_nested', False))

        for obj_name, obj in attrs.items():
            new_class.add_to_class(obj_name, obj)

        new_class._prepare()
        register_class(new_class, name, model_name)
        return new_class

    def add_to_class(cls, name, value):
        if not inspect.isclass(value) and hasattr(value, 'contribute_to_class'):
            value.contribute_to_class(cls, name)
        else:
            setattr(cls, name, value)

    def _prepare(cls):
        opts = cls._meta
        if cls.__doc__ is None:
            cls.__doc__ = "%s(%s)" % (cls.__name__, ", ".join(f.name for f in opts._fields))
            
            #if not opts.manager:
            #    if any(f.name == 'objects' for f in opts.fields):
            #        raise ValueError(
            #            "Model %s must specify a custom Manager, because it has a "
            #            "field name 'objects'." % cls.__name__
            #            )
            #    manager = Manager()
            #    manager.auto_created = True
            #    cls.add_to_class('objects', manager)
        if not opts.model_manager:
            setattr(cls._meta, 'model_manager', Manager(cls))

        if not isinstance(opts.model_manager, Manager):
            raise ValueError("Model Manager must be a Manager class.")


class Model(object):
    __metaclass__ = BaseModel

    def __init__(self, **kwargs):
        #logger.debug('kwargs: %s', json.dumps(kwargs, indent=4))
        cls = self.__class__
        opts = self._meta
        _setattr = setattr
        #logger.debug('_is_nested: %s', self._is_nested) 
        if self._is_nested:
            obj_value = kwargs
        else:
            obj_value = kwargs.pop('value', {})
            opts._set_values(kwargs)

        for attrname, field in six.iteritems(opts._fields_map):
            _setattr(self, attrname, self._get_init_value(field, obj_value, attrname))

        for attrname, field in six.iteritems(opts._nested_fields):
            val = self._get_init_value(field, obj_value, attrname)
            _setattr(self, attrname,
                     field.nested(**val))

        for attrname, field in six.iteritems(opts._related_fields):
            value = self._get_init_value(field, obj_value, attrname)
            if not value and attrname.endswith('_UUID'):
                _attr = spinal_to_camelcase(attrname)
                _attr = ''.join([_attr[:-4], 'UUID'])
                value = obj_value.get(_attr, None) or value

            _setattr(self, attrname, RelatedQuery(uuids=value, rel_cls=field.related))

        for attrname in opts._reverse_fields:
            field = getattr(self, attrname)
            field.uuid = self._meta.uuid

        super(Model, self).__init__()

    def _get_init_value(self, field, values, name):
        attrname = spinal_to_camelcase(name)
        return values.get(attrname, field.get_default())

    def to_dict(self):
        dict_obj = {}
        for attrname, value in six.iteritems(self._meta.__dict__):
            if not attrname.startswith('_'):
                dict_obj[attrname] = value

        dict_obj['_links'] = {}
        for attrname, value in six.iteritems(self._meta._links.__dict__):
            dict_obj['_links'][attrname] = value

        dict_obj['value'] = {}
        for field in self._meta._fields:
            dict_obj['value'][field.attname] = getattr(self, field.attname)

        dict_obj.pop('model_manager', None)
        return dict_obj
    
    def to_body_dict(self):
        dict_obj = {}
        for attrname, value in six.iteritems(self._meta.__dict__):
            if not attrname.startswith('_'):
                dict_obj[spinal_to_camelcase(attrname)] = value

        dict_obj['_links'] = {}
        for attrname, value in six.iteritems(self._meta._links.__dict__):
            dict_obj['_links'][spinal_to_camelcase(attrname)] = value

        dict_obj['value'] = {}
        for field in self._meta._fields:
            value = getattr(self, field.attname)
            attrname = spinal_to_camelcase(field.attname)
            if isinstance(value, RelatedQuery):
                value()
                dict_obj['value'][attrname] = value.uuids
            elif isinstance(value, Model):
                dict_obj['value'][attrname] = value.to_body_dict()
            else:
                dict_obj['value'][attrname] = value

        dict_obj.pop('modelManager', None)
        dict_obj.pop('modelName', None)
        return dict_obj
