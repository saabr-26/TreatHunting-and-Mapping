"""
Threat Hunting Platform — URL Configuration

All API endpoints are namespaced under /api/.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # JWT Authentication
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # App APIs
    path("api/", include("api.urls")),
    path("api/investigations/", include("investigations.urls")),
    path("api/detections/", include("detections.urls")),
    path("api/mitre/", include("mitre.urls")),
    path("api/reports/", include("reports.urls")),
]
