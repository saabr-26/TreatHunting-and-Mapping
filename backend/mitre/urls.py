from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"techniques", views.MITRETechniqueViewSet, basename="technique")

urlpatterns = [
    path("", include(router.urls)),
    path("summary/", views.mitre_summary, name="mitre_summary"),
]
