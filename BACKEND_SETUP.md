# Freeflow Backend Setup Guide

Set up the Freeflow backend on a new or rebuilt VPS. This backend powers the **One-Clicked VPS Setup** feature — a web-based SSH terminal with one-click tools.

## Quick Setup (5 Commands)

Run these on your VPS as `root`:

```bash
# 1. Install dependencies
apt update && apt install -y git python3-venv lsof

# 2. Clone the repo
git clone https://github.com/zizwanphgziz/freeflowonelinerrebuildvps.git

# 3. Set up Python virtual environment
cd ~/freeflowonelinerrebuildvps/backend
python3 -m venv venv
source venv/bin/activate

# 4. Install Python packages
pip install fastapi asyncssh uvicorn websockets

# 5. Start the backend (runs in background)
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

## Verify It's Running

```bash
curl http://localhost:8000/healthz
```

Should return: `{"status":"ok"}`

## Access the Website

Open in your browser:

```
http://YOUR_VPS_IP:8000
```

The backend serves both the API and the frontend — everything runs on port 8000.

## Important Notes

- **Port 8000 only** — Does NOT conflict with VPN ports (80, 443, 8080, etc.)
- **No Caddy/Nginx needed** — The backend serves the frontend directly
- **No HTTPS needed** — Works over plain HTTP since everything is on the same origin
- **JinGGo VPN compatible** — All one-click tools are tested with JinGGo autoscript

## Auto-Start on Boot (systemd) — Recommended

Set up the backend to auto-start on VPS boot and auto-restart if it crashes:

```bash
# 1. Copy the service file
cp ~/freeflowonelinerrebuildvps/backend/freeflow.service /etc/systemd/system/

# 2. Enable and start the service
systemctl daemon-reload
systemctl enable freeflow
systemctl start freeflow
```

Now the backend will:
- **Auto-start** every time your VPS reboots
- **Auto-restart** if it crashes (after 5 seconds)
- Run in the background as a proper system service

**If you were using `nohup` before**, stop the old process first:
```bash
kill $(lsof -t -i:8000) 2>/dev/null
systemctl start freeflow
```

## Managing the Backend (systemd)

```bash
# Check status
systemctl status freeflow

# View logs
journalctl -u freeflow -f

# Stop the backend
systemctl stop freeflow

# Restart the backend
systemctl restart freeflow

# Disable auto-start on boot
systemctl disable freeflow
```

## Managing the Backend (manual — without systemd)

```bash
# Check if backend is running
curl http://localhost:8000/healthz

# Stop the backend
kill $(lsof -t -i:8000)

# Restart the backend
cd ~/freeflowonelinerrebuildvps/backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

## Updating to Latest Version

If the website code has been updated:

```bash
cd ~/freeflowonelinerrebuildvps
git pull origin devin/initial-setup
kill $(lsof -t -i:8000) 2>/dev/null
cd backend && source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

## Using a Custom Domain

If you have a domain (e.g., `madvpn.dpdns.org`), just point the DNS A record to your new VPS IP. Then access via:

```
http://madvpn.dpdns.org:8000
```

No additional configuration needed.

## Troubleshooting

| Problem | Solution |
|---|---|
| `python3 -m venv` fails | Run `apt install python3-venv` or `apt install python3.XX-venv` (replace XX with your Python version) |
| Port 8000 already in use | Run `kill $(lsof -t -i:8000)` then start again |
| `curl healthz` no response | Check if backend is running: `lsof -i:8000` |
| Website loads but SSH won't connect | Make sure port 22 is open on the target VPS |
| One-click tools show errors | Tools are designed for JinGGo VPN autoscript — some may not work with other setups |
