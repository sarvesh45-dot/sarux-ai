"""
System Information and Battery Status Tools for SaruX.
Safely extracts OS metrics without exposing sensitive keys or credentials.
"""

import platform
from typing import Dict, Any
try:
    from ..agent.platform_info import (
        get_normalized_os,
        get_cpu_info,
        get_ram_info,
        get_battery_info,
    )
except (ImportError, ValueError):
    from agent.platform_info import (
        get_normalized_os,
        get_cpu_info,
        get_ram_info,
        get_battery_info,
    )



def execute_get_system_information() -> Dict[str, Any]:
    """
    Returns sanitized hardware and OS information.
    Never exposes environment variables, credentials, or private file paths.
    """
    current_os = get_normalized_os()
    cpu = get_cpu_info()
    ram = get_ram_info()

    return {
        "success": True,
        "operatingSystem": platform.system(),
        "osNormalized": current_os,
        "osVersion": platform.version() or platform.release(),
        "osRelease": platform.release(),
        "hostname": platform.node() or "localhost",
        "cpu": cpu,
        "ram": ram,
    }


def execute_get_battery_status() -> Dict[str, Any]:
    """Returns battery percentage, charging state, or friendly AC notice."""
    battery = get_battery_info()
    return {
        "success": True,
        **battery,
    }
