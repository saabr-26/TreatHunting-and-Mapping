"""
SOC Report Generator.

Builds a professional investigation report from a case and its
associated findings, evidence, notes, and MITRE techniques.

Important: This generator does NOT fabricate evidence.
It only uses data actually stored in the case.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

from django.conf import settings
from investigations.models import InvestigationCase

logger = logging.getLogger(__name__)


class ReportGenerator:
    """
    Generates SOC investigation reports from an InvestigationCase.

    Report sections:
    1. Executive Summary
    2. Detection
    3. Evidence
    4. Timeline
    5. MITRE ATT&CK
    6. Investigation
    7. Findings
    8. Uncertainty
    9. Recommended Analyst Actions
    """

    def __init__(self, case: InvestigationCase):
        self.case = case

    def generate_json_report(self) -> dict:
        """Generate a full JSON report from the case data."""

        # Gather all related data
        findings = list(self.case.findings.all().values(
            "title", "severity", "classification", "classification_reason",
            "event_time", "host", "username", "event_code", "evidence_raw",
        ))
        evidence = list(self.case.evidence.all().values(
            "event_time", "host", "username", "event_code",
            "source_ip", "dest_ip", "process_name", "command_line",
            "raw_event", "description",
        ))
        notes = list(self.case.notes.all().values(
            "content", "analyst__username", "created_at",
        ))
        mitre_techniques = list(self.case.mitre_techniques.all().values(
            "technique_id", "name", "tactic", "confidence",
        ))

        # Build timeline from evidence (sorted by time)
        timeline = []
        for e in evidence:
            timeline.append({
                "time": str(e["event_time"]) if e["event_time"] else "unknown",
                "event_code": e["event_code"],
                "host": e["host"],
                "user": e["username"],
                "process": e["process_name"],
                "description": e["description"],
            })
        timeline.sort(key=lambda x: x["time"])

        # Build report
        report = {
            "report_metadata": {
                "case_id": self.case.case_id,
                "title": self.case.title,
                "status": self.case.status,
                "priority": self.case.priority,
                "generated_at": datetime.now().isoformat(),
                "host": self.case.host,
                "username": self.case.username,
                "source_ip": str(self.case.source_ip) if self.case.source_ip else "",
            },
            "executive_summary": self._build_executive_summary(),
            "detection": {
                "description": self.case.description,
                "splunk_query": self.case.splunk_query,
                "trigger": f"Investigation initiated for suspicious activity on {self.case.host}",
            },
            "evidence": evidence,
            "timeline": timeline,
            "mitre_attack": mitre_techniques,
            "investigation": {
                "analyst_notes": notes,
                "conclusion": self.case.conclusion,
            },
            "findings": findings,
            "uncertainty": self._build_uncertainty(),
            "recommended_actions": self._build_recommendations(),
        }

        return report

    def _build_executive_summary(self) -> str:
        """Build executive summary from case data."""
        finding_count = self.case.findings.count()
        evidence_count = self.case.evidence.count()
        mitre_count = self.case.mitre_techniques.count()

        summary = (
            f"Investigation {self.case.case_id}: {self.case.title}\n\n"
            f"Status: {self.case.get_status_display()}\n"
            f"Priority: {self.case.get_priority_display()}\n\n"
            f"Host: {self.case.host or 'N/A'}\n"
            f"User: {self.case.username or 'N/A'}\n\n"
            f"This investigation identified {finding_count} finding(s) "
            f"supported by {evidence_count} piece(s) of evidence, "
            f"mapped to {mitre_count} MITRE ATT&CK technique(s).\n\n"
        )

        if self.case.conclusion:
            summary += f"Conclusion: {self.case.conclusion}\n"
        else:
            summary += "Conclusion: Investigation is ongoing.\n"

        return summary

    def _build_uncertainty(self) -> str:
        """List what could not be confirmed."""
        uncertainties = []

        # Check for unclassified findings
        unclassified = self.case.findings.filter(classification="unclassified").count()
        if unclassified:
            uncertainties.append(
                f"{unclassified} finding(s) have not yet been classified."
            )

        needs_invest = self.case.findings.filter(
            classification="needs_investigation"
        ).count()
        if needs_invest:
            uncertainties.append(
                f"{needs_invest} finding(s) require further investigation."
            )

        if not self.case.conclusion:
            uncertainties.append("No final conclusion has been recorded for this case.")

        if not uncertainties:
            return "All findings have been reviewed and classified."

        return "\n".join(f"- {u}" for u in uncertainties)

    def _build_recommendations(self) -> list:
        """Build recommended actions list."""
        actions = []

        if self.case.recommended_actions:
            # Parse from case field
            for line in self.case.recommended_actions.strip().split("\n"):
                line = line.strip()
                if line:
                    actions.append(line)

        if not actions:
            # Default recommendations based on case state
            if self.case.status == "open":
                actions = [
                    "Continue investigation and gather additional evidence.",
                    "Review related events in Splunk.",
                    "Validate whether observed activity was authorized.",
                ]
            elif self.case.status == "investigating":
                actions = [
                    "Complete analysis of all related events.",
                    "Classify all unclassified findings.",
                    "Document investigation conclusion.",
                ]

        return actions

    def save_json_report(self) -> str:
        """Generate and save JSON report to file."""
        report_data = self.generate_json_report()
        output_dir = settings.REPORT_OUTPUT_DIR
        output_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{self.case.case_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = output_dir / filename

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2, default=str)

        logger.info(f"Report saved: {filepath}")
        return str(filepath)
