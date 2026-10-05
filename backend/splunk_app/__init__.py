"""
Splunk Integration Service.

This package provides the SplunkService class for communicating with
the Splunk REST API. Import from here:

    from splunk_app.service import SplunkService
"""

from splunk_app.service import SplunkService, SplunkConnectionError, SplunkAuthError, SplunkSearchError

__all__ = ["SplunkService", "SplunkConnectionError", "SplunkAuthError", "SplunkSearchError"]
