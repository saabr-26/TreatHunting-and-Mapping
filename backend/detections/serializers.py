from rest_framework import serializers
from .models import HuntQuery, DetectionRule


class HuntQuerySerializer(serializers.ModelSerializer):
    mitre_technique_id = serializers.CharField(
        source="mitre_technique.technique_id", read_only=True
    )
    mitre_technique_name = serializers.CharField(
        source="mitre_technique.name", read_only=True
    )

    class Meta:
        model = HuntQuery
        fields = [
            "id", "name", "category", "description", "hypothesis",
            "spl", "data_source", "expected_evidence", "investigation_notes",
            "enabled", "mitre_technique", "mitre_technique_id",
            "mitre_technique_name", "created_at", "updated_at",
        ]


class DetectionRuleSerializer(serializers.ModelSerializer):
    mitre_technique_id = serializers.CharField(
        source="mitre_technique.technique_id", read_only=True
    )

    class Meta:
        model = DetectionRule
        fields = [
            "id", "name", "description", "spl", "severity",
            "data_source", "enabled", "false_positive_notes",
            "mitre_technique", "mitre_technique_id",
            "created_at", "updated_at",
        ]
