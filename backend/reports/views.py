"""
Report views — generate and retrieve SOC investigation reports.
"""

import logging

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from investigations.models import InvestigationCase
from .models import SoCReport
from .serializers import SoCReportSerializer
from .generator import ReportGenerator

logger = logging.getLogger(__name__)


class SoCReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve generated reports.

    List:   GET /api/reports/reports/
    Detail: GET /api/reports/reports/{id}/
    """
    queryset = SoCReport.objects.all()
    serializer_class = SoCReportSerializer
    permission_classes = [IsAuthenticated]


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """
    POST /api/reports/generate/

    Generate a SOC investigation report from a case.

    Body:
        {
            "case_id": 1,
            "format": "json"
        }

    Returns the full generated report.
    """
    case_pk = request.data.get("case_id")
    report_format = request.data.get("format", "json")

    if not case_pk:
        return Response(
            {"error": "case_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        case = InvestigationCase.objects.get(pk=case_pk)
    except InvestigationCase.DoesNotExist:
        return Response(
            {"error": f"Case {case_pk} not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        generator = ReportGenerator(case)
        report_data = generator.generate_json_report()

        # Save the report to disk
        file_path = generator.save_json_report()

        # Save report record to DB
        soc_report = SoCReport.objects.create(
            case=case,
            title=f"Investigation Report — {case.case_id}",
            format=report_format,
            file_path=file_path,
            executive_summary=report_data.get("executive_summary", ""),
            detection_summary=str(report_data.get("detection", {})),
            evidence_summary=report_data.get("evidence", []),
            timeline_summary=report_data.get("timeline", []),
            mitre_summary=report_data.get("mitre_attack", []),
            investigation_summary=str(report_data.get("investigation", {})),
            findings_summary=str(report_data.get("findings", [])),
            uncertainty=report_data.get("uncertainty", ""),
            recommended_actions=report_data.get("recommended_actions", []),
            generated_by=request.user,
        )

        return Response({
            "report_id": soc_report.id,
            "message": "Report generated successfully.",
            "report": report_data,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return Response(
            {"error": f"Failed to generate report: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
