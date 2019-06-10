"""Project Category models."""
from django.db import models


class CategoryManager(models.Manager):
    """Category Manager"""
    def get_or_create_from_json(self, uuid, dict_obj):
        """Get or Create from JSON"""
        record, _ = self.get_or_create(uuid=uuid)
        for order in dict_obj.get('orders', []):
            order_record, created = CategoryOrder.objects.get_or_create(
                category=record,
                parent=order['parent'],
                defaults={
                    'value': order['value'],
                }
            )
            if not created:
                order_record.value = order['value']
                order_record.save()
        return record


class Category(models.Model):
    uuid = models.CharField(null=False, blank=False, editable=False, unique=True, max_length=255)
    objects = CategoryManager()

    def to_dict(self):
        """To Dict."""
        dict_obj = {
            'uuid': self.uuid,
            'orders': [order.to_dict() for order in self.ui_orders.all()],
        }
        return dict_obj

    def __str__(self):
        """Str -> self.uuid"""
        return self.uuid

    def __repr__(self):
        """Repr -> self.uuid"""
        return self.uuid

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'


class CategoryOrder(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='ui_orders')
    parent = models.CharField(null=True, blank=True, editable=False, max_length=255)
    value = models.PositiveIntegerField(default=0)

    def to_dict(self):
        """To Dict."""
        dict_obj = {
            'parent': self.parent,
            'value': self.value,
        }
        return dict_obj
