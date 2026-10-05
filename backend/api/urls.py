"""
Core API URL routing.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Health check (public — no auth needed)
    path("health/", views.health_check, name="health_check"),

    # Dashboard (requires auth)
    path("dashboard/", views.dashboard, name="dashboard"),

    # Search (requires auth)
    path("search/", views.search_events, name="search_events"),

    # Correlation (requires auth)
    path("correlate/", views.correlate_events, name="correlate_events"),

    # Host investigation
    path("hosts/<str:hostname>/events/", views.events_by_host, name="events_by_host"),
    path("hosts/<str:hostname>/processes/", views.process_tree, name="process_tree"),

    # User investigation
    path("users/<str:username>/events/", views.events_by_user, name="events_by_user"),

    # Current user info
    path("auth/me/", views.current_user, name="current_user"),
]
