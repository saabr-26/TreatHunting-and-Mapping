from django.contrib import admin
from .models import SoCReport


@admin.register(SoCReport)
class SoCReportAdmin(admin.ModelAdmin):
    list_display = ["title", "case", "format", "generated_by", "generated_at"]
    list_filter = ["format"]
    search_fields = ["title"]
