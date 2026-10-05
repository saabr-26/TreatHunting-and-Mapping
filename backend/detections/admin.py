from django.contrib import admin
from .models import HuntQuery, DetectionRule


@admin.register(HuntQuery)
class HuntQueryAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "enabled", "mitre_technique", "created_at"]
    list_filter = ["category", "enabled"]
    search_fields = ["name", "description", "hypothesis"]


@admin.register(DetectionRule)
class DetectionRuleAdmin(admin.ModelAdmin):
    list_display = ["name", "severity", "enabled", "mitre_technique", "created_at"]
    list_filter = ["severity", "enabled"]
    search_fields = ["name", "description"]
