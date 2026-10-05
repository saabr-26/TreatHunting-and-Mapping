"""
Core API views — dashboard stats, Splunk health, search proxy, and user info.

These views talk to SplunkService to get real data from Splunk.
"""

import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from splunk_app.service import SplunkService, SplunkConnectionError, SplunkAuthError, SplunkSearchError

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# HEALTH CHECK — Tests Splunk connectivity
# ------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/health/

    Tests:
    - Django backend is running
    - Splunk is reachable

    Returns 200 if everything is OK, 503 if Splunk is down.
    """
    result = {"backend": "running"}

    try:
        splunk = SplunkService()
        splunk_info = splunk.health_check()
        result["splunk"] = splunk_info
        result["status"] = "healthy"
        return Response(result, status=status.HTTP_200_OK)
    except SplunkConnectionError as e:
        result["splunk"] = {"status": "unavailable", "error": str(e)}
        result["status"] = "degraded"
        return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except SplunkAuthError as e:
        result["splunk"] = {"status": "auth_error", "error": str(e)}
        result["status"] = "degraded"
        return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# ------------------------------------------------------------------
# DASHBOARD — Real statistics from Splunk
# ------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """
    GET /api/dashboard/

    Returns KPI stats, events over time, top hosts, top users,
    auth summary, and top event codes — all from real Splunk data.

    Query params:
        earliest: Splunk time string (default: -24h)
        latest: Splunk time string (default: now)
    """
    earliest = request.query_params.get("earliest", "-24h")
    latest = request.query_params.get("latest", "now")

    try:
        splunk = SplunkService()

        data = {
            "stats": splunk.get_dashboard_stats(earliest, latest),
            "events_over_time": splunk.get_events_over_time("1h", earliest, latest),
            "top_hosts": splunk.get_top_hosts(10, earliest, latest),
            "top_users": splunk.get_top_users(10, earliest, latest),
            "top_event_codes": splunk.get_top_event_codes(10, earliest, latest),
            "auth_summary": splunk.get_auth_summary(earliest, latest),
        }

        return Response(data, status=status.HTTP_200_OK)

    except SplunkConnectionError as e:
        return Response(
            {"error": "Splunk connection unavailable. Check Splunk service and configuration.",
             "detail": str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except SplunkAuthError as e:
        return Response(
            {"error": "Splunk authentication failed.", "detail": str(e)},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except SplunkSearchError as e:
        return Response(
            {"error": "Splunk search error.", "detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ------------------------------------------------------------------
# SEARCH — Proxy SPL searches through Django
# ------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def search_events(request):
    """
    POST /api/search/

    Body:
        {
            "spl": "index=threathunt EventCode=4625",
            "earliest": "-24h",
            "latest": "now",
            "max_results": 500
        }

    Returns the Splunk search results as JSON.
    """
    spl = request.data.get("spl", "")
    earliest = request.data.get("earliest", "-24h")
    latest = request.data.get("latest", "now")
    max_results = request.data.get("max_results", 500)

    if not spl:
        return Response(
            {"error": "SPL query is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        splunk = SplunkService()
        results = splunk.execute_search(spl, earliest, latest, max_results)
        return Response({
            "query": spl,
            "result_count": len(results),
            "results": results,
        })
    except SplunkConnectionError as e:
        return Response(
            {"error": "Splunk connection unavailable.", "detail": str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except SplunkAuthError as e:
        return Response(
            {"error": "Splunk authentication failed.", "detail": str(e)},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    except SplunkSearchError as e:
        return Response(
            {"error": "Search error.", "detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ------------------------------------------------------------------
# EVENTS BY HOST
# ------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def events_by_host(request, hostname):
    """
    GET /api/hosts/<hostname>/events/

    Returns all events for a specific host from Splunk.
    """
    earliest = request.query_params.get("earliest", "-24h")
    latest = request.query_params.get("latest", "now")

    try:
        splunk = SplunkService()
        events = splunk.get_events_by_host(hostname, earliest, latest)
        return Response({
            "host": hostname,
            "event_count": len(events),
            "events": events,
        })
    except (SplunkConnectionError, SplunkAuthError, SplunkSearchError) as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# ------------------------------------------------------------------
# EVENTS BY USER
# ------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def events_by_user(request, username):
    """
    GET /api/users/<username>/events/

    Returns all events associated with a specific user from Splunk.
    """
    earliest = request.query_params.get("earliest", "-24h")
    latest = request.query_params.get("latest", "now")

    try:
        splunk = SplunkService()
        events = splunk.get_events_by_user(username, earliest, latest)
        return Response({
            "username": username,
            "event_count": len(events),
            "events": events,
        })
    except (SplunkConnectionError, SplunkAuthError, SplunkSearchError) as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# ------------------------------------------------------------------
# CORRELATED EVENTS
# ------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def correlate_events(request):
    """
    POST /api/correlate/

    Body:
        {
            "host": "WIN-SERVER-01",
            "username": "administrator",
            "pivot_time": "2024-01-15T10:23:00",
            "window_minutes": 30
        }

    Returns events correlated around a pivot event (same host/user/time window).
    """
    host = request.data.get("host", "")
    username = request.data.get("username")
    pivot_time = request.data.get("pivot_time")
    window_minutes = request.data.get("window_minutes", 30)

    if not host:
        return Response(
            {"error": "Host is required for correlation."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        splunk = SplunkService()
        events = splunk.get_correlated_events(
            host, username, pivot_time, window_minutes
        )
        return Response({
            "host": host,
            "username": username,
            "window_minutes": window_minutes,
            "event_count": len(events),
            "events": events,
        })
    except (SplunkConnectionError, SplunkAuthError, SplunkSearchError) as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# ------------------------------------------------------------------
# PROCESS TREE
# ------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def process_tree(request, hostname):
    """
    GET /api/hosts/<hostname>/processes/

    Returns process creation events for building a process tree visualization.
    """
    earliest = request.query_params.get("earliest", "-24h")
    latest = request.query_params.get("latest", "now")

    try:
        splunk = SplunkService()
        processes = splunk.get_process_tree(hostname, earliest, latest)
        return Response({
            "host": hostname,
            "process_count": len(processes),
            "processes": processes,
        })
    except (SplunkConnectionError, SplunkAuthError, SplunkSearchError) as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# ------------------------------------------------------------------
# USER INFO (current logged-in user)
# ------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    GET /api/auth/me/

    Returns info about the currently authenticated analyst.
    """
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_staff": user.is_staff,
    })
