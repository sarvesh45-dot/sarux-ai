"""
SaruX Tool Permission and Security Rules
Defines permission levels (SAFE, CONFIRMATION_REQUIRED, BLOCKED)
and argument validation guards.
"""

from typing import Dict, Any, Tuple

# Permission Categories
PERMISSION_SAFE = "SAFE"
PERMISSION_CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED"
PERMISSION_BLOCKED = "BLOCKED"

TOOL_PERMISSIONS: Dict[str, str] = {
    # System Control (Step 6)
    "get_system_information": PERMISSION_SAFE,
    "get_battery_status": PERMISSION_SAFE,
    "get_volume": PERMISSION_SAFE,
    "open_application": PERMISSION_CONFIRMATION_REQUIRED,
    "set_volume": PERMISSION_CONFIRMATION_REQUIRED,
    "mute_volume": PERMISSION_CONFIRMATION_REQUIRED,
    "open_url": PERMISSION_CONFIRMATION_REQUIRED,
    "open_website": PERMISSION_CONFIRMATION_REQUIRED,

    # Conversational Tools (Step 5)
    "get_current_time": PERMISSION_SAFE,
    "get_current_date": PERMISSION_SAFE,
    "calculator": PERMISSION_SAFE,
    "web_search": PERMISSION_SAFE,
}

# Blocked action keywords and signatures that must never be executed
BLOCKED_KEYWORDS = [
    "rm -rf",
    "del /",
    "rmdir",
    "format ",
    "powershell",
    "cmd.exe /c",
    "bash -c",
    "sh -c",
    "chmod -r",
    "chown",
    "kill -9",
    "mkfs",
    "dd if=",
    ":(){ :|:& };:",
    "eval(",
    "exec(",
    "registry",
    "reg add",
    "reg delete",
]


def get_tool_permission(tool_name: str) -> str:
    """Returns the permission level for a given tool name."""
    return TOOL_PERMISSIONS.get(tool_name, PERMISSION_BLOCKED)


def validate_tool_arguments(tool_name: str, args: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validates arguments for a tool before execution.
    Returns (is_valid, error_message).
    """
    if not isinstance(args, dict):
        return False, "Arguments must be provided as a key-value object."

    # General check: Scan all string argument values for blocked dangerous signatures
    for key, val in args.items():
        if isinstance(val, str):
            val_lower = val.lower().strip()
            for dangerous in BLOCKED_KEYWORDS:
                if dangerous in val_lower:
                    return False, f"Dangerous command pattern detected in parameter '{key}'. Operation rejected."

    if tool_name == "open_application":
        app = args.get("application")
        if not app or not isinstance(app, str) or not app.strip():
            return False, "Parameter 'application' must be a non-empty string."
        if len(app) > 80:
            return False, "Application name exceeds safe maximum length (80 chars)."

    elif tool_name == "set_volume":
        if "level" not in args:
            return False, "Parameter 'level' is required for set_volume."
        level = args.get("level")
        try:
            level_num = float(level)
            if level_num < 0 or level_num > 100:
                return False, f"Volume level must be between 0 and 100 (received {level})."
        except (ValueError, TypeError):
            return False, "Volume level must be a numeric value between 0 and 100."

    elif tool_name == "mute_volume":
        if "muted" not in args:
            return False, "Parameter 'muted' (boolean) is required for mute_volume."
        if not isinstance(args.get("muted"), bool):
            # allow boolean string conversion if safe
            if str(args.get("muted")).lower() not in ("true", "false", "1", "0"):
                return False, "Parameter 'muted' must be a boolean (true or false)."

    elif tool_name in ("open_url", "open_website"):
        url = args.get("url")
        if not url or not isinstance(url, str) or not url.strip():
            return False, "Parameter 'url' must be a non-empty string."
        url_lower = url.lower().strip()
        blocked_schemes = ("javascript:", "data:", "file:", "vbscript:", "blob:", "about:", "shell:")
        for scheme in blocked_schemes:
            if url_lower.startswith(scheme):
                return False, f"Protocol '{scheme}' is strictly forbidden for security reasons."

    return True, ""
