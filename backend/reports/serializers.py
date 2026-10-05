from rest_framework import serializers
from .models import SoCReport


class SoCReportSerializer(serializers.ModelSerializer):
    case_id = serializers.CharField(source="case.case_id", read_only=True)
    case_title = serializers.CharField(source="case.title", read_only=True)
    generated_by_name = serializers.CharField(
        source="generated_by.username", read_only=True
    )

    class Meta:
        model = SoCReport
        fields = [
            "id", "case", "case_id", "case_title", "title", "format",
            "file_path", "executive_summary", "detection_summary",
            "evidence_summary", "timeline_summary", "mitre_summary",
            "investigation_summary", "findings_summary", "uncertainty",
            "recommended_actions", "generated_by", "generated_by_name",
            "generated_at",
        ]
        read_only_fields = [
            "id", "generated_by", "generated_by_name", "generated_at",
        ]
