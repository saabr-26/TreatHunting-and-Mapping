from django.contrib import admin
from .models import InvestigationCase, Finding, Evidence, AnalystNote


@admin.register(InvestigationCase)
class InvestigationCaseAdmin(admin.ModelAdmin):
    list_display = ["case_id", "title", "status", "priority", "host", "username", "created_at"]
    list_filter = ["status", "priority"]
    search_fields = ["title", "host", "username"]


@admin.register(Finding)
class FindingAdmin(admin.ModelAdmin):
    list_display = ["title", "severity", "classification", "host", "event_code", "created_at"]
    list_filter = ["severity", "classification"]
    search_fields = ["title", "host", "username"]


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ["event_time", "host", "username", "event_code", "process_name", "case"]
    list_filter = ["event_code"]
    search_fields = ["host", "username"]


@admin.register(AnalystNote)
class AnalystNoteAdmin(admin.ModelAdmin):
    list_display = ["case", "analyst", "created_at"]
    list_filter = ["analyst"]
