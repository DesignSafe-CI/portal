from django.urls import path
from .views import KeywordsView

urlpatterns = [
    path("", KeywordsView.as_view()),
]
