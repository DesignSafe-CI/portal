from django.contrib import admin
from .models import Token


class TokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'nickname', 'token')
    exclude = ['token']

admin.site.register(Token, TokenAdmin)
