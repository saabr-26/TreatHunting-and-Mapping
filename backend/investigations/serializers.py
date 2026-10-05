"""
Serializers for Investigation models.

Serializers convert Django model instances to/from JSON for the REST API.
"""

from rest_framework import serializers
from .models import InvestigationCase, Finding, Evidence, AnalystNote


class AnalystNoteSerializer(serializers.ModelSerializer):
    analyst_name = serializers.CharField(source="analyst.username", read_only=True)

    class Meta:
        model = AnalystNote
        fields = [
            "id", "content", "analyst", "analyst_name",
            "case", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "analyst", "analyst_name", "created_at", "updated_at"]


class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = [
            "id", "event_time", "host", "username", "event_code",
            "source_ip", "dest_ip", "process_name", "command_line",
            "raw_event", "description", "case", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class FindingSerializer(serializers.ModelSerializer):
    mitre_technique_ids = serializers.PrimaryKeyRelatedField(
        source="mitre_techniques", many=True, read_only=True
    )

    class Meta:
        model = Finding
        fields = [
            "id", "title", "description", "detection_rule", "severity",
            "event_time", "host", "username", "source_ip", "event_code",
            "evidence_raw", "classification", "classification_reason",
            "case", "mitre_technique_ids", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InvestigationCaseSerializer(serializers.ModelSerializer):
    """Full serializer with nested findings, evidence, and notes."""
    findings = FindingSerializer(many=True, read_only=True)
    evidence = EvidenceSerializer(many=True, read_only=True)
    notes = AnalystNoteSerializer(many=True, read_only=True)
    case_id = serializers.CharField(read_only=True)
    assigned_analyst_name = serializers.CharField(
        source="assigned_analyst.username", read_only=True
    )
    created_by_name = serializers.CharField(
        source="created_by.username", read_only=True
    )
    mitre_technique_ids = serializers.PrimaryKeyRelatedField(
        source="mitre_techniques", many=True, read_only=True
    )

    class Meta:
        model = InvestigationCase
        fields = [
            "id", "case_id", "title", "description", "status", "priority",
            "host", "username", "source_ip", "dest_ip",
            "splunk_query", "conclusion", "recommended_actions",
            "mitre_technique_ids",
            "assigned_analyst", "assigned_analyst_name",
            "created_by", "created_by_name",
            "findings", "evidence", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "case_id", "created_by", "created_by_name",
            "created_at", "updated_at",
        ]


class InvestigationCaseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested data)."""
    case_id = serializers.CharField(read_only=True)
    finding_count = serializers.IntegerField(source="findings.count", read_only=True)
    evidence_count = serializers.IntegerField(source="evidence.count", read_only=True)

    class Meta:
        model = InvestigationCase
        fields = [
            "id", "case_id", "title", "status", "priority",
            "host", "username", "finding_count", "evidence_count",
            "created_at", "updated_at",
        ]
