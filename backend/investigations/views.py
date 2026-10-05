"""
Investigation views — CRUD for Cases, Findings, Evidence, and Notes.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import InvestigationCase, Finding, Evidence, AnalystNote
from .serializers import (
    InvestigationCaseSerializer,
    InvestigationCaseListSerializer,
    FindingSerializer,
    EvidenceSerializer,
    AnalystNoteSerializer,
)


class InvestigationCaseViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for investigation cases.

    List:   GET    /api/investigations/cases/
    Create: POST   /api/investigations/cases/
    Detail: GET    /api/investigations/cases/{id}/
    Update: PUT    /api/investigations/cases/{id}/
    Delete: DELETE /api/investigations/cases/{id}/
    Notes:  POST   /api/investigations/cases/{id}/add_note/
    """

    queryset = InvestigationCase.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return InvestigationCaseListSerializer
        return InvestigationCaseSerializer

    def perform_create(self, serializer):
        """Automatically set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="add_note")
    def add_note(self, request, pk=None):
        """
        POST /api/investigations/cases/{id}/add_note/

        Add an analyst note to a case.
        Body: {"content": "My observation..."}
        """
        case = self.get_object()
        content = request.data.get("content", "")

        if not content:
            return Response(
                {"error": "Note content is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = AnalystNote.objects.create(
            content=content,
            case=case,
            analyst=request.user,
        )

        return Response(
            AnalystNoteSerializer(note).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="add_evidence")
    def add_evidence(self, request, pk=None):
        """
        POST /api/investigations/cases/{id}/add_evidence/

        Add a piece of evidence to a case.
        """
        case = self.get_object()
        serializer = EvidenceSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(case=case)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FindingViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for findings.

    List:   GET    /api/investigations/findings/
    Create: POST   /api/investigations/findings/
    Detail: GET    /api/investigations/findings/{id}/
    """

    queryset = Finding.objects.all()
    serializer_class = FindingSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["severity", "classification", "host", "case"]
    search_fields = ["title", "description", "host", "username"]
    ordering_fields = ["created_at", "severity", "event_time"]


class EvidenceViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for evidence items.
    """

    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["host", "event_code", "case"]
