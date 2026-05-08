# Freeflow - One-Liner VPS Rebuilds

A futuristic web application that provides one-liner VPS OS rebuild scripts for all major Linux distributions and Windows editions. Just SSH into your VPS, copy the script, paste, and your OS rebuilds automatically — zero pre-setup needed.

**Live Site:** [https://vps-rebuild-generator-1wtylodn.devinapps.com](https://vps-rebuild-generator-1wtylodn.devinapps.com)

## Supported Operating Systems

### Linux Distributions

| OS | Versions |
|---|---|
| Debian | 13 (Trixie), 12, 11, 10, 9 |
| Ubuntu | 26.04 LTS, 24.04 LTS, 22.04 LTS, 20.04 LTS, 18.04 LTS |
| CentOS | 9 Stream, 8 Stream, 7 |
| AlmaLinux | 10, 9, 8 |
| Rocky Linux | 10, 9, 8 |
| Fedora | 44, 43, 42, 41, 40 |
| Arch Linux | Latest (Rolling) |
| openSUSE | Tumbleweed, 15.6 |
| Alpine Linux | 3.23, 3.22, 3.21, 3.20 |
| Oracle Linux | 10, 9, 8 |
| Gentoo | Latest (Rolling) |
| NixOS | 24.11, 24.05 |
| Kali Linux | Latest (Rolling) |
| Anolis OS | 23, 8, 7 |
| OpenCloudOS | 9, 8 |

### Windows Editions

| OS | Editions |
|---|---|
| Windows Server 2022 | Standard, Datacenter |
| Windows Server 2019 | Standard, Datacenter |
| Windows Server 2016 | Standard, Datacenter |
| Windows 11 | Pro, Enterprise |
| Windows 10 | Pro, Enterprise LTSC |

## How It Works

1. **Pick Your OS** — Browse the collection and choose your preferred version
2. **Copy the Script** — Each script includes automatic dependency setup (curl, wget, gawk). One click to copy
3. **Run & Reboot** — Paste into your VPS terminal as root. The script handles everything and reboots into your new OS

### Example

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 13 && reboot
```

## Tech Stack

- **React 19** + **TypeScript** — Type-safe component architecture
- **Vite** — Lightning-fast build tooling
- **Tailwind CSS** — Utility-first styling with dark theme
- **shadcn/ui** — Pre-built accessible UI components

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Credits

All rebuild scripts are powered by [bin456789/reinstall](https://github.com/bin456789/reinstall) — an open-source, community-driven one-click OS reinstallation tool for VPS.

## License

MIT
