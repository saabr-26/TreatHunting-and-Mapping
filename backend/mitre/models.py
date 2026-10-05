"""
MITRE ATT&CK models.

Stores technique definitions used for evidence-based mapping.
Only techniques with actual observed evidence should be linked to
cases/findings — do NOT auto-map every event.

Confidence levels:
- high: Multiple correlated events directly matching the technique
- medium: Single clear indicator
- low: Circumstantial, needs more investigation
"""

from django.db import models


class MITRETechnique(models.Model):
    """
    A MITRE ATT&CK technique or sub-technique.

    Example:
        technique_id = "T1059.001"
        name = "PowerShell"
        tactic = "Execution"
    """

    TACTIC_CHOICES = [
        ("reconnaissance", "Reconnaissance"),
        ("resource_development", "Resource Development"),
        ("initial_access", "Initial Access"),
        ("execution", "Execution"),
        ("persistence", "Persistence"),
        ("privilege_escalation", "Privilege Escalation"),
        ("defense_evasion", "Defense Evasion"),
        ("credential_access", "Credential Access"),
        ("discovery", "Discovery"),
        ("lateral_movement", "Lateral Movement"),
        ("collection", "Collection"),
        ("command_and_control", "Command and Control"),
        ("exfiltration", "Exfiltration"),
        ("impact", "Impact"),
    ]

    CONFIDENCE_CHOICES = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("unconfirmed", "Unconfirmed"),
    ]

    # Core fields
    technique_id = models.CharField(
        max_length=20, unique=True,
        help_text="MITRE technique ID, e.g., T1059.001"
    )
    name = models.CharField(max_length=500)
    tactic = models.CharField(max_length=30, choices=TACTIC_CHOICES)
    description = models.TextField(blank=True, default="")

    # Evidence tracking
    evidence_count = models.IntegerField(default=0,
        help_text="Number of observed events supporting this technique")
    confidence = models.CharField(
        max_length=15, choices=CONFIDENCE_CHOICES, default="unconfirmed"
    )

    # Reference
    url = models.URLField(blank=True, default="",
        help_text="Link to MITRE ATT&CK page")

    # Trigger evidence description
    trigger_evidence = models.TextField(
        blank=True, default="",
        help_text="What evidence triggers this technique mapping"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["tactic", "technique_id"]
        verbose_name = "MITRE Technique"
        verbose_name_plural = "MITRE Techniques"

    def __str__(self):
        return f"{self.technique_id} — {self.name} ({self.tactic})"
