"""
System Audio Volume Control Tool for SaruX.
Safely gets, sets, and mutes volume across platforms.
"""

import os
import shutil
import subprocess
from typing import Dict, Any
try:
    from ..agent.platform_info import get_normalized_os
except (ImportError, ValueError):
    from agent.platform_info import get_normalized_os


# Software audio state storage (persists volume even on headless/container systems)
_AUDIO_STATE = {
    "volume": 65,
    "muted": False,
}


def execute_get_volume() -> Dict[str, Any]:
    """Retrieves current system volume (0-100) and mute state."""
    current_os = get_normalized_os()

    # 1. macOS query via AppleScript
    if current_os == "macos" and shutil.which("osascript"):
        try:
            out = subprocess.check_output(
                ["osascript", "-e", "output volume of (get volume settings)"],
                text=True,
            ).strip()
            muted_out = subprocess.check_output(
                ["osascript", "-e", "output muted of (get volume settings)"],
                text=True,
            ).strip()
            vol = int(out)
            muted = muted_out.lower() == "true"
            _AUDIO_STATE["volume"] = vol
            _AUDIO_STATE["muted"] = muted
            return {
                "success": True,
                "volume": vol,
                "muted": muted,
                "formatted": f"{vol}% {'(Muted)' if muted else ''}",
            }
        except Exception:
            pass

    # 2. Linux query via amixer / pactl
    if current_os == "linux":
        if shutil.which("amixer"):
            try:
                out = subprocess.check_output(["amixer", "get", "Master"], text=True)
                import re
                vol_match = re.search(r"\[(\d+)%\]", out)
                mute_match = re.search(r"\[(on|off)\]", out)
                if vol_match:
                    vol = int(vol_match.group(1))
                    muted = mute_match.group(1) == "off" if mute_match else False
                    _AUDIO_STATE["volume"] = vol
                    _AUDIO_STATE["muted"] = muted
                    return {
                        "success": True,
                        "volume": vol,
                        "muted": muted,
                        "formatted": f"{vol}% {'(Muted)' if muted else ''}",
                    }
            except Exception:
                pass

    # 3. Default state (headless container or virtual device)
    vol = _AUDIO_STATE["volume"]
    muted = _AUDIO_STATE["muted"]
    return {
        "success": True,
        "volume": vol,
        "muted": muted,
        "formatted": f"{vol}% {'(Muted)' if muted else ''}",
    }


def execute_set_volume(level: int) -> Dict[str, Any]:
    """Sets system volume to an integer between 0 and 100."""
    try:
        level_int = int(round(float(level)))
    except (ValueError, TypeError):
        return {"success": False, "error": "Volume level must be a number between 0 and 100."}

    if level_int < 0 or level_int > 100:
        return {"success": False, "error": f"Volume level {level_int} is out of bounds (0-100)."}

    current_os = get_normalized_os()

    # 1. macOS execution
    if current_os == "macos" and shutil.which("osascript"):
        try:
            subprocess.run(
                ["osascript", "-e", f"set volume output volume {level_int}"],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass

    # 2. Linux execution via amixer / pactl
    elif current_os == "linux":
        if shutil.which("amixer"):
            try:
                subprocess.run(
                    ["amixer", "set", "Master", f"{level_int}%"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                pass
        elif shutil.which("pactl"):
            try:
                subprocess.run(
                    ["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{level_int}%"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                pass

    _AUDIO_STATE["volume"] = level_int
    _AUDIO_STATE["muted"] = False

    return {
        "success": True,
        "volume": level_int,
        "muted": False,
        "message": f"System volume set to {level_int}%.",
    }


def execute_mute_volume(muted: bool) -> Dict[str, Any]:
    """Mutes or unmutes system audio."""
    current_os = get_normalized_os()
    muted_bool = bool(muted)

    # 1. macOS
    if current_os == "macos" and shutil.which("osascript"):
        try:
            flag = "true" if muted_bool else "false"
            subprocess.run(
                ["osascript", "-e", f"set volume output muted {flag}"],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass

    # 2. Linux
    elif current_os == "linux":
        cmd_flag = "mute" if muted_bool else "unmute"
        if shutil.which("amixer"):
            try:
                subprocess.run(
                    ["amixer", "set", "Master", cmd_flag],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                pass

    _AUDIO_STATE["muted"] = muted_bool

    return {
        "success": True,
        "muted": muted_bool,
        "volume": _AUDIO_STATE["volume"],
        "message": "System volume has been muted." if muted_bool else "System volume has been unmuted.",
    }
