""" Base classes to handle agave metadata objects """
import inspect
import six
import json
import re
import logging
import datetime

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
        self._query = query

    def __call__(self, agave_client):
        metas = agave_client.meta.listMetadata(q=json.dumps(self.query))
        return  [self.rel_cls(**meta) for meta in metas]

    def add(self, uuid):
        self.uuids.append(uuid)

    @property
    def query(self):
        """JSON query to submit to agave metadata endpoint.

        This class represents both a forward-lookup field and a reverse-lookup field.
        There are two class attributes ``uuid`` and ``uuids`` (notice the 's').
        IF ``self.uuid`` has a valid value then it means this is a reverse-lookup field
        and we need to retrieve all the objects related to this object's specific UUID
        AND with a specific object name: ``{"name": "some.name", "associationIds": "UUID"}``.
        IF ``self.uuids`` has a valid value (it could be a string or an array of strings) means
        this is a forward-lookup field and we need to retrieve every object for every UUID
        in the ``self.uuids`` attribute: ``{"uuid": {"$in": ["UUID1", "UUID2"]}}``.

        ..todo:: This class should be separated in two classes, one for reverse-lookup fields
        and another one for forward-lookup fields. The reason why it was first implemented like this
        is because the implementation of a reverse-lookup field was not completely clear.
        This TODO is mainly for readability.
        """
        if self.uuid:
            self._query['associationIds'] = self.uuid
        elif self.uuids is not None:
            if isinstance(self.uuids, basestring):
                self.uuid = [self.uuids]
            elif len(self.uuids) == 0:
                return []

            self._query = {'uuid': {'$in': self.uuids}}
        else:
            raise ValueError('Cannot create query')

        return self._query

    def to_python(self, value):
        return list(set(self.uuids))

    def serialize(self, value):
        return self.to_python(value)

def register_lazy_rel(cls, field_name, related_obj_name, multiple, rel_cls):
    reg_key = '{}.{}'.format(cls.model_name, cls.__name__)
    LAZY_OPS.append((reg_key,
                      field_name,
                      RelatedQuery(related_obj_name=related_obj_name, rel_cls=rel_cls))
                    )

def set_lazy_rels():
    for lazy_args in LAZY_OPS:
        cls = REGISTRY[lazy_args[0]]
        #lazy_args[2].rel_cls = cls
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
        return self

    def get(self, agave_client, uuid):
        meta = agave_client.meta.getMetadata(uuid=uuid)
        self.set_client(agave_client)
        return self.model_cls(**meta)

    def list(self, agave_client, association_id=None):
        if association_id is None:
            metas = agave_client.meta.listMetadata(q=json.dumps({'name': self.model_cls.model_name}))
        else:
            metas = agave_client.meta.listMetadata(q=json.dumps({'name': self.model_cls.model_name,
                                                 'associationIds': association_id}))
        for meta in metas:
            yield self.model_cls(**meta)

class Links(object):
    def __init__(self, values):
        for attrname, val in six.iteritems(values):
            setattr(self, attrname, val)

class Options(object):
    """Options class to store model's _meta data
    """
    _model = None
    _schema_fields = ['uuid', 'schema_id', 'internal_username',
                      'association_ids', 'last_updated', 'created',
                      'owner', 'name', '_links']

    def __init__(self, model_name):
        self._nested_fields = {}
        self._related_fields = {}
        self._reverse_fields = []
        self._fields_map = {}
        self._fields = []
        self.name = model_name
        self.model_name = model_name
        self.model_manager = None

    def add_field(self, field):
        if field.nested_cls:
            self._nested_fields[field.attname] = field
        elif field.related:
            self._related_fields[field.attname] = field
        else:
            self._fields_map[field.attname] = field
        self._fields.append(field)

    def contribute_to_class(self, cls, name):
        cls._meta = self
        self._model = cls

class BaseModel(type):
    """
    Metaclass for metadata models
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
        if attrs.get('_is_nested', False):
            setattr(new_class, 'model_name', None)
        else:
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
    """Metadata model"""
    __metaclass__ = BaseModel

    def __init__(self, **kwargs):
        if not self._is_nested:
            self.schema_id = None
            self.internal_username = None
            self.last_updated = None
            self.created = None
            self.owner = None
            self.__links = None

        self._uuid = None
        self._association_ids = []
        self._permissions = None
        self.name = None
        self.parent = None
        #logger.debug('kwargs: %s', json.dumps(kwargs, indent=4))
        cls = self.__class__
        opts = self._meta
        #logger.debug('_is_nested: %s', self._is_nested) 
        self.update(**kwargs)

    def update(self, **kwargs):
        cls = self.__class__
        opts = self._meta
        _setattr = setattr
        if self._is_nested:
            obj_value = kwargs
        else:
            obj_value = kwargs.pop('value', {})
            links = kwargs.pop('_links', {})
            self._links = Links(links)
            for attrname, val in six.iteritems(kwargs):
                attrname = camelcase_to_spinal(attrname)
                setattr(self, attrname, val)

        for attrname, field in six.iteritems(opts._fields_map):
            _setattr(self, attrname, self._get_init_value(field, obj_value, attrname))

        for attrname, field in six.iteritems(opts._nested_fields):
            val = self._get_init_value(field, obj_value, attrname)
            nested_obj = field.nested_cls(**val)
            nested_obj.parent = self
            _setattr(self, attrname, nested_obj)

        for attrname, field in six.iteritems(opts._related_fields):
            value = self._get_init_value(field, obj_value, attrname)
            if not value and attrname.endswith('_UUID'):
                _attr = spinal_to_camelcase(attrname)
                _attr = ''.join([_attr[:-4], 'UUID'])
                value = obj_value.get(_attr, None) or value

            _setattr(self, attrname, RelatedQuery(uuids=value, rel_cls=field.related))

        for attrname in opts._reverse_fields:
            field = getattr(self, attrname)
            field.uuid = self.uuid
        
        if self.name is None:
            self.name = self._meta.model_name

        super(Model, self).__init__()
    
    def __getattribute__(self, name):
        opts = object.__getattribute__(self, '_meta')
        _cls = opts._fields_map.get(name, None)
        if _cls is not None and hasattr(_cls, 'to_python'):
            return _cls.to_python(object.__getattribute__(self, name))
        
        return object.__getattribute__(self, name)

    def _get_init_value(self, field, values, name):
        attrname = spinal_to_camelcase(name)
        return values.get(attrname, field.get_default())

    @property
    def uuid(self):
        if not self._uuid and self.parent:
            return self.parent.uuid

        return self._uuid

    @uuid.setter
    def uuid(self, val):
        if not self._uuid and self.parent:
            self.parent.uuid = val
        else:
            self._uuid = val

    @property
    def association_ids(self):
        if not self._association_ids and self.parent:
            return self.parent.association_ids

        return self._association_ids

    @association_ids.setter
    def association_ids(self, val):
        if not self._association_ids and self.parent:
            self.parent.association_ids = val
        else:
            self._association_ids = val

    @property
    def permissions(self):
        if not self._permissions:
            self._permissions = self.manager()\
                .agave_client.meta.listMetadataPermissions(uuid=self.uuid)
        return self._permissions

    @permissions.setter
    def permissions(self, val):
        pems = self.permissions
        if not val['permission'].get('read', False) and \
            not val['permission'].get('write', False) and \
            not val['permission'].get('execute', False):
            pems = filter(pems, lambda x: x['username'] == val['username'])
        
        else:
            pems.append(val)

        self._permissions = pems

    def permission(self, username):
        pems = self.permission
        pem = filter(pems, lambda x: x['username'] == username)
        if len(pem):
            return pem[0]['permission']
        else:
            return None
    
    def set_pem(self, username, pem):
        pem = self.manager().agave_client.meta.updateMetadataPermissions(
            uuid=self.uuid, body={'username': username, 'permission': pem})
        self.permissions = pem
        return self

    def to_dict(self):
        dict_obj = {}
        for attrname, value in six.iteritems(self._meta.__dict__):
            if not attrname.startswith('_'):
                dict_obj[attrname] = value

        dict_obj['_links'] = {}
        for attrname, value in six.iteritems(self._links.__dict__):
            dict_obj['_links'][attrname] = value

        dict_obj['value'] = {}
        for field in self._meta._fields:
            dict_obj['value'][field.attname] = getattr(self, field.attname)

        dict_obj.pop('model_manager', None)
        return dict_obj
    
    def to_body_dict(self):
        from designsafe.apps.data.models.agave.fields import ListField
        dict_obj = {}

        if not self._is_nested:
            for attrname in self._meta._schema_fields:
                value = getattr(self, attrname, None)
                if not inspect.isclass(value):
                    dict_obj[spinal_to_camelcase(attrname)] = value
            dict_obj['associationIds'] = list(set(self.association_ids))

            dict_obj['_links'] = {}
            for attrname, value in six.iteritems(self._links.__dict__):
                dict_obj['_links'][spinal_to_camelcase(attrname)] = value

        #dict_obj['value'] = {}
        value_dict = {}
        for field in self._meta._fields:
            value = getattr(self, field.attname)
            attrname = spinal_to_camelcase(field.attname)
            try:
                if isinstance(value, RelatedQuery):
                    value_dict[attrname] = value.serialize(value.uuids)
                else:
                    value_dict[attrname] = field.serialize(value)
            except AttributeError:
                try:
                    value_dict[attrname] = value.to_body_dict()
                except AttributeError:
                    value_dict[attrname] = value
        if not self._is_nested:
            dict_obj['value'] = value_dict
        else:
            dict_obj = value_dict

        dict_obj.pop('modelManager', None)
        dict_obj.pop('modelName', None)
        if ('created' in dict_obj and isinstance(dict_obj['created'], datetime.datetime)):
            dict_obj['created'] = dict_obj['created'].isoformat()

        if ('lastUpdated' in dict_obj and isinstance(dict_obj['lastUpdated'], datetime.datetime)):
            dict_obj['lastUpdated'] = dict_obj['lastUpdated'].isoformat()

        return dict_obj

    def save(self, agave_client):
        if self.parent:
            self.parent.save(agave_client)

        body = self.to_body_dict()
        body.pop('_relatedFields', None)
        if self.uuid is None:
            logger.debug('Adding Metadata: %s, with: %s', self.name, body)
            ret = agave_client.meta.addMetadata(body=body)
        else:
            logger.debug('Updating Metadata: %s, with: %s', self.uuid, body)
            ret = agave_client.meta.updateMetadata(uuid=self.uuid, body=body)
        self.update(**ret)
        return ret

    def associate(self, value):
        _aids = self.association_ids[:]
        if isinstance(value, basestring):
            _aids.append(value)
        else:
            _aids += value

        self.association_ids = list(set(_aids))
        return self.association_ids

    @classmethod
    def manager(cls):
        return cls._meta.model_manager

class BaseAgaveResource(object):
    """
    Base Class that all Agave API Resource objects inherit from.
    """

    def __init__(self, agave_client, **kwargs):
        """
        :param agave_client: agavepy.Agave instance this model will use
        """
        self._agave = agave_client
        self._wrapped = kwargs

    def to_dict(self):
        ret = self._wrapped
        if 'lastModified' in ret and isinstance(ret['lastModified'], datetime.datetime):
            ret['lastModified'] = ret['lastModified'].isoformat()
        return ret

    def __getattr__(self, name):
        # return name from _wrapped; _wrapped expects camelCased keys
        camel_name = spinal_to_camelcase(name)
        if camel_name in self._wrapped:
            return self._wrapped.get(camel_name)

        raise AttributeError('\'{0}\' has no attribute \'{1}\''.format(self.__class__.__name__, name))

    def __setattr__(self, name, value):
        if name != '_wrapped' and name != '_agave':
            camel_name = spinal_to_camelcase(name)
            if camel_name in self._wrapped:
                self._wrapped[camel_name] = value
                return

        super(BaseAgaveResource, self).__setattr__(name, value)
