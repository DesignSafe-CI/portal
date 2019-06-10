from django.contrib import admin
from designsafe.apps.projects.models.categories import Category, CategoryOrder


class OrderInline(admin.TabularInline):
    model = CategoryOrder
    extra = 1
    min_num = 0
    readonly_fields = ('parent', )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Project Category Admin"""
    empty_value_display = '--'
    fields = ('uuid', )
    list_display = ('uuid', )
    search_fields = ('uuid', )
    readonly_fields = ('uuid', )
    inlines = [
        OrderInline,
    ]
