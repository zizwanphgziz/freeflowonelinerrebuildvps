from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncssh
import asyncio
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.websocket("/ws/ssh")
async def ssh_terminal(websocket: WebSocket):
    await websocket.accept()

    conn = None
    process = None

    try:
        init_data = await websocket.receive_text()
        config = json.loads(init_data)

        host = config.get("host", "")
        port = int(config.get("port", 22))
        username = config.get("username", "root")
        password = config.get("password", "")
        private_key = config.get("privateKey", "")

        if not host:
            await websocket.send_text(json.dumps({"type": "error", "data": "Host is required"}))
            await websocket.close()
            return

        connect_kwargs: dict = {
            "host": host,
            "port": port,
            "username": username,
            "known_hosts": None,
        }

        if private_key:
            try:
                key = asyncssh.import_private_key(private_key)
                connect_kwargs["client_keys"] = [key]
            except Exception as e:
                await websocket.send_text(json.dumps({"type": "error", "data": f"Invalid private key: {str(e)}"}))
                await websocket.close()
                return
        elif password:
            connect_kwargs["password"] = password
        else:
            await websocket.send_text(json.dumps({"type": "error", "data": "Password or private key is required"}))
            await websocket.close()
            return

        await websocket.send_text(json.dumps({"type": "status", "data": f"Connecting to {host}:{port}..."}))

        try:
            conn = await asyncio.wait_for(
                asyncssh.connect(**connect_kwargs),
                timeout=15,
            )
        except asyncio.TimeoutError:
            await websocket.send_text(json.dumps({"type": "error", "data": f"Connection timed out to {host}:{port}"}))
            await websocket.close()
            return
        except asyncssh.PermissionDenied:
            await websocket.send_text(json.dumps({"type": "error", "data": "Authentication failed. Check username/password."}))
            await websocket.close()
            return
        except Exception as e:
            await websocket.send_text(json.dumps({"type": "error", "data": f"Connection failed: {str(e)}"}))
            await websocket.close()
            return

        await websocket.send_text(json.dumps({"type": "status", "data": "Connected! Starting terminal..."}))

        process = await conn.create_process(
            term_type="xterm-256color",
            term_size=(120, 40),
        )

        await websocket.send_text(json.dumps({"type": "connected", "data": "Terminal ready"}))

        async def read_stdout():
            try:
                while True:
                    data = await process.stdout.read(4096)
                    if not data:
                        break
                    await websocket.send_text(json.dumps({"type": "output", "data": data}))
            except Exception:
                pass

        async def read_stderr():
            try:
                while True:
                    data = await process.stderr.read(4096)
                    if not data:
                        break
                    await websocket.send_text(json.dumps({"type": "output", "data": data}))
            except Exception:
                pass

        stdout_task = asyncio.create_task(read_stdout())
        stderr_task = asyncio.create_task(read_stderr())

        try:
            while True:
                raw = await websocket.receive_text()
                msg = json.loads(raw)

                if msg.get("type") == "input":
                    process.stdin.write(msg.get("data", ""))
                elif msg.get("type") == "resize":
                    cols = msg.get("cols", 120)
                    rows = msg.get("rows", 40)
                    process.change_terminal_size(cols, rows)
                elif msg.get("type") == "execute":
                    cmd = msg.get("data", "")
                    if cmd:
                        process.stdin.write(cmd + "\n")
        except WebSocketDisconnect:
            pass
        finally:
            stdout_task.cancel()
            stderr_task.cancel()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "data": str(e)}))
        except Exception:
            pass
    finally:
        if process:
            try:
                process.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


@app.websocket("/ws/sftp")
async def sftp_browser(websocket: WebSocket):
    """Minimal SFTP-over-WebSocket gateway used by the Freeflow mobile File Manager.

    Protocol (JSON over WS):
      First message:  {host, port, username, password|privateKey}
      Then commands:  {type: "list" | "read" | "delete" | "mkdir", path, isDirectory?}
      Server emits:   {type: "connected"} on auth success
                      {type: "list", data: [{name, path, isDirectory, size}]}
                      {type: "file_content", name, data}
                      {type: "success"} after delete/mkdir
                      {type: "error", data}
    """
    await websocket.accept()

    conn = None
    sftp = None

    try:
        init_data = await websocket.receive_text()
        config = json.loads(init_data)

        host = config.get("host", "")
        port = int(config.get("port", 22))
        username = config.get("username", "root")
        password = config.get("password", "")
        private_key = config.get("privateKey", "")

        if not host:
            await websocket.send_text(json.dumps({"type": "error", "data": "Host is required"}))
            await websocket.close()
            return

        connect_kwargs: dict = {
            "host": host,
            "port": port,
            "username": username,
            "known_hosts": None,
        }

        if private_key:
            try:
                key = asyncssh.import_private_key(private_key)
                connect_kwargs["client_keys"] = [key]
            except Exception as e:
                await websocket.send_text(json.dumps({"type": "error", "data": f"Invalid private key: {e}"}))
                await websocket.close()
                return
        elif password:
            connect_kwargs["password"] = password
        else:
            await websocket.send_text(json.dumps({"type": "error", "data": "Password or private key is required"}))
            await websocket.close()
            return

        try:
            conn = await asyncio.wait_for(asyncssh.connect(**connect_kwargs), timeout=15)
        except asyncio.TimeoutError:
            await websocket.send_text(json.dumps({"type": "error", "data": f"Connection timed out to {host}:{port}"}))
            await websocket.close()
            return
        except asyncssh.PermissionDenied:
            await websocket.send_text(json.dumps({"type": "error", "data": "Authentication failed. Check username/password."}))
            await websocket.close()
            return
        except Exception as e:
            await websocket.send_text(json.dumps({"type": "error", "data": f"Connection failed: {e}"}))
            await websocket.close()
            return

        sftp = await conn.start_sftp_client()
        await websocket.send_text(json.dumps({"type": "connected", "data": "SFTP ready"}))

        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                continue

            op = msg.get("type")
            path = msg.get("path") or "/"

            try:
                if op == "list":
                    entries = []
                    for name in await sftp.listdir(path):
                        if name in (".", ".."):
                            continue
                        item_path = path.rstrip("/") + "/" + name if path != "/" else "/" + name
                        try:
                            attrs = await sftp.stat(item_path)
                            is_dir = bool(attrs.permissions and (attrs.permissions & 0o040000))
                            size = int(attrs.size or 0)
                        except Exception:
                            is_dir = False
                            size = 0
                        entries.append({
                            "name": name,
                            "path": item_path,
                            "isDirectory": is_dir,
                            "size": size,
                        })
                    entries.sort(key=lambda e: (not e["isDirectory"], e["name"].lower()))
                    await websocket.send_text(json.dumps({"type": "list", "data": entries, "path": path}))

                elif op == "read":
                    try:
                        attrs = await sftp.stat(path)
                        if attrs.size and attrs.size > 2 * 1024 * 1024:
                            await websocket.send_text(json.dumps({"type": "error", "data": "File too large to view (>2MB)."}))
                            continue
                    except Exception:
                        pass
                    async with sftp.open(path, "rb") as fh:
                        raw_bytes = await fh.read()
                    try:
                        text = raw_bytes.decode("utf-8")
                    except UnicodeDecodeError:
                        text = "(binary file – not previewable)"
                    name = path.rsplit("/", 1)[-1] or path
                    await websocket.send_text(json.dumps({"type": "file_content", "name": name, "data": text}))

                elif op == "delete":
                    is_dir = bool(msg.get("isDirectory"))
                    if is_dir:
                        await sftp.rmtree(path)
                    else:
                        await sftp.remove(path)
                    await websocket.send_text(json.dumps({"type": "success", "data": f"Deleted {path}"}))

                elif op == "mkdir":
                    await sftp.makedirs(path, exist_ok=True)
                    await websocket.send_text(json.dumps({"type": "success", "data": f"Created {path}"}))

                else:
                    await websocket.send_text(json.dumps({"type": "error", "data": f"Unknown op: {op}"}))

            except Exception as e:
                await websocket.send_text(json.dumps({"type": "error", "data": str(e)}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "data": str(e)}))
        except Exception:
            pass
    finally:
        if sftp:
            try:
                sftp.exit()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


# Serve frontend static files if the static directory exists
if STATIC_DIR.is_dir():
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        index = STATIC_DIR / "index.html"
        if index.is_file():
            return FileResponse(index)
        return {"detail": "Not found"}

    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")
