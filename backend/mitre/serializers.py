from rest_framework import serializers
from .models import MITRETechnique


class MITRETechniqueSerializer(serializers.ModelSerializer):
    related_case_count = serializers.IntegerField(
        source="cases.count", read_only=True
    )
    related_finding_count = serializers.IntegerField(
        source="findings.count", read_only=True
    )
    related_hunt_count = serializers.IntegerField(
        source="hunts.count", read_only=True
    )

    class Meta:
        model = MITRETechnique
        fields = [
            "id", "technique_id", "name", "tactic", "description",
            "evidence_count", "confidence", "url", "trigger_evidence",
            "related_case_count", "related_finding_count", "related_hunt_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
