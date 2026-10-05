"""
Detection models — Hunt Queries and Detection Rules.

Hunt queries are pre-built SPL searches organized by category.
Detection rules are reusable rules that can generate findings.
"""

from django.db import models


class HuntQuery(models.Model):
    """
    A threat hunting query — a pre-built SPL search with context.

    Each hunt has:
    - A category (Authentication, PowerShell, etc.)
    - A hypothesis explaining what we're looking for
    - The actual SPL query
    - MITRE mapping
    - Expected evidence description
    """

    CATEGORY_CHOICES = [
        ("authentication", "Authentication"),
        ("account_management", "Account Management"),
        ("execution", "Execution"),
        ("powershell", "PowerShell"),
        ("command_shell", "Command Shell"),
        ("process_creation", "Process Creation"),
        ("persistence", "Persistence"),
        ("privilege_escalation", "Privilege Escalation"),
        ("credential_access", "Credential Access"),
        ("lateral_movement", "Lateral Movement"),
        ("collection", "Data Collection"),
        ("exfiltration", "Exfiltration"),
    ]

    name = models.CharField(max_length=500)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, default="")
    hypothesis = models.TextField(
        blank=True, default="",
        help_text="The threat hypothesis this hunt tests"
    )
    spl = models.TextField(help_text="The SPL query to execute")
    data_source = models.CharField(max_length=255, blank=True, default="")
    expected_evidence = models.TextField(blank=True, default="")
    investigation_notes = models.TextField(blank=True, default="")
    enabled = models.BooleanField(default=True)

    # MITRE link
    mitre_technique = models.ForeignKey(
        "mitre.MITRETechnique",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hunts",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]
        verbose_name = "Hunt Query"
        verbose_name_plural = "Hunt Queries"

    def __str__(self):
        return f"[{self.category}] {self.name}"


class DetectionRule(models.Model):
    """
    A reusable detection rule that can be run against Splunk
    to generate findings automatically.
    """

    SEVERITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("informational", "Informational"),
    ]

    name = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    spl = models.TextField(help_text="The SPL detection query")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium")
    data_source = models.CharField(max_length=255, blank=True, default="")
    enabled = models.BooleanField(default=True)
    false_positive_notes = models.TextField(
        blank=True, default="",
        help_text="Known false positive scenarios for this rule"
    )

    # MITRE link
    mitre_technique = models.ForeignKey(
        "mitre.MITRETechnique",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="detection_rules",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.name}"
