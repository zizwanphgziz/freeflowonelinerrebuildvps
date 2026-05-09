from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
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
