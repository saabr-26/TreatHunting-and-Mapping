from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"hunts", views.HuntQueryViewSet, basename="hunt")
router.register(r"rules", views.DetectionRuleViewSet, basename="rule")

urlpatterns = [
    path("", include(router.urls)),
]
