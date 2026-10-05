from django.contrib import admin
from .models import MITRETechnique


@admin.register(MITRETechnique)
class MITRETechniqueAdmin(admin.ModelAdmin):
    list_display = ["technique_id", "name", "tactic", "confidence", "evidence_count"]
    list_filter = ["tactic", "confidence"]
    search_fields = ["technique_id", "name", "description"]
