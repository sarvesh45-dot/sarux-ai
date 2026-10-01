"""
SaruX Central System Agent
Coordinates safe tool execution, permission validation, and structured responses.
"""

from typing import Dict, Any
try:
    from .permissions import (
        get_tool_permission,
        validate_tool_arguments,
        PERMISSION_SAFE,
        PERMISSION_CONFIRMATION_REQUIRED,
        PERMISSION_BLOCKED,
    )
    from ..tools.system import (
        execute_get_system_information,
        execute_get_battery_status,
    )
    from ..tools.applications import execute_open_application
    from ..tools.volume import (
        execute_get_volume,
        execute_set_volume,
        execute_mute_volume,
    )
except (ImportError, ValueError):
    from agent.permissions import (
        get_tool_permission,
        validate_tool_arguments,
        PERMISSION_SAFE,
        PERMISSION_CONFIRMATION_REQUIRED,
        PERMISSION_BLOCKED,
    )
    from tools.system import (
        execute_get_system_information,
        execute_get_battery_status,
    )
    from tools.applications import execute_open_application
    from tools.volume import (
        execute_get_volume,
        execute_set_volume,
        execute_mute_volume,
    )



class SystemAgent:
    """Manages and executes approved local system tools."""

    def __init__(self):
        self.tool_handlers = {
            "get_system_information": lambda args: execute_get_system_information(),
            "get_battery_status": lambda args: execute_get_battery_status(),
            "get_volume": lambda args: execute_get_volume(),
            "open_application": lambda args: execute_open_application(args.get("application", "")),
            "set_volume": lambda args: execute_set_volume(args.get("level", 50)),
            "mute_volume": lambda args: execute_mute_volume(args.get("muted", True)),
        }

    def execute(self, tool_name: str, args: Dict[str, Any], confirmed: bool = False) -> Dict[str, Any]:
        """
        Executes an approved tool with permission and argument validation.
        """
        permission = get_tool_permission(tool_name)

        # 1. Reject blocked or unknown tools
        if permission == PERMISSION_BLOCKED or tool_name not in self.tool_handlers:
            return {
                "success": False,
                "tool": tool_name,
                "error": f"Security Violation: Tool '{tool_name}' is unauthorized or prohibited.",
                "permission": PERMISSION_BLOCKED,
            }

        # 2. Validate tool arguments
        is_valid, err_msg = validate_tool_arguments(tool_name, args)
        if not is_valid:
            return {
                "success": False,
                "tool": tool_name,
                "error": err_msg,
                "permission": permission,
            }

        # 3. Check confirmation requirement
        if permission == PERMISSION_CONFIRMATION_REQUIRED and not confirmed:
            return {
                "success": False,
                "tool": tool_name,
                "requiresConfirmation": True,
                "permission": PERMISSION_CONFIRMATION_REQUIRED,
                "message": f"Tool '{tool_name}' requires explicit user confirmation before execution.",
            }

        # 4. Safe execution
        try:
            handler = self.tool_handlers[tool_name]
            result = handler(args)
            return {
                "tool": tool_name,
                "permission": permission,
                **result,
            }
        except Exception as e:
            return {
                "success": False,
                "tool": tool_name,
                "error": f"System tool execution failure: {str(e)}",
                "permission": permission,
            }


system_agent = SystemAgent()
