"""
MITRE ATT&CK views.

Provides endpoints to list/filter/view techniques.
Only shows techniques that have been loaded into the database.
"""

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MITRETechnique
from .serializers import MITRETechniqueSerializer


class MITRETechniqueViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for MITRE ATT&CK techniques.

    List:   GET  /api/mitre/techniques/
    Detail: GET  /api/mitre/techniques/{id}/

    Filters:
        ?tactic=execution
        ?confidence=high
        ?search=PowerShell
    """

    queryset = MITRETechnique.objects.all()
    serializer_class = MITRETechniqueSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tactic", "confidence"]
    search_fields = ["technique_id", "name", "description"]
    ordering_fields = ["technique_id", "tactic", "evidence_count"]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mitre_summary(request):
    """
    GET /api/mitre/summary/

    Returns a summary of observed MITRE techniques grouped by tactic.
    Useful for the MITRE ATT&CK heatmap/matrix view.
    """
    techniques = MITRETechnique.objects.all()

    # Group by tactic
    tactic_map = {}
    for t in techniques:
        tactic = t.get_tactic_display()
        if tactic not in tactic_map:
            tactic_map[tactic] = []
        tactic_map[tactic].append({
            "technique_id": t.technique_id,
            "name": t.name,
            "evidence_count": t.evidence_count,
            "confidence": t.confidence,
        })

    return Response({
        "total_techniques": techniques.count(),
        "tactics": tactic_map,
    })
