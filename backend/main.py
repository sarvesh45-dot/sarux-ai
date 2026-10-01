"""
SaruX Local System Control Agent Server.
Binds strictly to localhost (127.0.0.1:8000) for secure local system control.
Supports FastAPI if available, or falls back to Python's robust standard library HTTP server.
"""

import sys
import os
import json
import platform
from typing import Dict, Any

# Ensure backend root is on Python sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from agent.system_agent import system_agent
from agent.platform_info import get_normalized_os
from tools.system import execute_get_system_information, execute_get_battery_status
from tools.volume import execute_get_volume

HOST = os.environ.get("LOCAL_AGENT_HOST", "127.0.0.1")
PORT = int(os.environ.get("LOCAL_AGENT_PORT", "8000"))

# Check if fastapi is available
USE_FASTAPI = False
try:
    import fastapi
    import uvicorn
    USE_FASTAPI = True
except ImportError:
    USE_FASTAPI = False


if USE_FASTAPI:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse

    app = FastAPI(title="SaruX Local System Agent", version="1.0.0-step6")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    @app.get("/api/status")
    def health_check():
        return {
            "status": "online",
            "agent": "SaruX Local System Agent",
            "version": "1.0.0-step6",
            "platform": get_normalized_os(),
            "os": platform.system(),
            "host": HOST,
            "port": PORT,
        }

    @app.get("/api/system/info")
    def get_info():
        return execute_get_system_information()

    @app.get("/api/system/battery")
    def get_battery():
        return execute_get_battery_status()

    @app.get("/api/system/volume")
    def get_vol():
        return execute_get_volume()

    @app.post("/api/tools/execute")
    async def run_tool(request: Request):
        try:
            body = await request.json()
            tool_name = body.get("name") or body.get("tool")
            args = body.get("args", {})
            confirmed = bool(body.get("confirmed", False))
            return system_agent.execute(tool_name, args, confirmed)
        except Exception as e:
            return JSONResponse(status_code=400, content={"success": False, "error": str(e)})

    def run():
        print(f"[SaruX Local Agent] Starting FastAPI server on http://{HOST}:{PORT}")
        uvicorn.run(app, host=HOST, port=PORT, log_level="info")

else:
    # Standard Library HTTP server (Zero dependencies required)
    from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
    from urllib.parse import urlparse

    class SaruXLocalHandler(BaseHTTPRequestHandler):
        def _send_json(self, status_code: int, data: Dict[str, Any]):
            body = json.dumps(data).encode("utf-8")
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.end_headers()

        def do_GET(self):
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/")

            if path in ("", "/health", "/api/status"):
                self._send_json(200, {
                    "status": "online",
                    "agent": "SaruX Local System Agent",
                    "version": "1.0.0-step6",
                    "platform": get_normalized_os(),
                    "os": platform.system(),
                    "host": HOST,
                    "port": PORT,
                })
            elif path == "/api/system/info":
                self._send_json(200, execute_get_system_information())
            elif path == "/api/system/battery":
                self._send_json(200, execute_get_battery_status())
            elif path == "/api/system/volume":
                self._send_json(200, execute_get_volume())
            else:
                self._send_json(404, {"error": f"Endpoint not found: {path}"})

        def do_POST(self):
            parsed = urlparse(self.path)
            path = parsed.path.rstrip("/")

            if path == "/api/tools/execute":
                try:
                    content_len = int(self.headers.get("Content-Length", 0))
                    raw_body = self.rfile.read(content_len).decode("utf-8")
                    data = json.loads(raw_body) if raw_body else {}
                    tool_name = data.get("name") or data.get("tool")
                    args = data.get("args", {})
                    confirmed = bool(data.get("confirmed", False))

                    result = system_agent.execute(tool_name, args, confirmed)
                    self._send_json(200, result)
                except Exception as e:
                    self._send_json(400, {"success": False, "error": f"Malformed request: {str(e)}"})
            else:
                self._send_json(404, {"error": f"Endpoint not found: {path}"})

        def log_message(self, format, *args):
            # Compact log format
            sys.stdout.write(f"[SaruX Local Agent] {self.address_string()} - {format % args}\n")
            sys.stdout.flush()

    def run():
        server_address = (HOST, PORT)
        httpd = ThreadingHTTPServer(server_address, SaruXLocalHandler)
        print(f"[SaruX Local Agent] Running on http://{HOST}:{PORT} (OS: {platform.system()})")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[SaruX Local Agent] Shutting down.")
            httpd.server_close()


if __name__ == "__main__":
    run()
