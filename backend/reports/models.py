"""
SOC Report model.

Stores generated investigation reports linked to cases.
"""

from django.db import models
from django.conf import settings


class SoCReport(models.Model):
    """
    A professional SOC investigation report generated from a case.

    Contains sections: Executive Summary, Detection, Evidence,
    Timeline, MITRE ATT&CK, Investigation, Findings,
    Uncertainty, and Recommended Actions.
    """

    FORMAT_CHOICES = [
        ("json", "JSON"),
        ("pdf", "PDF"),
    ]

    # Link to case
    case = models.ForeignKey(
        "investigations.InvestigationCase",
        on_delete=models.CASCADE,
        related_name="reports",
    )

    # Report metadata
    title = models.CharField(max_length=500)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default="json")
    file_path = models.CharField(max_length=1000, blank=True, default="")

    # Report content (stored as JSON for flexibility)
    executive_summary = models.TextField(blank=True, default="")
    detection_summary = models.TextField(blank=True, default="")
    evidence_summary = models.JSONField(default=list, blank=True)
    timeline_summary = models.JSONField(default=list, blank=True)
    mitre_summary = models.JSONField(default=list, blank=True)
    investigation_summary = models.TextField(blank=True, default="")
    findings_summary = models.TextField(blank=True, default="")
    uncertainty = models.TextField(blank=True, default="",
        help_text="What could not be confirmed in this investigation")
    recommended_actions = models.JSONField(default=list, blank=True)

    # Generation metadata
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="generated_reports",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]
        verbose_name = "SOC Report"
        verbose_name_plural = "SOC Reports"

    def __str__(self):
        return f"Report: {self.title} ({self.case})"
