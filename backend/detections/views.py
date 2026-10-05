"""
Detection views — Hunt queries and detection rules with Splunk execution.
"""

import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import HuntQuery, DetectionRule
from .serializers import HuntQuerySerializer, DetectionRuleSerializer
from splunk_app.service import (
    SplunkService,
    SplunkConnectionError,
    SplunkAuthError,
    SplunkSearchError,
)

logger = logging.getLogger(__name__)


class HuntQueryViewSet(viewsets.ModelViewSet):
    """
    CRUD + execute for threat hunting queries.

    List:    GET    /api/detections/hunts/
    Detail:  GET    /api/detections/hunts/{id}/
    Execute: POST   /api/detections/hunts/{id}/run/
    """

    queryset = HuntQuery.objects.filter(enabled=True)
    serializer_class = HuntQuerySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["category", "enabled"]
    search_fields = ["name", "description", "hypothesis"]

    @action(detail=True, methods=["post"], url_path="run")
    def run_hunt(self, request, pk=None):
        """
        POST /api/detections/hunts/{id}/run/

        Execute this hunt's SPL query against Splunk and return results.

        Optional body:
            {
                "earliest": "-7d",
                "latest": "now",
                "max_results": 500
            }
        """
        hunt = self.get_object()
        earliest = request.data.get("earliest", "-24h")
        latest = request.data.get("latest", "now")
        max_results = request.data.get("max_results", 500)

        try:
            splunk = SplunkService()
            results = splunk.execute_search(hunt.spl, earliest, latest, max_results)

            return Response({
                "hunt": HuntQuerySerializer(hunt).data,
                "query": hunt.spl,
                "earliest": earliest,
                "latest": latest,
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


class DetectionRuleViewSet(viewsets.ModelViewSet):
    """
    CRUD + execute for detection rules.
    """

    queryset = DetectionRule.objects.all()
    serializer_class = DetectionRuleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["severity", "enabled"]

    @action(detail=True, methods=["post"], url_path="run")
    def run_rule(self, request, pk=None):
        """
        POST /api/detections/rules/{id}/run/

        Execute this detection rule against Splunk.
        """
        rule = self.get_object()
        earliest = request.data.get("earliest", "-24h")
        latest = request.data.get("latest", "now")

        try:
            splunk = SplunkService()
            results = splunk.execute_search(rule.spl, earliest, latest)

            return Response({
                "rule": DetectionRuleSerializer(rule).data,
                "result_count": len(results),
                "results": results,
            })
        except (SplunkConnectionError, SplunkAuthError, SplunkSearchError) as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
