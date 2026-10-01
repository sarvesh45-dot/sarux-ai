"""
Application launcher tool for SaruX.
Enforces strict allowlisting from backend/config/allowed_apps.json.
Never allows arbitrary shell or terminal commands.
"""

import json
import os
import shutil
import subprocess
from typing import Dict, Any, List
try:
    from ..agent.platform_info import get_normalized_os
except (ImportError, ValueError):
    from agent.platform_info import get_normalized_os



def load_allowed_apps() -> Dict[str, Dict[str, List[str]]]:
    """Loads the application allowlist from config."""
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "allowed_apps.json")
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[SaruX Local Agent] Warning: Could not load allowed_apps.json: {e}")
        return {
            "windows": {
                "chrome": ["chrome.exe"],
                "vscode": ["code.cmd", "code.exe"],
                "notepad": ["notepad.exe"],
                "calculator": ["calc.exe"],
            },
            "linux": {
                "chrome": ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"],
                "vscode": ["code"],
                "calculator": ["gnome-calculator", "kcalc", "xcalc"],
                "terminal": ["gnome-terminal", "x-terminal-emulator", "xterm"],
            },
            "macos": {
                "chrome": ["open -a 'Google Chrome'"],
                "vscode": ["code", "open -a 'Visual Studio Code'"],
                "calculator": ["open -a Calculator"],
            },
        }


def normalize_app_name(raw_name: str) -> str:
    """Normalizes application query, e.g. 'Google Chrome' -> 'chrome'."""
    cleaned = raw_name.lower().strip()
    if cleaned in ("chrome", "google chrome", "browser"):
        return "chrome"
    if cleaned in ("vscode", "vs code", "code", "visual studio code"):
        return "vscode"
    if cleaned in ("calc", "calculator"):
        return "calculator"
    if cleaned in ("notepad", "text editor", "gedit", "kate"):
        return "notepad"
    if cleaned in ("terminal", "console", "command prompt", "bash"):
        return "terminal"
    return cleaned


def execute_open_application(app_name: str) -> Dict[str, Any]:
    """
    Launches an approved application strictly from the allowlist.
    Rejects any unapproved application or arbitrary command.
    """
    if not app_name or not isinstance(app_name, str):
        return {"success": False, "error": "Application name must be a non-empty string."}

    norm_name = normalize_app_name(app_name)
    current_os = get_normalized_os()
    allowlist = load_allowed_apps()
    os_allowlist = allowlist.get(current_os, {})

    # 1. Verify application exists in allowlist
    if norm_name not in os_allowlist and app_name.lower() not in os_allowlist:
        return {
            "success": False,
            "application": app_name,
            "error": f"Application '{app_name}' is not in the approved allowlist.",
        }

    candidate_binaries = os_allowlist.get(norm_name) or os_allowlist.get(app_name.lower()) or []

    # 2. Find which candidate executable exists on the user's system
    chosen_binary: str | None = None

    for candidate in candidate_binaries:
        # Check if candidate binary is available in PATH
        # Or if macOS 'open -a' command
        if current_os == "macos" and candidate.startswith("open -a"):
            chosen_binary = candidate
            break

        bin_path = shutil.which(candidate)
        if bin_path:
            chosen_binary = bin_path
            break

    if not chosen_binary:
        # Check standard default fallbacks
        for candidate in candidate_binaries:
            # Check common absolute paths if applicable
            if os.path.isabs(candidate) and os.path.exists(candidate):
                chosen_binary = candidate
                break

    if not chosen_binary:
        return {
            "success": False,
            "application": app_name,
            "error": f"{app_name.capitalize()} is not configured or could not be found on this system.",
        }

    # 3. Launch the process safely without shell=True (detached)
    try:
        if current_os == "macos" and chosen_binary.startswith("open -a"):
            # macOS open application command
            parts = chosen_binary.split(" ", 2)
            subprocess.Popen(parts, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            # Safe binary execution with no arbitrary arguments
            subprocess.Popen([chosen_binary], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return {
            "success": True,
            "application": app_name,
            "executable": os.path.basename(chosen_binary),
            "message": f"{app_name.capitalize()} has been opened.",
        }
    except Exception as e:
        return {
            "success": False,
            "application": app_name,
            "error": f"Failed to launch {app_name}: {str(e)}",
        }
