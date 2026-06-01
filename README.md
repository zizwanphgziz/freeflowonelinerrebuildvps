# Freeflow — VPS Management Hub

A futuristic web application for VPS management with two main sections:

1. **OS Rebuild** — One-liner scripts to reinstall any OS on a VPS
2. **One-Clicked VPS Setup** — Web-based SSH terminal with one-click tools, VPN diagnostics, and 21+ VPN autoscript installers

**Live Site:** [https://zizwanphgziz.github.io/freeflowonelinerrebuildvps](https://zizwanphgziz.github.io/freeflowonelinerrebuildvps)

---

## Features

### OS Rebuild (powered by [bin456789/reinstall](https://github.com/bin456789/reinstall))

| OS | Versions |
|---|---|
| Debian | 13, 12, 11, 10, 9 |
| Ubuntu | 26.04, 24.04, 22.04, 20.04, 18.04 |
| CentOS | 9 Stream, 8 Stream, 7 |
| AlmaLinux | 10, 9, 8 |
| Rocky Linux | 10, 9, 8 |
| Fedora | 44, 43, 42, 41, 40 |
| Arch, openSUSE, Alpine, Oracle, Gentoo, NixOS, Kali, Anolis, OpenCloudOS | Various |
| Windows Server | 2022, 2019, 2016 (Standard/Datacenter) |
| Windows | 11, 10 (Pro/Enterprise) |

### SSH Terminal (Like Termius)

- Web-based terminal emulator (xterm.js)
- Host Manager — save/edit/delete multiple VPS hosts (localStorage)
- Password caching per host (auto-fills on reconnect)
- Fullscreen terminal overlay with auto-sized font
- Mobile keyboard toolbar (Ctrl, Tab, Esc, arrows, paste, select text)
- Floating keyboard toggle icon

### One-Click VPN Tools (40+ tools in 7 categories)

- **VPN Diagnostics** — Check services, active connections, bandwidth, certs, ports
- **VPN Maintenance** — Restart services, clear logs, renew SSL, update Xray, validate config
- **VPN Security** — Block IPs, show failed logins, install Fail2ban
- **VPN Performance** — Enable BBR, optimize sysctl, clear RAM cache
- **VPN User Management** — List users with active IPs (auto-detects xray config format)
- **Server Setup** — Swap, timezone, DNS, Docker, WireGuard, Nginx
- **Diagnostics** — Speedtest, YABS benchmark, system info, disk usage

### VPN Autoscript Installers (21 scripts)

One-click installers for the most popular open-source VPN autoscripts:

| Script | Protocols | Stars |
|---|---|---|
| Dotycat Tunnel | VLESS/VMess/Trojan WS/gRPC/xHTTP + SSH WS + OpenVPN | 28 |
| Vinstech (3 variants) | VMess/VLess/Trojan WS/gRPC + SSH + SlowDNS | 30 |
| Decode Reality | VLess Reality + VLess WS | New |
| FN Project (Rerechan) | VMess/VLess/Trojan + NoobzVPN + SlowDNS + UDP | 23 |
| DarQan Script | SSH WS + VLess WS (IP/data limits) | 1 |
| GegeVPS | SSH/OpenVPN/Xray/WireGuard + SlowDNS | 54 |
| 233boy Xray | VLESS Reality/VMess/Trojan/SS2022 | 2.2K |
| One Click Script | V2Ray/Xray/Trojan-Go/WireGuard/SS | 5.1K |
| + 13 more | Various | Various |

---

## Self-Hosting (Recommended)

The backend serves both the API and the frontend on a single port. No Caddy/Nginx needed.

### Quick Setup

```bash
# 1. Install dependencies
apt update && apt install -y git python3-venv lsof

# 2. Clone the repo
git clone https://github.com/zizwanphgziz/freeflowonelinerrebuildvps.git

# 3. Set up Python environment
cd ~/freeflowonelinerrebuildvps/backend
python3 -m venv venv
source venv/bin/activate

# 4. Install Python packages
pip install fastapi asyncssh uvicorn websockets

# 5. Start the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then open `http://YOUR_VPS_IP:8000` in your browser.

### Auto-Start on Boot (systemd)

```bash
cp ~/freeflowonelinerrebuildvps/backend/freeflow.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable freeflow
systemctl start freeflow
```

The backend will auto-start on reboot and auto-restart if it crashes.

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for full setup guide, troubleshooting, and management commands.

---

## Development

### Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI + asyncssh + uvicorn (Python)
- **Terminal:** xterm.js with FitAddon
- **UI:** Dark slate (slate-950) with emerald (#14F5C8) and cyan (#0EA5E9) accents

### Local Development

```bash
# Frontend
npm install
npm run dev          # http://localhost:5173

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Build for Production

```bash
# For GitHub Pages (base: /freeflowonelinerrebuildvps/)
npm run build

# For self-hosting (base: /)
npx vite build --base / --outDir backend/static
```

---

## Project Structure

```
freeflowonelinerrebuildvps/
├── src/
│   ├── App.tsx              — OS Rebuild tab (main page)
│   └── SetupPage.tsx        — SSH terminal + one-click tools (1768+ lines)
├── backend/
│   ├── app/main.py          — FastAPI WebSocket SSH proxy + static file server
│   ├── static/              — Pre-built frontend (served by backend)
│   ├── freeflow.service     — systemd service file for auto-start
│   └── requirements.txt     — Python dependencies
├── Chat.md                  — Session conversation history (14 sessions)
├── Progress.md              — Project milestones (11 milestones)
├── BACKEND_SETUP.md         — Backend deployment guide
└── README.md                — This file
```

## Deployment

| Target | URL | Method |
|---|---|---|
| GitHub Pages | https://zizwanphgziz.github.io/freeflowonelinerrebuildvps/ | gh-pages branch |
| Self-hosted | http://YOUR_VPS_IP:8000 | FastAPI backend + systemd |

## Important Notes

- **Port 8000 only** — Does NOT conflict with VPN ports (80, 443, 8080)
- **No Caddy/Nginx needed** — Backend serves frontend directly
- **Works with any VPN autoscript** — All tools auto-detect xray config paths
- **Mobile-first design** — Fullscreen terminal, keyboard toolbar, touch-friendly

## Credits

- OS rebuild scripts powered by [bin456789/reinstall](https://github.com/bin456789/reinstall)
- VPN autoscript research covers 25+ open-source projects from the MY/SEA community

## License

MIT
