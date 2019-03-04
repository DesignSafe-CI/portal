"""Project Category models."""
import uuid
from django.db import models


class CategoryManager(models.Manager):
    """Category Manager"""
    def get_or_create_from_json(self, uuid, dict_obj):
        """Get or Create from JSON"""
        record = self.get_or_create(uuid=uuid)
        for order in dict_obj.get('orders', []):
            CategoryOrder.objects.get_or_create(
                category=record,
                parent=order['parent'],
                defaults={
                    'value': order['value'],
                }
            )
        return record


class Category(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    objects = CategoryManager()

    def to_dict(self):
        """To Dict."""
        dict_obj = {
            'uuid': self.uuid,
            'orders': [order.to_dict() for order in self.ui_orders],
        }


class CategoryOrder(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='ui_orders')
    parent = models.UUIDField(null=True, blank=True)
    value = models.PositiveIntegerField(default=0)

    def to_dict(self):
        """To Dict."""
        dict_obj = {
            'parent': self.parent,
            'value': self.value,
        }
