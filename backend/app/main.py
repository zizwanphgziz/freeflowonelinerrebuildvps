from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncssh
import asyncio
import json
import base64
import stat as stat_module

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

MAX_CHUNK_SIZE = 512 * 1024  # 512KB chunks for file transfer


async def build_ssh_connection(config: dict) -> asyncssh.SSHClientConnection:
    host = config.get("host", "")
    port = int(config.get("port", 22))
    username = config.get("username", "root")
    password = config.get("password", "")
    private_key = config.get("privateKey", "")

    if not host:
        raise ValueError("Host is required")

    connect_kwargs: dict = {
        "host": host,
        "port": port,
        "username": username,
        "known_hosts": None,
    }

    if private_key:
        key = asyncssh.import_private_key(private_key)
        connect_kwargs["client_keys"] = [key]
    elif password:
        connect_kwargs["password"] = password
    else:
        raise ValueError("Password or private key is required")

    return await asyncio.wait_for(
        asyncssh.connect(**connect_kwargs),
        timeout=15,
    )


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
async def sftp_endpoint(websocket: WebSocket):
    await websocket.accept()

    conn = None
    sftp = None

    try:
        init_data = await websocket.receive_text()
        config = json.loads(init_data)

        await websocket.send_text(json.dumps({
            "type": "status",
            "data": f"Connecting to {config.get('host', '')}:{config.get('port', 22)}...",
        }))

        try:
            conn = await build_ssh_connection(config)
        except asyncio.TimeoutError:
            await websocket.send_text(json.dumps({
                "type": "error",
                "data": f"Connection timed out to {config.get('host', '')}",
            }))
            await websocket.close()
            return
        except asyncssh.PermissionDenied:
            await websocket.send_text(json.dumps({
                "type": "error",
                "data": "Authentication failed. Check username/password.",
            }))
            await websocket.close()
            return
        except Exception as e:
            await websocket.send_text(json.dumps({
                "type": "error",
                "data": f"Connection failed: {str(e)}",
            }))
            await websocket.close()
            return

        sftp = await conn.start_sftp_client()

        await websocket.send_text(json.dumps({
            "type": "connected",
            "data": "File Manager ready",
        }))

        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            action = msg.get("action", "")
            req_id = msg.get("id", "")

            try:
                if action == "list":
                    path = msg.get("path", "/")
                    entries = await sftp.readdir(path)
                    files = []
                    for entry in entries:
                        name = entry.filename
                        if name in (".", ".."):
                            continue
                        attrs = entry.attrs
                        is_dir = stat_module.S_ISDIR(attrs.permissions) if attrs.permissions is not None else False
                        is_link = stat_module.S_ISLNK(attrs.permissions) if attrs.permissions is not None else False
                        files.append({
                            "name": name,
                            "size": attrs.size if attrs.size is not None else 0,
                            "modified": attrs.mtime if attrs.mtime is not None else 0,
                            "isDir": is_dir,
                            "isLink": is_link,
                            "permissions": oct(attrs.permissions)[2:] if attrs.permissions is not None else "",
                        })
                    files.sort(key=lambda f: (not f["isDir"], f["name"].lower()))
                    await websocket.send_text(json.dumps({
                        "type": "result",
                        "id": req_id,
                        "action": "list",
                        "data": files,
                        "path": path,
                    }))

                elif action == "download":
                    file_path = msg.get("path", "")
                    file_stat = await sftp.stat(file_path)
                    file_size = file_stat.size if file_stat.size is not None else 0
                    async with sftp.open(file_path, "rb") as f:
                        offset = 0
                        chunk_index = 0
                        total_chunks = max(1, (file_size + MAX_CHUNK_SIZE - 1) // MAX_CHUNK_SIZE) if file_size > 0 else 1
                        while True:
                            chunk = await f.read(MAX_CHUNK_SIZE)
                            if not chunk:
                                break
                            encoded = base64.b64encode(chunk).decode("ascii")
                            await websocket.send_text(json.dumps({
                                "type": "result",
                                "id": req_id,
                                "action": "download_chunk",
                                "data": encoded,
                                "chunk": chunk_index,
                                "totalChunks": total_chunks,
                                "fileSize": file_size,
                                "path": file_path,
                            }))
                            offset += len(chunk)
                            chunk_index += 1
                    await websocket.send_text(json.dumps({
                        "type": "result",
                        "id": req_id,
                        "action": "download_complete",
                        "path": file_path,
                        "fileSize": file_size,
                    }))

                elif action == "upload_chunk":
                    file_path = msg.get("path", "")
                    chunk_data = msg.get("data", "")
                    chunk_index = msg.get("chunk", 0)
                    total_chunks = msg.get("totalChunks", 1)
                    decoded = base64.b64decode(chunk_data)
                    mode = "wb" if chunk_index == 0 else "ab"
                    async with sftp.open(file_path, mode) as f:
                        if mode == "ab":
                            await f.seek(0, 2)  # seek to end
                        await f.write(decoded)
                    if chunk_index + 1 >= total_chunks:
                        await websocket.send_text(json.dumps({
                            "type": "result",
                            "id": req_id,
                            "action": "upload_complete",
                            "path": file_path,
                        }))
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "result",
                            "id": req_id,
                            "action": "upload_progress",
                            "chunk": chunk_index,
                            "totalChunks": total_chunks,
                        }))

                elif action == "delete":
                    file_path = msg.get("path", "")
                    is_dir = msg.get("isDir", False)
                    if is_dir:
                        # Recursive delete for directories
                        async def rm_recursive(p: str) -> None:
                            entries = await sftp.readdir(p)
                            for entry in entries:
                                if entry.filename in (".", ".."):
                                    continue
                                child = p.rstrip("/") + "/" + entry.filename
                                if entry.attrs.permissions is not None and stat_module.S_ISDIR(entry.attrs.permissions):
                                    await rm_recursive(child)
                                else:
                                    await sftp.remove(child)
                            await sftp.rmdir(p)
                        await rm_recursive(file_path)
                    else:
                        await sftp.remove(file_path)
                    await websocket.send_text(json.dumps({
                        "type": "result",
                        "id": req_id,
                        "action": "delete",
                        "path": file_path,
                    }))

                elif action == "rename":
                    old_path = msg.get("oldPath", "")
                    new_path = msg.get("newPath", "")
                    await sftp.rename(old_path, new_path)
                    await websocket.send_text(json.dumps({
                        "type": "result",
                        "id": req_id,
                        "action": "rename",
                        "oldPath": old_path,
                        "newPath": new_path,
                    }))

                elif action == "mkdir":
                    dir_path = msg.get("path", "")
                    await sftp.mkdir(dir_path)
                    await websocket.send_text(json.dumps({
                        "type": "result",
                        "id": req_id,
                        "action": "mkdir",
                        "path": dir_path,
                    }))

                elif action == "stat":
                    file_path = msg.get("path", "")
                    attrs = await sftp.stat(file_path)
                    await websocket.send_text(json.dumps({
                        "type": "result",
                        "id": req_id,
                        "action": "stat",
                        "data": {
                            "size": attrs.size if attrs.size is not None else 0,
                            "modified": attrs.mtime if attrs.mtime is not None else 0,
                            "isDir": stat_module.S_ISDIR(attrs.permissions) if attrs.permissions is not None else False,
                            "permissions": oct(attrs.permissions)[2:] if attrs.permissions is not None else "",
                        },
                    }))

                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "id": req_id,
                        "data": f"Unknown action: {action}",
                    }))

            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "id": req_id,
                    "data": str(e),
                }))

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
