"""
Investigation models — Cases, Findings, Evidence, and Analyst Notes.

These models store investigation metadata in PostgreSQL/SQLite.
The actual security events live in Splunk; these models reference
events by host, user, timestamp, and event code.

Design principle:
- Splunk = primary event store (raw logs)
- PostgreSQL = investigation metadata, analyst work product
"""

from django.db import models
from django.conf import settings


class InvestigationCase(models.Model):
    """
    An investigation case created when an analyst decides to investigate
    suspicious activity. Tracks the full lifecycle: Open → Investigating
    → Contained → Closed / False Positive.
    """

    STATUS_CHOICES = [
        ("open", "Open"),
        ("investigating", "Investigating"),
        ("contained", "Contained"),
        ("closed", "Closed"),
        ("false_positive", "False Positive"),
    ]

    PRIORITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("informational", "Informational"),
    ]

    # Case identifiers
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")

    # Investigation context
    host = models.CharField(max_length=255, blank=True, default="")
    username = models.CharField(max_length=255, blank=True, default="")
    source_ip = models.GenericIPAddressField(blank=True, null=True)
    dest_ip = models.GenericIPAddressField(blank=True, null=True)

    # Splunk reference
    splunk_query = models.TextField(blank=True, default="",
                                    help_text="The SPL query used to discover this case")

    # Investigation outcome
    conclusion = models.TextField(blank=True, default="",
                                  help_text="What was established from the investigation")
    recommended_actions = models.TextField(blank=True, default="",
                                           help_text="Actions recommended for remediation")

    # MITRE techniques (many-to-many)
    mitre_techniques = models.ManyToManyField(
        "mitre.MITRETechnique", blank=True, related_name="cases"
    )

    # Analyst assignment
    assigned_analyst = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_cases",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_cases",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Investigation Case"
        verbose_name_plural = "Investigation Cases"

    def __str__(self):
        return f"CASE-{self.pk:04d}: {self.title}"

    @property
    def case_id(self):
        return f"CASE-{self.pk:04d}"


class Finding(models.Model):
    """
    A suspicious finding that may or may not be malicious.

    Findings are evidence-based observations. The analyst classifies
    them as True Positive, False Positive, Benign, or Needs More Investigation.
    """

    SEVERITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("informational", "Informational"),
    ]

    CLASSIFICATION_CHOICES = [
        ("unclassified", "Unclassified"),
        ("true_positive", "True Positive"),
        ("false_positive", "False Positive"),
        ("benign", "Benign / Expected"),
        ("needs_investigation", "Needs More Investigation"),
    ]

    # Finding details
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    detection_rule = models.CharField(max_length=500, blank=True, default="")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="medium")

    # Event context
    event_time = models.DateTimeField(blank=True, null=True)
    host = models.CharField(max_length=255, blank=True, default="")
    username = models.CharField(max_length=255, blank=True, default="")
    source_ip = models.GenericIPAddressField(blank=True, null=True)
    event_code = models.CharField(max_length=50, blank=True, default="")

    # Raw evidence from Splunk
    evidence_raw = models.JSONField(default=dict, blank=True,
                                     help_text="Raw event data from Splunk")

    # Classification
    classification = models.CharField(
        max_length=25, choices=CLASSIFICATION_CHOICES, default="unclassified"
    )
    classification_reason = models.TextField(blank=True, default="",
                                              help_text="Why this classification was chosen")

    # Links
    case = models.ForeignKey(
        InvestigationCase,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="findings",
    )
    mitre_techniques = models.ManyToManyField(
        "mitre.MITRETechnique", blank=True, related_name="findings"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.title}"


class Evidence(models.Model):
    """
    A specific piece of evidence (a Splunk event) linked to an investigation case.

    This stores a reference to the Splunk event plus key fields
    so analysts can review evidence without re-querying Splunk every time.
    """

    # Event fields (copied from Splunk for reference)
    event_time = models.DateTimeField()
    host = models.CharField(max_length=255)
    username = models.CharField(max_length=255, blank=True, default="")
    event_code = models.CharField(max_length=50, blank=True, default="")
    source_ip = models.GenericIPAddressField(blank=True, null=True)
    dest_ip = models.GenericIPAddressField(blank=True, null=True)
    process_name = models.CharField(max_length=500, blank=True, default="")
    command_line = models.TextField(blank=True, default="")
    raw_event = models.JSONField(default=dict, blank=True,
                                  help_text="Full raw event from Splunk")
    description = models.TextField(blank=True, default="",
                                    help_text="Analyst description of this evidence")

    # Link to case
    case = models.ForeignKey(
        InvestigationCase,
        on_delete=models.CASCADE,
        related_name="evidence",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["event_time"]
        verbose_name_plural = "Evidence"

    def __str__(self):
        return f"Evidence: {self.event_code} on {self.host} at {self.event_time}"


class AnalystNote(models.Model):
    """
    Notes added by analysts during an investigation.

    Allows building a log of analyst observations and decisions.
    """

    content = models.TextField()
    case = models.ForeignKey(
        InvestigationCase,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    analyst = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="notes",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Note by {self.analyst} on {self.case}"
