# Freeflow Project — Progress Log

This file records all milestones, features implemented, and technical decisions made during the Freeflow project development. Preserved for project continuity on any platform.

---

## Project Overview

**Freeflow** is a futuristic VPS management web application with two main sections:
1. **OS Rebuild** — One-liner scripts to reinstall any OS on a VPS (powered by bin456789/reinstall)
2. **One-Clicked VPS Setup** — Web-based SSH terminal with one-click tools for VPN hosting

---

## Milestone 1: Initial Website Build
**Status:** Completed

- Built React + TypeScript + Vite + Tailwind CSS website
- 13 Linux distros (Debian, Ubuntu, CentOS, AlmaLinux, Rocky, Fedora, Arch, openSUSE, Alpine, Oracle, Gentoo, NixOS, Kali) + 5 Windows editions
- Each OS has copy-paste one-liner rebuild scripts
- Dark futuristic UI with slate-950 background, emerald (#14F5C8) and cyan (#0EA5E9) accents
- Responsive design for mobile and desktop
- Deployed to: https://vps-rebuild-generator-1wtylodn.devinapps.com

---

## Milestone 2: GitHub Repo & GitHub Pages
**Status:** Completed

- Pushed to Ahmad's personal GitHub: https://github.com/zizwanphgziz/freeflowonelinerrebuildvps
- Set up GitHub Pages deployment (gh-pages branch)
- Live at: https://zizwanphgziz.github.io/freeflowonelinerrebuildvps/
- GitHub button in header links to repo
- Proper README with credits to bin456789/reinstall

---

## Milestone 3: SSH Terminal (Like Termius)
**Status:** Completed

### Backend (FastAPI + asyncssh)
- WebSocket-based SSH proxy server
- Endpoint: `ws://HOST:8000/ws/ssh?host=X&port=Y&username=Z&password=W`
- Health check: `GET /healthz`
- Runs on user's VPS at port 8000
- Setup guide: `BACKEND_SETUP.md`

### Frontend (xterm.js)
- Full web-based terminal emulator
- Host Manager — save/edit/delete multiple VPS hosts (stored in localStorage)
- Password caching per host (auto-fills on reconnect)
- Backend URL configuration via Settings

### Files:
- `backend/app/main.py` — FastAPI backend
- `backend/requirements.txt` — Python dependencies (fastapi, asyncssh, uvicorn, websockets)
- `src/SetupPage.tsx` — All SSH terminal + one-click tools UI
- `BACKEND_SETUP.md` — Backend deployment guide

---

## Milestone 4: Terminal UX (Mobile-First)
**Status:** Completed

### Fullscreen Mode
- Full viewport terminal overlay (like Termius)
- Auto-sized font for maximum columns on any screen width
- Toggle between fullscreen terminal and tool cards view
- Green keyboard icon (floating, bottom-right) to toggle keyboard toolbar

### Keyboard Toolbar
- Special keys: Ctrl, Tab, Esc, Up/Down/Left/Right arrows
- Paste button (reads clipboard)
- Select Text mode — dumps terminal buffer to scrollable textarea for mobile text selection
- Hidden by default, toggle via floating keyboard icon

### Terminal Features
- Clean default view when connected (status card, not auto-open terminal)
- 2-column tool grid layout (like Termius menu)
- Timezone dropdown with 25+ global timezones
- Password cache per saved host

---

## Milestone 5: One-Click VPN Tools
**Status:** Completed

Added 18+ VPN management tools organized in categories:

### VPN Diagnostics & Monitoring
- Check All VPN Services — status of xray, dropbear, ssh, fail2ban, nginx, caddy
- Show Active Connections — SSH/Dropbear sessions + Xray connections
- Monitor Bandwidth Live — vnstat real-time traffic
- Check Certificate Expiry — SSL/TLS cert dates
- Test All VPN Ports — auto-detect open ports
- Show Port Usage — process-to-port mapping

### VPN Maintenance
- Restart All VPN Services — one-click restart all detected services
- Clear VPN Logs — purge old logs to free disk space
- Renew SSL Certificate — force-renew Let's Encrypt/ACME
- Update Xray Core — update to latest xray-core version
- Validate Xray Config — test config for errors before restart

### VPN Security
- Block IP Address — iptables block abusive IPs
- Show Failed Logins — brute force detection from auth logs
- Install Fail2ban — auto-ban after 5 failed attempts

### VPN Performance Boost
- Enable TCP BBR — Google BBR congestion control
- Optimize Network (sysctl) — VPN-optimized kernel settings
- Clear RAM Cache — free cached memory

### VPN User Management
- List VPN Users — parse xray config for `### username expiry-date` format, show status + active IPs per user

---

## Milestone 6: Server Setup & General Tools
**Status:** Completed

### Server Setup & Hardening
- Create 1GB/2GB/4GB Swap
- Set Timezone (dropdown with 25+ options)
- DNS: Cloudflare (1.1.1.1) / Google (8.8.8.8)

### Networking & Proxy
- Install Docker
- Install WireGuard
- Install Nginx

### Diagnostics & Monitoring
- Speedtest
- YABS Benchmark
- System Info
- Disk Usage
- Open Ports

### Application Installers
- Install MySQL
- Install PostgreSQL
- Install Redis
- Install Node.js LTS

### Backup & Recovery
- Backup /etc
- Backup /home

---

## Milestone 7: OS Rebuild Tab Revamp
**Status:** Completed

- Changed from flat list to category drill-down (like front page)
- Shows 20 OS categories first (with icons and descriptions)
- Tap OS category to see available versions
- Each version shows full one-liner script
- Linux tab and Windows tab separation
- Back navigation between categories and versions

---

## Milestone 8: Generic VPN Tool Compatibility
**Status:** Completed

- Removed all JinGGo-specific hardcoded references
- All VPN tools now auto-detect:
  - Xray config at `/usr/local/etc/xray/config.json` OR `/etc/xray/config.json` OR `/etc/v2ray/config.json`
  - SSL tools (certbot or acme.sh)
  - All VPN services dynamically checked
- Tools work with ANY autoscript, not just JinGGo

---

## Milestone 9: VPN Autoscript Research
**Status:** Completed

Comprehensive research document (`vpn-autoscript-research.md`) with 24+ open-source VPN autoscript installers organized by popularity in MY/SEA community:

### Tier 1 (Most Popular):
1. **Dotycat** (dotywrt/doty) — 28 stars, active 2026
2. **Vinstech** (vinstechmy) — 5 script variants, 30 stars (Lite)
3. **Decode** (DecodeXOfficial/Reality) — new March 2026, VLess-only
4. **Rerechan/FN Project** (FN-Rerechan02/scvps) — 23 stars, ALL OS
5. **JinGGo** — reference only (free version outdated, premium via Telegram)

### Tier 2-5: 19 more scripts including GegeVPS, KingKongVPN, Netz-Xray, 233boy, jinwyp, etc.

---

## Milestone 10: VPN Autoscript Installers as One-Click Tools
**Status:** Completed

Added 21 VPN autoscript installers as one-click tools in the Freeflow website under new `vpn-autoscript` category:

1. Dotycat Tunnel — VLESS/VMess/Trojan WS/gRPC/xHTTP + SSH WS + OpenVPN (28 stars)
2. Vinstech Lite — VLESS/VMess/Trojan WS/gRPC + SSH + SlowDNS (30 stars)
3. Vinstech MiniXLite — VLESS/VMess/Trojan + SSH + NoobzVPN
4. Vinstech Multiport — VLESS/VMess/Trojan + SSH + NoobzVPN + multi-port
5. Decode Reality — VLess Reality + VLess WS (modern Xray-core)
6. FN Project (Rerechan) — VLESS/VMess/Trojan/SS + SSH + ALL OS (23 stars)
7. DarQan Script — SSH WS + VLESS WS, IP/data limits, auto-delete
8. GegeVPS — VLESS/VMess/Trojan/SS2022 + SSH + OpenVPN
9. KingKongVPN — SSH + VLESS/VMess/Trojan WS/gRPC + OpenVPN
10. Netz-Xray — 110 contributors, SSH + VLESS/VMess/Trojan (62 stars)
11. GIVPN — Xray VLESS/VMess/Trojan/SS + SSH + UDP
12. FarellVPN — VLESS/VMess/Trojan + SSH + modern UI
13. SL Mantap AIO — SSH + VLESS/VMess/Trojan + SlowDNS
14. PR Aiman AIO — 13+ protocols, SSH + Xray + OpenVPN + WireGuard
15. SCVPS AIO — SSH + Xray VLESS/VMess/Trojan + SlowDNS
16. Caliph Dev — VLESS/Trojan WS/gRPC + SSH + multi-panel
17. 233boy Xray — 2.2K stars, VLESS/VMess/Trojan/SS/Reality
18. One Click Script — 5.1K stars, Xray + Nginx + Cloudflare
19. afandiazmi 8-in-1 — SSH/VLESS/VMess/Trojan/SS/OpenVPN/WireGuard/SlowDNS
20. SenoVPN — SSH + VLESS/VMess WS + NoobzVPN
21. RasCom AIO — SSH + VLESS/VMess/Trojan + SlowDNS + UDP
22. GIVPS + Tor — SSH + V2Ray + OpenVPN + Tor relay

Also researched and added darul-itqan/Auto-Script-VPS-SSH-WS-VLESS-WS (DarQan Script) to research document.

---

## Milestone 11: Project Documentation
**Status:** Completed

- `Chat.md` — Full session conversation history (14 sessions documented)
- `Progress.md` — This file, all milestones and progress (11 milestones)
- `vpn-autoscript-research.md` — 25 open-source VPN autoscript installers researched
- All documentation updated after VPN autoscript implementation

---

## Technical Architecture

```
freeflowonelinerrebuildvps/
├── src/
│   ├── App.tsx           — Main app with tab navigation (OS Rebuild / One-Clicked VPS Setup)
│   ├── App.css           — Global styles
│   └── SetupPage.tsx     — SSH terminal + one-click tools (1768+ lines, includes 21 VPN autoscript installers)
├── backend/
│   ├── app/
│   │   └── main.py       — FastAPI WebSocket SSH proxy
│   └── requirements.txt  — Python dependencies
├── public/               — Static assets
├── dist/                 — Build output (deployed to gh-pages)
├── .github/
│   └── workflows/
│       └── deploy.yml    — GitHub Actions for gh-pages deployment
├── BACKEND_SETUP.md      — Backend deployment guide
├── Chat.md               — Session conversation log
├── Progress.md           — This file
├── README.md             — Project README
├── index.html            — Vite entry point
├── vite.config.ts        — Vite config (base: /freeflowonelinerrebuildvps/)
├── tailwind.config.js    — Tailwind CSS config
├── tsconfig.json         — TypeScript config
└── package.json          — Node dependencies
```

## Deployment

| Target | URL | Method |
|---|---|---|
| GitHub Pages | https://zizwanphgziz.github.io/freeflowonelinerrebuildvps/ | gh-pages branch via GitHub Actions |
| Devin Deploy | https://vps-rebuild-generator-1wtylodn.devinapps.com | Static frontend deploy |
| Backend | http://43.245.60.203:8000 | FastAPI on Ahmad's VPS |

## Git Branches

| Branch | Purpose |
|---|---|
| `main` | Stable release |
| `devin/initial-setup` | Feature branch (PR #1) |
| `gh-pages` | Built output for GitHub Pages |

## PR History

- **PR #1:** "Add Freeflow One-Clicked VPS Setup with SSH Terminal & One-Click Tools"
  - URL: https://github.com/zizwanphgziz/freeflowonelinerrebuildvps/pull/1
  - Includes: SSH terminal, host manager, one-click tools, OS rebuild revamp, VPN tools

## Ahmad's VPS Details

- **IP:** 43.245.60.203
- **Port:** 22
- **Domain:** madvpn.dpdns.org
- **VPN Script:** JinGGo (premium version, paid via Telegram)
- **Backend Port:** 8000 (Freeflow backend)
- **VPN Ports in use:** 80 (xray non-TLS), 443 (xray TLS), 8080 (xray xHTTP), plus SSH/Dropbear/Stunnel ports

## Key Technical Decisions

1. **No Caddy** — Caddy reverse proxy conflicts with VPN ports 80/443. Backend runs on plain HTTP port 8000.
2. **HTTP backend** — Mixed content (HTTPS frontend + HTTP backend) solved by using Devin-deployed frontend (also HTTP-capable).
3. **localStorage** — Host manager and settings stored in browser localStorage (no server-side state needed).
4. **Generic VPN tools** — Auto-detect xray config paths, work with any autoscript.
5. **xterm.js** — Full terminal emulation in browser, same as Termius experience.
6. **WebSocket SSH proxy** — asyncssh handles SSH connection, WebSocket streams I/O to browser.
