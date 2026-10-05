"""
Splunk Integration Service

This module is the ONLY place where Splunk credentials are used.
It communicates with the Splunk REST API to execute SPL searches,
retrieve events, and provide data to the rest of the Django application.

Why this exists:
- Centralizes all Splunk communication in one place
- Ensures credentials stay in the backend
- Provides clean error handling for Splunk failures
- Makes it easy to mock Splunk for testing
"""

import logging
import time
from typing import Optional

import requests
from requests.auth import HTTPBasicAuth
from django.conf import settings

logger = logging.getLogger("splunk")


class SplunkConnectionError(Exception):
    """Raised when Splunk is unreachable."""
    pass


class SplunkAuthError(Exception):
    """Raised when Splunk credentials are invalid."""
    pass


class SplunkSearchError(Exception):
    """Raised when an SPL query fails."""
    pass


class SplunkService:
    """
    Service layer for communicating with the Splunk REST API.

    All methods use the Splunk REST API on port 8089 (configurable).
    Credentials are loaded from Django settings (which reads from .env).
    """

    def __init__(self):
        self.base_url = f"https://{settings.SPLUNK_HOST}:{settings.SPLUNK_PORT}"
        self.auth = HTTPBasicAuth(settings.SPLUNK_USERNAME, settings.SPLUNK_PASSWORD)
        self.verify_ssl = settings.SPLUNK_VERIFY_SSL
        self.index = settings.SPLUNK_INDEX
        self.timeout = 30  # seconds

        # Suppress SSL warnings for self-signed certs (common in local Splunk)
        if not self.verify_ssl:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    # ------------------------------------------------------------------
    # HEALTH CHECK
    # ------------------------------------------------------------------
    def health_check(self) -> dict:
        """
        Test connectivity to Splunk.
        Returns: {"status": "connected", "splunk_version": "..."}
        """
        try:
            response = requests.get(
                f"{self.base_url}/services/server/info",
                auth=self.auth,
                verify=self.verify_ssl,
                timeout=self.timeout,
                params={"output_mode": "json"},
            )
            if response.status_code == 401:
                raise SplunkAuthError("Invalid Splunk credentials.")
            response.raise_for_status()

            data = response.json()
            server_info = data.get("entry", [{}])[0].get("content", {})
            return {
                "status": "connected",
                "splunk_version": server_info.get("version", "unknown"),
                "server_name": server_info.get("serverName", "unknown"),
                "os": server_info.get("os_name", "unknown"),
            }
        except requests.exceptions.ConnectionError:
            raise SplunkConnectionError(
                f"Cannot connect to Splunk at {self.base_url}. "
                "Check that Splunk is running and the host/port are correct."
            )
        except requests.exceptions.Timeout:
            raise SplunkConnectionError("Splunk connection timed out.")

    # ------------------------------------------------------------------
    # EXECUTE SPL SEARCH
    # ------------------------------------------------------------------
    def execute_search(
        self,
        spl: str,
        earliest: str = "-24h",
        latest: str = "now",
        max_results: int = 1000,
    ) -> list[dict]:
        """
        Execute an SPL search against Splunk and return results.

        This creates a search job, waits for completion, then retrieves results.

        Args:
            spl: The SPL query string (e.g., 'index=threathunt EventCode=4625')
            earliest: Start time (Splunk format, e.g., '-24h', '-7d')
            latest: End time (e.g., 'now')
            max_results: Maximum number of results to return

        Returns:
            List of event dictionaries
        """
        # Ensure the query starts with 'search' if it starts with 'index='
        if spl.strip().startswith("index="):
            spl = f"search {spl}"

        logger.info(f"Executing Splunk search: {spl[:100]}...")

        try:
            # Step 1: Create the search job
            create_response = requests.post(
                f"{self.base_url}/services/search/jobs",
                auth=self.auth,
                verify=self.verify_ssl,
                timeout=self.timeout,
                data={
                    "search": spl,
                    "earliest_time": earliest,
                    "latest_time": latest,
                    "output_mode": "json",
                },
            )

            if create_response.status_code == 401:
                raise SplunkAuthError("Invalid Splunk credentials.")
            if create_response.status_code == 400:
                error_msg = create_response.text
                raise SplunkSearchError(f"Invalid SPL query: {error_msg}")
            create_response.raise_for_status()

            sid = create_response.json().get("sid")
            if not sid:
                raise SplunkSearchError("Failed to create search job — no SID returned.")

            logger.info(f"Search job created: SID={sid}")

            # Step 2: Poll until the job is done
            job_url = f"{self.base_url}/services/search/jobs/{sid}"
            for _ in range(120):  # Max wait: 120 seconds
                status_response = requests.get(
                    job_url,
                    auth=self.auth,
                    verify=self.verify_ssl,
                    timeout=self.timeout,
                    params={"output_mode": "json"},
                )
                status_response.raise_for_status()

                job_info = status_response.json()["entry"][0]["content"]
                dispatch_state = job_info.get("dispatchState", "")

                if dispatch_state == "DONE":
                    break
                elif dispatch_state == "FAILED":
                    raise SplunkSearchError(
                        f"Search job failed: {job_info.get('messages', '')}"
                    )

                time.sleep(1)
            else:
                raise SplunkSearchError("Search job timed out after 120 seconds.")

            # Step 3: Retrieve results
            results_response = requests.get(
                f"{job_url}/results",
                auth=self.auth,
                verify=self.verify_ssl,
                timeout=self.timeout,
                params={
                    "output_mode": "json",
                    "count": max_results,
                },
            )
            results_response.raise_for_status()

            results_data = results_response.json()
            events = results_data.get("results", [])

            logger.info(f"Search returned {len(events)} results.")
            return events

        except requests.exceptions.ConnectionError:
            raise SplunkConnectionError(
                "Cannot connect to Splunk. Check that Splunk is running."
            )
        except (SplunkAuthError, SplunkSearchError, SplunkConnectionError):
            raise
        except Exception as e:
            logger.error(f"Unexpected Splunk error: {e}")
            raise SplunkSearchError(f"Unexpected error: {str(e)}")

    # ------------------------------------------------------------------
    # CONVENIENCE METHODS
    # ------------------------------------------------------------------
    def get_events_by_host(
        self, host: str, earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """Get all events for a specific host."""
        spl = f'index={self.index} host="{host}" | sort -_time | head 500'
        return self.execute_search(spl, earliest, latest)

    def get_events_by_user(
        self, username: str, earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """Get all events associated with a specific user."""
        spl = (
            f'index={self.index} (user="{username}" OR User="{username}" '
            f'OR Account_Name="{username}" OR TargetUserName="{username}" '
            f'OR SubjectUserName="{username}") '
            f"| sort -_time | head 500"
        )
        return self.execute_search(spl, earliest, latest)

    def get_events_by_eventcode(
        self, event_code: int, earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """Get events matching a specific Windows Event ID."""
        spl = f"index={self.index} EventCode={event_code} | sort -_time | head 500"
        return self.execute_search(spl, earliest, latest)

    def get_correlated_events(
        self,
        host: str,
        username: Optional[str] = None,
        pivot_time: Optional[str] = None,
        window_minutes: int = 30,
        earliest: str = "-24h",
        latest: str = "now",
    ) -> list[dict]:
        """
        Get events correlated around a pivot point.

        Correlation logic:
        - Same host
        - Optionally same user
        - Within ±window_minutes of pivot_time (or full time range if no pivot)
        """
        parts = [f'index={self.index} host="{host}"']

        if username:
            parts.append(
                f'(user="{username}" OR User="{username}" '
                f'OR Account_Name="{username}" OR TargetUserName="{username}" '
                f'OR SubjectUserName="{username}")'
            )

        spl = " ".join(parts) + " | sort _time | head 1000"

        # If a pivot time is given, narrow the search window
        if pivot_time:
            search_earliest = f"-{window_minutes}m@m"
            search_latest = f"+{window_minutes}m@m"
        else:
            search_earliest = earliest
            search_latest = latest

        return self.execute_search(spl, search_earliest, search_latest)

    def get_dashboard_stats(self, earliest: str = "-24h", latest: str = "now") -> dict:
        """
        Get dashboard KPI statistics from Splunk.

        Returns counts of: total events, unique hosts, unique users,
        unique event codes, and events by sourcetype.
        """
        stats_spl = (
            f"index={self.index} "
            f"| stats count as total_events, "
            f"dc(host) as unique_hosts, "
            f"dc(user) as unique_users, "
            f"dc(EventCode) as unique_event_codes"
        )

        results = self.execute_search(stats_spl, earliest, latest)

        if results:
            stats = results[0]
            return {
                "total_events": int(stats.get("total_events", 0)),
                "unique_hosts": int(stats.get("unique_hosts", 0)),
                "unique_users": int(stats.get("unique_users", 0)),
                "unique_event_codes": int(stats.get("unique_event_codes", 0)),
            }
        return {
            "total_events": 0,
            "unique_hosts": 0,
            "unique_users": 0,
            "unique_event_codes": 0,
        }

    def get_events_over_time(
        self, span: str = "1h", earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """Get event count bucketed over time for chart visualization."""
        spl = f"index={self.index} | timechart span={span} count"
        return self.execute_search(spl, earliest, latest)

    def get_top_event_codes(
        self, limit: int = 20, earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """Get the most common Event IDs."""
        spl = f"index={self.index} | top limit={limit} EventCode"
        return self.execute_search(spl, earliest, latest)

    def get_top_hosts(
        self, limit: int = 20, earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """Get hosts with the most events."""
        spl = f"index={self.index} | top limit={limit} host"
        return self.execute_search(spl, earliest, latest)

    def get_top_users(
        self, limit: int = 20, earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """Get users with the most events."""
        spl = (
            f"index={self.index} (user=* OR User=*) "
            f"| eval username=coalesce(user,User,Account_Name,TargetUserName,SubjectUserName) "
            f"| top limit={limit} username"
        )
        return self.execute_search(spl, earliest, latest)

    def get_auth_summary(
        self, earliest: str = "-24h", latest: str = "now"
    ) -> dict:
        """Get authentication event summary (success vs fail)."""
        spl = (
            f"index={self.index} (EventCode=4624 OR EventCode=4625) "
            f"| stats count by EventCode "
            f'| eval status=if(EventCode=4624,"Success","Failure")'
        )
        results = self.execute_search(spl, earliest, latest)
        summary = {"success": 0, "failure": 0}
        for r in results:
            if r.get("status") == "Success":
                summary["success"] = int(r.get("count", 0))
            elif r.get("status") == "Failure":
                summary["failure"] = int(r.get("count", 0))
        return summary

    def get_process_tree(
        self, host: str, earliest: str = "-24h", latest: str = "now"
    ) -> list[dict]:
        """
        Get process creation events for building a process tree.
        Uses Sysmon Event ID 1 or Windows Security Event ID 4688.
        """
        spl = (
            f'index={self.index} host="{host}" (EventCode=1 OR EventCode=4688) '
            f"| table _time host user EventCode Image ParentImage "
            f"CommandLine ParentCommandLine ProcessId ParentProcessId "
            f"NewProcessName ParentProcessName "
            f"| sort _time"
        )
        return self.execute_search(spl, earliest, latest)
