import { useState, useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SavedHost {
  id: string
  label: string
  host: string
  port: number
  username: string
  password?: string
}

interface ToolCategory {
  id: string
  name: string
  icon: string
  color: string
  tools: ToolEntry[]
}

interface ToolEntry {
  id: string
  name: string
  icon: string
  description: string
  script: string
  uninstallScript?: string
  uninstallDescription?: string
  warning?: string
  requiresInput?: { label: string; placeholder: string; key: string; options?: string[] }[]
}

// ─── One-Click Tools Data ────────────────────────────────────────────────────

const toolCategories: ToolCategory[] = [
  {
    id: 'os-rebuild',
    name: 'OS Rebuild',
    icon: '\u{1F4BF}',
    color: '#14F5C8',
    tools: [
      { id: 'rebuild-debian-13', name: 'Debian 13 Trixie', icon: '\u{1F300}', description: 'Rebuild to Debian 13', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 13 && reboot', warning: 'This will ERASE all data and reinstall the OS!' },
      { id: 'rebuild-debian-12', name: 'Debian 12 Bookworm', icon: '\u{1F300}', description: 'Rebuild to Debian 12', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 12 && reboot', warning: 'This will ERASE all data and reinstall the OS!' },
      { id: 'rebuild-ubuntu-2604', name: 'Ubuntu 26.04', icon: '\u{1F7E0}', description: 'Rebuild to Ubuntu 26.04 LTS', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 26.04 && reboot', warning: 'This will ERASE all data and reinstall the OS!' },
      { id: 'rebuild-ubuntu-2404', name: 'Ubuntu 24.04', icon: '\u{1F7E0}', description: 'Rebuild to Ubuntu 24.04 LTS', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 24.04 && reboot', warning: 'This will ERASE all data and reinstall the OS!' },
      { id: 'rebuild-centos-9', name: 'CentOS 9 Stream', icon: '\u{1F7E3}', description: 'Rebuild to CentOS 9', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) centos 9 && reboot', warning: 'This will ERASE all data and reinstall the OS!' },
      { id: 'rebuild-alma-9', name: 'AlmaLinux 9', icon: '\u{1F535}', description: 'Rebuild to AlmaLinux 9', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alma 9 && reboot', warning: 'This will ERASE all data and reinstall the OS!' },
      { id: 'rebuild-rocky-9', name: 'Rocky Linux 9', icon: '\u{1F7E2}', description: 'Rebuild to Rocky Linux 9', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) rocky 9 && reboot', warning: 'This will ERASE all data and reinstall the OS!' },
    ],
  },
  {
    id: 'server-setup',
    name: 'Server Setup & Hardening',
    icon: '\u{1F6E1}\u{FE0F}',
    color: '#F59E0B',
    tools: [
      {
        id: 'swap-1g', name: 'Create 1GB Swap', icon: '\u{1F4BE}',
        description: 'Create a 1GB swap file for low-RAM VPS',
        script: 'fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo "/swapfile swap swap defaults 0 0" >> /etc/fstab && echo "Swap created successfully!" && free -h',
        uninstallScript: 'swapoff /swapfile && rm -f /swapfile && sed -i "/swapfile/d" /etc/fstab && echo "Swap removed successfully" && free -h',
        uninstallDescription: 'Remove swap file and revert to no swap',
      },
      {
        id: 'swap-2g', name: 'Create 2GB Swap', icon: '\u{1F4BE}',
        description: 'Create a 2GB swap file',
        script: 'fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo "/swapfile swap swap defaults 0 0" >> /etc/fstab && echo "Swap created successfully!" && free -h',
        uninstallScript: 'swapoff /swapfile && rm -f /swapfile && sed -i "/swapfile/d" /etc/fstab && echo "Swap removed successfully" && free -h',
        uninstallDescription: 'Remove swap file and revert to no swap',
      },
      {
        id: 'swap-4g', name: 'Create 4GB Swap', icon: '\u{1F4BE}',
        description: 'Create a 4GB swap file',
        script: 'fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo "/swapfile swap swap defaults 0 0" >> /etc/fstab && echo "Swap created successfully!" && free -h',
        uninstallScript: 'swapoff /swapfile && rm -f /swapfile && sed -i "/swapfile/d" /etc/fstab && echo "Swap removed successfully" && free -h',
        uninstallDescription: 'Remove swap file and revert to no swap',
      },
      {
        id: 'timezone', name: 'Set Timezone', icon: '\u{1F570}\u{FE0F}',
        description: 'Set server timezone from list',
        script: 'timedatectl set-timezone TIMEZONE_VALUE && timedatectl',
        uninstallScript: 'timedatectl set-timezone UTC && timedatectl && echo "Timezone reset to UTC"',
        uninstallDescription: 'Reset timezone back to UTC',
        requiresInput: [{ label: 'Timezone', placeholder: 'Asia/Kuala_Lumpur', key: 'TIMEZONE_VALUE', options: ['Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam', 'Europe/Moscow', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Sao_Paulo', 'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland', 'UTC'] }],
      },
      {
        id: 'dns-cloudflare', name: 'DNS: Cloudflare', icon: '\u{1F310}',
        description: 'Change DNS to Cloudflare (1.1.1.1)',
        script: 'echo "nameserver 1.1.1.1" > /etc/resolv.conf && echo "nameserver 1.0.0.1" >> /etc/resolv.conf && echo "DNS changed to Cloudflare" && cat /etc/resolv.conf',
        uninstallScript: 'echo "nameserver 127.0.0.53" > /etc/resolv.conf && echo "DNS restored to system default" && cat /etc/resolv.conf',
        uninstallDescription: 'Restore DNS to system default (127.0.0.53)',
      },
      {
        id: 'dns-google', name: 'DNS: Google', icon: '\u{1F310}',
        description: 'Change DNS to Google (8.8.8.8)',
        script: 'echo "nameserver 8.8.8.8" > /etc/resolv.conf && echo "nameserver 8.8.4.4" >> /etc/resolv.conf && echo "DNS changed to Google" && cat /etc/resolv.conf',
        uninstallScript: 'echo "nameserver 127.0.0.53" > /etc/resolv.conf && echo "DNS restored to system default" && cat /etc/resolv.conf',
        uninstallDescription: 'Restore DNS to system default (127.0.0.53)',
      },
    ],
  },
  {
    id: 'networking',
    name: 'Networking & Proxy',
    icon: '\u{1F310}',
    color: '#3B82F6',
    tools: [
      {
        id: 'install-docker', name: 'Install Docker', icon: '\u{1F433}',
        description: 'Install Docker + Docker Compose on any distro',
        script: 'curl -fsSL https://get.docker.com | sh && systemctl enable docker && systemctl start docker && docker --version && docker compose version',
        uninstallScript: 'systemctl stop docker && apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin && rm -rf /var/lib/docker /var/lib/containerd && echo "Docker removed successfully"',
        uninstallDescription: 'Remove Docker and all containers/images',
      },
      {
        id: 'install-wireguard', name: 'Install WireGuard', icon: '\u{1F512}',
        description: 'Install WireGuard VPN server (auto-setup)',
        script: 'curl -fsSL https://git.io/wireguard -o wireguard-install.sh && bash wireguard-install.sh',
        uninstallScript: 'systemctl stop wg-quick@wg0 && apt-get purge -y wireguard wireguard-tools && rm -rf /etc/wireguard && echo "WireGuard removed successfully"',
        uninstallDescription: 'Remove WireGuard and all configs',
        warning: 'May conflict with existing VPN setups!',
      },
      {
        id: 'install-nginx', name: 'Install Nginx', icon: '\u{1F4E6}',
        description: 'Install and start Nginx reverse proxy',
        script: 'apt-get update -y && apt-get install -y nginx && systemctl enable nginx && systemctl start nginx && nginx -v && echo "Nginx installed and running!"',
        uninstallScript: 'systemctl stop nginx && apt-get purge -y nginx nginx-common nginx-full && rm -rf /etc/nginx && echo "Nginx removed successfully"',
        uninstallDescription: 'Remove Nginx and all configs',
        warning: 'JinGGo/autoscript VPN already uses Nginx! This may overwrite your VPN nginx config.',
      },
    ],
  },
  {
    id: 'diagnostics',
    name: 'Diagnostics & Monitoring',
    icon: '\u{1F50D}',
    color: '#8B5CF6',
    tools: [
      {
        id: 'speedtest', name: 'Speedtest', icon: '\u{26A1}',
        description: 'Run network speed test on your VPS',
        script: 'curl -fsSL https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3',
      },
      {
        id: 'benchmark', name: 'YABS Benchmark', icon: '\u{1F4CA}',
        description: 'Full VPS benchmark (CPU, disk, network)',
        script: 'curl -fsSL https://yabs.sh | bash',
      },
      {
        id: 'sysinfo', name: 'System Info', icon: '\u{1F4CB}',
        description: 'Show full VPS specs and system info',
        script: 'echo "=== SYSTEM INFO ===" && echo "Hostname: $(hostname)" && echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \\")" && echo "Kernel: $(uname -r)" && echo "CPU: $(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)" && echo "Cores: $(nproc)" && echo "RAM: $(free -h | grep Mem | awk \'{print $2}\')" && echo "Disk: $(df -h / | tail -1 | awk \'{print $2, "total,", $3, "used,", $4, "available"}\')" && echo "IP: $(curl -s4 ifconfig.me)" && echo "Uptime: $(uptime -p)"',
      },
      {
        id: 'disk-usage', name: 'Disk Usage', icon: '\u{1F4C0}',
        description: 'Show top space-consuming directories',
        script: 'echo "=== TOP 15 LARGEST DIRECTORIES ===" && du -sh /* 2>/dev/null | sort -rh | head -15',
      },
      {
        id: 'port-scan', name: 'Open Ports', icon: '\u{1F50C}',
        description: 'List all open/listening ports on the server',
        script: 'ss -tlnp | head -30',
      },
    ],
  },
  {
    id: 'apps',
    name: 'Application Installers',
    icon: '\u{1F4E6}',
    color: '#EC4899',
    tools: [
      {
        id: 'install-mysql', name: 'Install MySQL', icon: '\u{1F5C3}\u{FE0F}',
        description: 'Install MySQL database server',
        script: 'apt-get update -y && apt-get install -y mysql-server && systemctl enable mysql && systemctl start mysql && mysql --version',
        uninstallScript: 'systemctl stop mysql && apt-get purge -y mysql-server mysql-client mysql-common && rm -rf /var/lib/mysql /etc/mysql && echo "MySQL removed successfully"',
        uninstallDescription: 'Remove MySQL server and all databases',
      },
      {
        id: 'install-postgres', name: 'Install PostgreSQL', icon: '\u{1F418}',
        description: 'Install PostgreSQL database server',
        script: 'apt-get update -y && apt-get install -y postgresql postgresql-contrib && systemctl enable postgresql && systemctl start postgresql && psql --version',
        uninstallScript: 'systemctl stop postgresql && apt-get purge -y postgresql postgresql-contrib && rm -rf /var/lib/postgresql /etc/postgresql && echo "PostgreSQL removed successfully"',
        uninstallDescription: 'Remove PostgreSQL and all databases',
      },
      {
        id: 'install-redis', name: 'Install Redis', icon: '\u{1F534}',
        description: 'Install Redis in-memory data store',
        script: 'apt-get update -y && apt-get install -y redis-server && systemctl enable redis-server && systemctl start redis-server && redis-cli ping',
        uninstallScript: 'systemctl stop redis-server && apt-get purge -y redis-server && rm -rf /var/lib/redis /etc/redis && echo "Redis removed successfully"',
        uninstallDescription: 'Remove Redis and all data',
      },
      {
        id: 'install-nodejs', name: 'Install Node.js LTS', icon: '\u{1F7E2}',
        description: 'Install latest Node.js LTS via nvm',
        script: 'curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm install --lts && node --version && npm --version',
        uninstallScript: 'rm -rf "$HOME/.nvm" && sed -i "/NVM_DIR/d" ~/.bashrc && echo "Node.js (nvm) removed successfully"',
        uninstallDescription: 'Remove nvm and all Node.js installations',
      },
    ],
  },
  {
    id: 'backup',
    name: 'Backup & Recovery',
    icon: '\u{1F4BE}',
    color: '#10B981',
    tools: [
      {
        id: 'backup-etc', name: 'Backup /etc', icon: '\u{1F4C1}',
        description: 'Backup all config files to /root/backup-etc.tar.gz',
        script: 'tar -czf /root/backup-etc-$(date +%Y%m%d).tar.gz /etc/ && echo "Backup created: /root/backup-etc-$(date +%Y%m%d).tar.gz" && ls -lh /root/backup-etc-*.tar.gz',
      },
      {
        id: 'backup-home', name: 'Backup /home', icon: '\u{1F3E0}',
        description: 'Backup all home directories',
        script: 'tar -czf /root/backup-home-$(date +%Y%m%d).tar.gz /home/ && echo "Backup created: /root/backup-home-$(date +%Y%m%d).tar.gz" && ls -lh /root/backup-home-*.tar.gz',
      },
    ],
  },
  {
    id: 'vpn-diagnostics',
    name: 'VPN Diagnostics & Monitoring',
    icon: '\u{1F50D}',
    color: '#06B6D4',
    tools: [
      {
        id: 'vpn-check-services', name: 'Check All VPN Services', icon: '\u{1F4CB}',
        description: 'Show status of all JinGGo VPN services (xray, xray@none, xray@xhttp, dropbear, ssh, fail2ban)',
        script: 'echo "=== VPN SERVICES STATUS (JinGGo) ===" && for svc in xray xray@none xray@xhttp dropbear ssh fail2ban caddy; do echo ""; echo "--- $svc ---"; systemctl is-active $svc 2>/dev/null && systemctl status $svc --no-pager -l 2>/dev/null | head -5 || echo "[NOT RUNNING]"; done && echo "" && echo "=== DONE ==="',
      },
      {
        id: 'vpn-active-connections', name: 'Show Active Connections', icon: '\u{1F465}',
        description: 'Show logged-in SSH, Dropbear & xray users (JinGGo compatible)',
        script: 'echo "=== ACTIVE VPN CONNECTIONS (JinGGo) ===" && echo "" && echo "--- SSH/Dropbear Sessions ---" && who 2>/dev/null && echo "" && echo "--- Xray Active Connections ---" && if [ -f /var/log/xray/access.log ]; then echo "Recent connections:"; tail -20 /var/log/xray/access.log 2>/dev/null | grep -oP "email: [^ ]+" | sort | uniq -c | sort -rn; else echo "No xray access log"; fi && echo "" && echo "--- Total established connections ---" && ss -tn state established | wc -l',
      },
      {
        id: 'vpn-bandwidth-monitor', name: 'Monitor Bandwidth Live', icon: '\u{1F4C8}',
        description: 'Show real-time network traffic stats (installs vnstat if needed)',
        script: 'command -v vnstat >/dev/null || apt-get install -y vnstat >/dev/null 2>&1 && systemctl start vnstat 2>/dev/null; echo "=== BANDWIDTH SUMMARY ===" && vnstat && echo "" && echo "=== LIVE TRAFFIC (5 sec sample) ===" && vnstat -tr 5',
        uninstallScript: 'systemctl stop vnstat && apt-get purge -y vnstat && rm -rf /var/lib/vnstat && echo "vnstat removed successfully"',
        uninstallDescription: 'Remove vnstat bandwidth monitor',
      },
      {
        id: 'vpn-cert-expiry', name: 'Check Certificate Expiry', icon: '\u{1F4DC}',
        description: 'Show SSL/TLS certificate expiry dates for your domain',
        script: 'echo "=== SSL CERTIFICATE EXPIRY ===" && DOMAIN=$(cat /etc/xray/domain 2>/dev/null || echo "unknown") && echo "Domain: $DOMAIN" && echo "" && for certfile in /etc/letsencrypt/live/*/fullchain.pem /root/cert.crt /root/*.crt; do if [ -f "$certfile" ]; then echo "--- $certfile ---" && openssl x509 -in "$certfile" -noout -subject -enddate 2>/dev/null && echo ""; fi; done && echo "--- Live certificate check ---" && echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -subject -enddate 2>/dev/null || echo "Could not check live cert" && echo "" && echo "=== DONE ==="',
      },
      {
        id: 'vpn-test-ports', name: 'Test All VPN Ports', icon: '\u{1F50C}',
        description: 'Quick check if JinGGo VPN ports are listening (xray, SSH, Dropbear, etc.)',
        script: 'echo "=== VPN PORT CHECK (JinGGo) ===" && echo "--- TCP Ports ---" && for port in 22 80 109 110 443 2222 5443 8080 8880; do result=$(ss -tlnp | grep ":$port " | head -1); if [ -n "$result" ]; then proc=$(echo "$result" | grep -oP "users:\(\(\"\K[^"]+"); echo "[OPEN] TCP $port - $proc"; else echo "[CLOSED] TCP $port"; fi; done && echo "" && echo "--- Localhost Ports ---" && for port in 1318 7200 7300 20241 40000; do result=$(ss -tlnp | grep ":$port " | head -1); if [ -n "$result" ]; then proc=$(echo "$result" | grep -oP "users:\(\(\"\K[^"]+"); echo "[OPEN] localhost:$port - $proc"; else echo "[CLOSED] localhost:$port"; fi; done',
      },
      {
        id: 'vpn-show-port-usage', name: 'Show Port Usage', icon: '\u{1F4CA}',
        description: 'Show which process is using which port (useful for debugging conflicts)',
        script: 'echo "=== PORT USAGE ===" && ss -tlnp | awk \'NR>1{gsub(/.*:/,"",$4); port=$4; proc=$NF; gsub(/.*\\"/,"",proc); gsub(/\\".*/,"",proc); printf "Port %-6s -> %s\\n", port, $NF}\' | sort -t" " -k2 -n',
      },
    ],
  },
  {
    id: 'vpn-maintenance',
    name: 'VPN Maintenance',
    icon: '\u{1F527}',
    color: '#F97316',
    tools: [
      {
        id: 'vpn-restart-all', name: 'Restart All VPN Services', icon: '\u{1F504}',
        description: 'One-click restart all JinGGo VPN services (xray, xray@none, xray@xhttp, dropbear, ssh)',
        script: 'echo "=== RESTARTING VPN SERVICES (JinGGo) ===" && for svc in xray xray@none xray@xhttp dropbear ssh; do systemctl restart $svc 2>/dev/null && echo "[OK] $svc restarted" || echo "[SKIP] $svc not found"; done && echo "" && echo "=== ALL SERVICES RESTARTED ==="',
        warning: 'This will briefly disconnect all active VPN users!',
      },
      {
        id: 'vpn-clear-logs', name: 'Clear VPN Logs', icon: '\u{1F9F9}',
        description: 'Purge old xray/nginx/system logs to free disk space',
        script: 'echo "=== CLEARING LOGS ===" && echo "Before:" && du -sh /var/log/ 2>/dev/null && journalctl --vacuum-time=1d 2>/dev/null && find /var/log -name "*.log" -mtime +3 -delete 2>/dev/null && find /var/log -name "*.gz" -delete 2>/dev/null && cat /dev/null > /var/log/xray/access.log 2>/dev/null; cat /dev/null > /var/log/xray/error.log 2>/dev/null; cat /dev/null > /var/log/nginx/access.log 2>/dev/null; cat /dev/null > /var/log/nginx/error.log 2>/dev/null; echo "After:" && du -sh /var/log/ 2>/dev/null && echo "=== LOGS CLEARED ==="',
      },
      {
        id: 'vpn-renew-cert', name: 'Renew SSL Certificate', icon: '\u{1F510}',
        description: 'Force-renew Let\'s Encrypt / ACME SSL certificates',
        script: 'echo "=== RENEWING SSL CERTIFICATE ===" && if command -v certbot >/dev/null; then certbot renew --force-renewal && echo "Certbot renewal done!"; elif [ -f /root/.acme.sh/acme.sh ]; then /root/.acme.sh/acme.sh --renew --force -d DOMAIN_VALUE && echo "ACME renewal done!"; elif [ -f ~/.acme.sh/acme.sh ]; then ~/.acme.sh/acme.sh --renew --force -d DOMAIN_VALUE && echo "ACME renewal done!"; else echo "No certbot or acme.sh found! Install one first."; fi',
        requiresInput: [{ label: 'Domain', placeholder: 'example.com', key: 'DOMAIN_VALUE' }],
      },
      {
        id: 'vpn-update-xray', name: 'Update Xray Core', icon: '\u{2B06}\u{FE0F}',
        description: 'Update xray-core to the latest version',
        script: 'echo "=== UPDATING XRAY CORE ===" && echo "Current version:" && xray version 2>/dev/null || echo "xray not found" && bash <(curl -fsSL https://raw.githubusercontent.com/XTLS/Xray-install/main/install-release.sh) && echo "" && echo "New version:" && xray version && systemctl restart xray && echo "=== XRAY UPDATED & RESTARTED ==="',
        warning: 'This will briefly restart xray and disconnect active users!',
      },
      {
        id: 'vpn-fix-xray-config', name: 'Validate Xray Config', icon: '\u{2705}',
        description: 'Test xray config file for errors before restarting',
        script: 'echo "=== VALIDATING XRAY CONFIG ===" && if [ -f /usr/local/etc/xray/config.json ]; then xray run -test -c /usr/local/etc/xray/config.json && echo "" && echo "Config is VALID!" || echo "Config has ERRORS!"; elif [ -f /etc/xray/config.json ]; then xray run -test -c /etc/xray/config.json && echo "" && echo "Config is VALID!" || echo "Config has ERRORS!"; else echo "Xray config not found at /usr/local/etc/xray/config.json or /etc/xray/config.json"; fi',
      },
    ],
  },
  {
    id: 'vpn-security',
    name: 'VPN Security',
    icon: '\u{1F6E1}\u{FE0F}',
    color: '#EF4444',
    tools: [
      {
        id: 'vpn-block-ip', name: 'Block IP Address', icon: '\u{1F6AB}',
        description: 'Block an abusive IP address using iptables',
        script: 'iptables -A INPUT -s BLOCK_IP -j DROP && iptables -A OUTPUT -d BLOCK_IP -j DROP && echo "Blocked IP: BLOCK_IP" && echo "" && echo "Currently blocked IPs:" && iptables -L INPUT -n | grep DROP',
        requiresInput: [{ label: 'IP to Block', placeholder: '1.2.3.4', key: 'BLOCK_IP' }],
        uninstallScript: 'iptables -D INPUT -s BLOCK_IP -j DROP 2>/dev/null; iptables -D OUTPUT -d BLOCK_IP -j DROP 2>/dev/null; echo "Unblocked IP: BLOCK_IP"',
        uninstallDescription: 'Unblock a previously blocked IP address',
      },
      {
        id: 'vpn-failed-logins', name: 'Show Failed Logins', icon: '\u{1F6A8}',
        description: 'Check auth logs for brute force / failed SSH login attempts',
        script: 'echo "=== FAILED LOGIN ATTEMPTS ===" && echo "" && echo "--- Top 20 Attacking IPs ---" && grep "Failed password" /var/log/auth.log 2>/dev/null | awk \'{print $(NF-3)}\' | sort | uniq -c | sort -rn | head -20 || journalctl -u ssh --no-pager | grep "Failed password" | awk \'{print $(NF-3)}\' | sort | uniq -c | sort -rn | head -20 && echo "" && echo "--- Total failed attempts ---" && grep -c "Failed password" /var/log/auth.log 2>/dev/null || journalctl -u ssh --no-pager | grep -c "Failed password"',
      },
      {
        id: 'vpn-install-fail2ban', name: 'Install Fail2ban', icon: '\u{1F512}',
        description: 'Auto-ban IPs after repeated failed login attempts',
        script: 'apt-get update -y && apt-get install -y fail2ban && systemctl enable fail2ban && cat > /etc/fail2ban/jail.local << \'EOF\'\n[sshd]\nenabled = true\nport = ssh\nfilter = sshd\nlogpath = /var/log/auth.log\nmaxretry = 5\nbantime = 3600\nfindtime = 600\nEOF\nsystemctl restart fail2ban && echo "Fail2ban installed! IPs banned after 5 failed attempts for 1 hour." && fail2ban-client status',
        uninstallScript: 'systemctl stop fail2ban && apt-get purge -y fail2ban && rm -rf /etc/fail2ban && echo "Fail2ban removed successfully"',
        uninstallDescription: 'Remove fail2ban and all ban rules',
      },
    ],
  },
  {
    id: 'vpn-performance',
    name: 'VPN Performance Boost',
    icon: '\u{26A1}',
    color: '#FBBF24',
    tools: [
      {
        id: 'vpn-enable-bbr', name: 'Enable TCP BBR', icon: '\u{1F680}',
        description: 'Enable Google BBR congestion control for faster VPN throughput',
        script: 'echo "=== ENABLING BBR ===" && echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf && echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf && sysctl -p && echo "" && echo "Current congestion control:" && sysctl net.ipv4.tcp_congestion_control && echo "Available:" && sysctl net.ipv4.tcp_available_congestion_control && echo "=== BBR ENABLED ==="',
        uninstallScript: 'sed -i "/net.core.default_qdisc=fq/d" /etc/sysctl.conf && sed -i "/net.ipv4.tcp_congestion_control=bbr/d" /etc/sysctl.conf && sysctl -p && echo "BBR disabled, reverted to default"',
        uninstallDescription: 'Disable BBR and revert to default congestion control',
      },
      {
        id: 'vpn-optimize-sysctl', name: 'Optimize Network (sysctl)', icon: '\u{2699}\u{FE0F}',
        description: 'Apply VPN-optimized kernel network settings for better performance',
        script: 'echo "=== APPLYING VPN OPTIMIZATIONS ===" && cat >> /etc/sysctl.conf << \'EOF\'\n# VPN Optimizations\nnet.ipv4.tcp_fastopen=3\nnet.ipv4.tcp_slow_start_after_idle=0\nnet.ipv4.tcp_mtu_probing=1\nnet.core.rmem_max=16777216\nnet.core.wmem_max=16777216\nnet.ipv4.tcp_rmem=4096 87380 16777216\nnet.ipv4.tcp_wmem=4096 65536 16777216\nnet.ipv4.ip_forward=1\nnet.core.netdev_max_backlog=5000\nEOF\nsysctl -p && echo "=== OPTIMIZATIONS APPLIED ==="',
        uninstallScript: 'sed -i "/# VPN Optimizations/,/net.core.netdev_max_backlog/d" /etc/sysctl.conf && sysctl -p && echo "VPN optimizations removed from sysctl.conf"',
        uninstallDescription: 'Remove VPN network optimizations from sysctl.conf',
        warning: 'Modifies kernel network parameters. Safe but may need revert if issues arise.',
      },
      {
        id: 'vpn-clear-ram', name: 'Clear RAM Cache', icon: '\u{1F9F9}',
        description: 'Free up cached memory without affecting running processes',
        script: 'echo "=== CLEARING RAM CACHE ===" && echo "Before:" && free -h && sync && echo 3 > /proc/sys/vm/drop_caches && echo "" && echo "After:" && free -h && echo "=== CACHE CLEARED ==="',
      },
    ],
  },
  {
    id: 'vpn-users',
    name: 'VPN User Management',
    icon: '\u{1F465}',
    color: '#A78BFA',
    tools: [
      {
        id: 'vpn-list-users', name: 'List VPN Users', icon: '\u{1F4CB}',
        description: 'Show all xray VPN user accounts with expiry, status & active connections (JinGGo compatible)',
        script: 'echo "=== VPN USER ACCOUNTS (JinGGo) ===" && echo "" && echo "USERNAME            EXPIRY DATE         STATUS      CONNECTIONS" && echo "--------------------------------------------------------------" && grep "^###" /usr/local/etc/xray/config.json 2>/dev/null | sort -u | while read -r line; do user=$(echo "$line" | awk "{print \$2}"); exp=$(echo "$line" | awk "{print \$3}"); today=$(date +%Y-%m-%d); if [ "$exp" \> "$today" ] || [ "$exp" = "$today" ]; then st="ACTIVE"; else st="EXPIRED"; fi; conns=$(grep -c "$user" /var/log/xray/access.log 2>/dev/null || echo 0); printf "%-19s %-19s %-11s %s\n" "$user" "$exp" "$st" "$conns hits"; done && echo "--------------------------------------------------------------" && total=$(grep "^###" /usr/local/etc/xray/config.json 2>/dev/null | sort -u | wc -l) && echo "Total accounts: $total user(s)" && echo "" && echo "=== ACTIVE IPs PER USER ===" && grep "^###" /usr/local/etc/xray/config.json 2>/dev/null | sort -u | while read -r line; do user=$(echo "$line" | awk "{print \$2}"); echo "" && echo "--- $user ---"; grep "$user" /var/log/xray/access.log 2>/dev/null | grep -oP "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | sort | uniq -c | sort -rn | head -10 || echo "No connections found"; done',
      },
    ],
  },
]

// ─── LocalStorage helpers ────────────────────────────────────────────────────

function loadHosts(): SavedHost[] {
  try {
    const raw = localStorage.getItem('freeflow-hosts')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHosts(hosts: SavedHost[]) {
  localStorage.setItem('freeflow-hosts', JSON.stringify(hosts))
}

function getBackendUrl(): string {
  const saved = localStorage.getItem('freeflow-backend-url')
  if (saved) return saved
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('github.io') && !window.location.hostname.includes('devinapps.com')) {
    return window.location.origin
  }
  return ''
}

function setBackendUrl(url: string) {
  localStorage.setItem('freeflow-backend-url', url)
}

// ─── SetupPage Component ────────────────────────────────────────────────────

export default function SetupPage({ onBack }: { onBack: () => void }) {
  const [hosts, setHosts] = useState<SavedHost[]>(loadHosts)
  const [activeHost, setActiveHost] = useState<SavedHost | null>(null)
  const [password, setPassword] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [authMode, setAuthMode] = useState<'password' | 'key'>('password')
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [showAddHost, setShowAddHost] = useState(false)
  const [editingHost, setEditingHost] = useState<SavedHost | null>(null)
  const [newHost, setNewHost] = useState({ label: '', host: '', port: '22', username: 'root' })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [toolSearch, setToolSearch] = useState('')
  const [confirmTool, setConfirmTool] = useState<ToolEntry | null>(null)
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({})
  const [backendUrl, setBackendUrlState] = useState(getBackendUrl)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ctrlActive, setCtrlActive] = useState(false)
  const [toolMode, setToolMode] = useState<'install' | 'uninstall'>('install')
  const [showPasteInput, setShowPasteInput] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [showSelectText, setShowSelectText] = useState(false)
  const [selectBuffer, setSelectBuffer] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)

  const terminalRef = useRef<HTMLDivElement>(null)
  const fullscreenTermRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const ctrlActiveRef = useRef(false)

  // Save hosts to localStorage whenever they change
  useEffect(() => { saveHosts(hosts) }, [hosts])

  // Cleanup terminal on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close()
      termRef.current?.dispose()
    }
  }, [])

  // Resize terminal on window resize or fullscreen/font change
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && isConnected) {
        fitAddonRef.current.fit()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isConnected])

  // Move terminal element between inline and fullscreen containers + auto-size font
  useEffect(() => {
    const termEl = termRef.current?.element
    if (!termEl || !isConnected) return

    const target = isFullscreen ? fullscreenTermRef.current : terminalRef.current
    if (target && !target.contains(termEl)) {
      if (isFullscreen) {
        // Calculate font size to fit ~80 columns in viewport width
        const vw = window.innerWidth - 4 // small margin
        const charRatio = 0.6 // monospace char width / font size ratio
        const optimalSize = Math.floor(vw / 80 / charRatio)
        const fontSize = Math.max(7, Math.min(14, optimalSize))
        termRef.current!.options.fontSize = fontSize
      } else {
        termRef.current!.options.fontSize = 14
      }
      target.appendChild(termEl)
      setTimeout(() => fitAddonRef.current?.fit(), 50)
    }
  }, [isFullscreen, isConnected])

  // Toggle Ctrl modifier
  const toggleCtrl = () => {
    const next = !ctrlActive
    setCtrlActive(next)
    ctrlActiveRef.current = next
    termRef.current?.focus()
  }

  // Send special key to terminal
  const sendSpecialKey = (key: string) => {
    if (!termRef.current || !isConnected) return
    termRef.current.focus()
    switch (key) {
      case 'Tab': wsRef.current?.send(JSON.stringify({ type: 'input', data: '\t' })); break
      case 'Esc': wsRef.current?.send(JSON.stringify({ type: 'input', data: '\x1b' })); break
      case 'Up': wsRef.current?.send(JSON.stringify({ type: 'input', data: '\x1b[A' })); break
      case 'Down': wsRef.current?.send(JSON.stringify({ type: 'input', data: '\x1b[B' })); break
      case 'Left': wsRef.current?.send(JSON.stringify({ type: 'input', data: '\x1b[C' })); break
      case 'Right': wsRef.current?.send(JSON.stringify({ type: 'input', data: '\x1b[D' })); break
      case '-': wsRef.current?.send(JSON.stringify({ type: 'input', data: '-' })); break
      case '/': wsRef.current?.send(JSON.stringify({ type: 'input', data: '/' })); break
      case '|': wsRef.current?.send(JSON.stringify({ type: 'input', data: '|' })); break
      case '\\': wsRef.current?.send(JSON.stringify({ type: 'input', data: '\\' })); break
      default: wsRef.current?.send(JSON.stringify({ type: 'input', data: key })); break
    }
  }

  // Copy selected text from terminal (with HTTP fallback)
  const copySelection = () => {
    if (!termRef.current) return
    const sel = termRef.current.getSelection()
    if (!sel) return
    try {
      navigator.clipboard.writeText(sel)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = sel
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  // Extract terminal buffer text and show in selectable view
  const openSelectText = () => {
    if (!termRef.current) return
    const buf = termRef.current.buffer.active
    const lines: string[] = []
    for (let i = 0; i < buf.length; i++) {
      const line = buf.getLine(i)
      if (line) lines.push(line.translateToString(true))
    }
    setSelectBuffer(lines.join('\n').trimEnd())
    setShowSelectText(true)
  }

  const copySelectBuffer = () => {
    const ta = document.querySelector('#select-text-area') as HTMLTextAreaElement | null
    if (!ta) return
    const sel = ta.value.substring(ta.selectionStart, ta.selectionEnd)
    const textToCopy = sel || selectBuffer
    try {
      navigator.clipboard.writeText(textToCopy)
    } catch {
      const el = document.createElement('textarea')
      el.value = textToCopy
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }

  // Paste from clipboard (with fallback input dialog for HTTP)
  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'input', data: text }))
        termRef.current?.focus()
        return
      }
    } catch {
      // clipboard API not available (HTTP) - show paste input
    }
    setShowPasteInput(true)
    setPasteText('')
  }

  const submitPaste = () => {
    if (pasteText && wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: pasteText }))
    }
    setShowPasteInput(false)
    setPasteText('')
    termRef.current?.focus()
  }

  const sendMenuCommand = () => {
    if (!wsRef.current || !isConnected) return
    wsRef.current.send(JSON.stringify({ type: 'input', data: 'menu\n' }))
    termRef.current?.focus()
  }

  const initTerminal = useCallback(() => {
    if (!terminalRef.current) return

    if (termRef.current) {
      termRef.current.dispose()
    }

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      theme: {
        background: '#0B1222',
        foreground: '#E2E8F0',
        cursor: '#14F5C8',
        cursorAccent: '#0B1222',
        selectionBackground: '#14F5C833',
        black: '#1E293B',
        red: '#F87171',
        green: '#14F5C8',
        yellow: '#FBBF24',
        blue: '#60A5FA',
        magenta: '#C084FC',
        cyan: '#22D3EE',
        white: '#F1F5F9',
        brightBlack: '#475569',
        brightRed: '#FCA5A5',
        brightGreen: '#6EE7B7',
        brightYellow: '#FDE68A',
        brightBlue: '#93C5FD',
        brightMagenta: '#D8B4FE',
        brightCyan: '#67E8F9',
        brightWhite: '#F8FAFC',
      },
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    setTimeout(() => fitAddon.fit(), 100)

    termRef.current = term
    fitAddonRef.current = fitAddon
    return term
  }, [])

  const connectSSH = useCallback(() => {
    if (!activeHost || !backendUrl) return

    setIsConnecting(true)
    setConnectionError('')

    const term = initTerminal()
    if (!term) return

    const pageIsHttps = window.location.protocol === 'https:'
    const backendIsHttp = backendUrl.startsWith('http://')

    if (pageIsHttps && backendIsHttp) {
      term.writeln('\x1b[31m>>> ERROR: Mixed content blocked!\x1b[0m')
      term.writeln('\x1b[33m>>> This page is HTTPS but your backend is HTTP.\x1b[0m')
      term.writeln('\x1b[33m>>> Browsers block insecure WebSocket (ws://) from HTTPS pages.\x1b[0m')
      term.writeln('')
      term.writeln('\x1b[36m>>> Fix: Set up Caddy as HTTPS reverse proxy on your VPS:\x1b[0m')
      term.writeln('\x1b[37m    apt install -y caddy\x1b[0m')
      term.writeln('\x1b[37m    echo \'your-domain.com { reverse_proxy localhost:8000 }\' > /etc/caddy/Caddyfile\x1b[0m')
      term.writeln('\x1b[37m    systemctl restart caddy\x1b[0m')
      term.writeln('')
      term.writeln('\x1b[36m>>> Or use your VPS IP directly with Caddy auto-TLS:\x1b[0m')
      term.writeln('\x1b[37m    apt install -y caddy\x1b[0m')
      term.writeln('\x1b[37m    caddy reverse-proxy --from :443 --to :8000\x1b[0m')
      term.writeln('\x1b[33m>>> Then change backend URL to: https://YOUR_VPS_IP\x1b[0m')
      setConnectionError('Mixed content: HTTPS page cannot connect to HTTP backend. Set up HTTPS on your backend (see terminal for instructions).')
      setIsConnecting(false)
      return
    }

    term.writeln('\x1b[36m>>> Connecting to ' + activeHost.host + ':' + activeHost.port + '...\x1b[0m')

    const wsUrl = backendUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws/ssh'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    let wsConnected = false
    const connectTimeout = setTimeout(() => {
      if (!wsConnected) {
        term.writeln('\x1b[31m>>> Connection timed out. Could not reach backend.\x1b[0m')
        term.writeln('\x1b[33m>>> Check that the backend is running and port 8000 is open.\x1b[0m')
        setConnectionError('Connection timed out. Backend not reachable.')
        setIsConnecting(false)
        ws.close()
      }
    }, 10000)

    ws.onopen = () => {
      wsConnected = true
      clearTimeout(connectTimeout)
      ws.send(JSON.stringify({
        host: activeHost.host,
        port: activeHost.port,
        username: activeHost.username,
        password: authMode === 'password' ? password : '',
        privateKey: authMode === 'key' ? privateKey : '',
      }))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      switch (msg.type) {
        case 'output':
          term.write(msg.data)
          break
        case 'connected':
          setIsConnected(true)
          setIsConnecting(false)
          if (activeHost && authMode === 'password' && password) {
            setHosts(prev => prev.map(h => h.id === activeHost.id ? { ...h, password } : h))
          }
          term.writeln('\x1b[32m>>> Connected! Terminal ready.\x1b[0m\r\n')
          setTimeout(() => fitAddonRef.current?.fit(), 200)
          term.onData((data) => {
            if (ctrlActiveRef.current && data.length === 1) {
              const code = data.toUpperCase().charCodeAt(0) - 64
              if (code >= 1 && code <= 26) {
                ws.send(JSON.stringify({ type: 'input', data: String.fromCharCode(code) }))
                ctrlActiveRef.current = false
                setCtrlActive(false)
                return
              }
            }
            ws.send(JSON.stringify({ type: 'input', data }))
          })
          term.onResize(({ cols, rows }) => {
            ws.send(JSON.stringify({ type: 'resize', cols, rows }))
          })
          break
        case 'status':
          term.writeln('\x1b[33m>>> ' + msg.data + '\x1b[0m')
          break
        case 'error':
          term.writeln('\x1b[31m>>> Error: ' + msg.data + '\x1b[0m')
          setConnectionError(msg.data)
          setIsConnecting(false)
          break
      }
    }

    ws.onerror = () => {
      clearTimeout(connectTimeout)
      term.writeln('\x1b[31m>>> WebSocket connection failed. Check backend URL.\x1b[0m')
      setConnectionError('WebSocket connection failed. Check backend URL.')
      setIsConnecting(false)
    }

    ws.onclose = () => {
      clearTimeout(connectTimeout)
      setIsConnected(false)
      setIsConnecting(false)
      term.writeln('\r\n\x1b[33m>>> Connection closed.\x1b[0m')
    }
  }, [activeHost, password, privateKey, authMode, backendUrl, initTerminal])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  const executeCommand = useCallback((script: string) => {
    if (wsRef.current && isConnected) {
      // Send Ctrl+C to break out of any running menu/prompt
      wsRef.current.send(JSON.stringify({ type: 'input', data: '\x03' }))
      setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ type: 'input', data: '\x03' }))
      }, 100)
      // Wait, then execute the command
      setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ type: 'execute', data: script }))
      }, 500)
      setConfirmTool(null)
    }
  }, [isConnected])

  const addHost = () => {
    const host: SavedHost = {
      id: Date.now().toString(),
      label: newHost.label || newHost.host,
      host: newHost.host,
      port: parseInt(newHost.port) || 22,
      username: newHost.username || 'root',
    }
    setHosts([...hosts, host])
    setNewHost({ label: '', host: '', port: '22', username: 'root' })
    setShowAddHost(false)
  }

  const updateHost = () => {
    if (!editingHost) return
    setHosts(hosts.map((h) => (h.id === editingHost.id ? editingHost : h)))
    setEditingHost(null)
  }

  const deleteHost = (id: string) => {
    setHosts(hosts.filter((h) => h.id !== id))
    if (activeHost?.id === id) {
      setActiveHost(null)
      disconnect()
    }
  }

  const filteredTools = toolCategories
    .map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (t) =>
          (!selectedCategory || cat.id === selectedCategory) &&
          (!toolSearch ||
            t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
            t.description.toLowerCase().includes(toolSearch.toLowerCase()))
      ),
    }))
    .filter((cat) => cat.tools.length > 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                One-Clicked VPS Setup
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Connect & execute with one click</p>
            </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-100 mb-4">Backend Settings</h3>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">SSH Proxy Backend URL</label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => { setBackendUrlState(e.target.value); setBackendUrl(e.target.value) }}
              placeholder="https://your-backend-url.fly.dev"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
            <p className="text-xs text-slate-500 mt-2">The FastAPI SSH proxy server URL. Required for SSH connections.</p>
            <button onClick={() => setShowSettings(false)}
              className="mt-4 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm hover:shadow-lg transition-all">
              Save
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT PANEL: Host Manager */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                  </svg>
                  Saved Hosts
                </h2>
                <button onClick={() => setShowAddHost(true)}
                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Host List */}
              <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                {hosts.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No saved hosts yet.<br />Click + to add one.</p>
                )}
                {hosts.map((h) => (
                  <div key={h.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${activeHost?.id === h.id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-800/50 border border-transparent'}`}
                    onClick={() => { setActiveHost(h); setPassword(h.password || ''); if (isConnected) disconnect() }}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeHost?.id === h.id && isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{h.label}</p>
                      <p className="text-xs text-slate-500 truncate">{h.username}@{h.host}:{h.port}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditingHost({ ...h }) }}
                        className="p-1 rounded text-slate-500 hover:text-cyan-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteHost(h.id) }}
                        className="p-1 rounded text-slate-500 hover:text-red-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Host Form */}
              {showAddHost && (
                <div className="p-3 border-t border-slate-800/60 space-y-2">
                  <input type="text" placeholder="Label (e.g. My VPS)" value={newHost.label}
                    onChange={(e) => setNewHost({ ...newHost, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
                  <input type="text" placeholder="Host / IP" value={newHost.host}
                    onChange={(e) => setNewHost({ ...newHost, host: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Port" value={newHost.port}
                      onChange={(e) => setNewHost({ ...newHost, port: e.target.value })}
                      className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
                    <input type="text" placeholder="Username" value={newHost.username}
                      onChange={(e) => setNewHost({ ...newHost, username: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addHost} disabled={!newHost.host}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
                      Save Host
                    </button>
                    <button onClick={() => setShowAddHost(false)}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Host Modal */}
              {editingHost && (
                <div className="p-3 border-t border-slate-800/60 space-y-2">
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Edit Host</p>
                  <input type="text" placeholder="Label" value={editingHost.label}
                    onChange={(e) => setEditingHost({ ...editingHost, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                  <input type="text" placeholder="Host / IP" value={editingHost.host}
                    onChange={(e) => setEditingHost({ ...editingHost, host: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                  <div className="flex gap-2">
                    <input type="number" placeholder="Port" value={editingHost.port}
                      onChange={(e) => setEditingHost({ ...editingHost, port: parseInt(e.target.value) || 22 })}
                      className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                    <input type="text" placeholder="Username" value={editingHost.username}
                      onChange={(e) => setEditingHost({ ...editingHost, username: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={updateHost}
                      className="flex-1 px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/30 transition-colors">
                      Update
                    </button>
                    <button onClick={() => setEditingHost(null)}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Connection Panel */}
              {activeHost && !isConnected && (
                <div className="p-3 border-t border-slate-800/60 space-y-2">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Connect to {activeHost.label}
                  </p>

                  {!backendUrl && (
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/30">
                      <p className="text-xs text-amber-400">Set backend URL in settings first!</p>
                    </div>
                  )}

                  <div className="flex bg-slate-800 rounded-lg p-0.5">
                    <button onClick={() => setAuthMode('password')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${authMode === 'password' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>
                      Password
                    </button>
                    <button onClick={() => setAuthMode('key')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${authMode === 'key' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>
                      SSH Key
                    </button>
                  </div>

                  {authMode === 'password' ? (
                    <input type="password" placeholder="Password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
                  ) : (
                    <textarea placeholder="Paste private key here..." value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono text-xs resize-none" />
                  )}

                  {connectionError && (
                    <p className="text-xs text-red-400">{connectionError}</p>
                  )}

                  <button onClick={connectSSH}
                    disabled={isConnecting || !backendUrl || (!password && !privateKey)}
                    className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              )}

              {/* Connected status */}
              {activeHost && isConnected && (
                <div className="p-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs font-semibold text-emerald-400">Connected to {activeHost.label}</p>
                  </div>
                  <button onClick={disconnect}
                    className="w-full px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20">
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE/RIGHT: Terminal + Tools */}
          <div className="lg:col-span-9 space-y-6">

            {/* Terminal Status Card */}
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-xs font-mono text-slate-500 ml-2">terminal</span>
              </div>
              <div className="bg-[#0B1222] p-6">
                {isConnected && activeHost ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-emerald-400 text-sm font-semibold mb-1">Successfully Connected</p>
                    <p className="text-slate-400 text-xs font-mono mb-6">{activeHost.username}@{activeHost.host}:{activeHost.port}</p>
                    <button onClick={() => setIsFullscreen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      View Terminal in Fullscreen
                    </button>
                  </div>
                ) : isConnecting ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 text-sm">Connecting...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-500 text-sm mb-2">No active connection</p>
                    <p className="text-slate-600 text-xs max-w-xs">
                      {hosts.length === 0
                        ? 'Add a host from the left panel, then connect to start using one-click tools.'
                        : 'Select a host and connect to start using one-click tools.'}
                    </p>
                  </div>
                )}
              </div>
              {/* Hidden terminal container for xterm initialization */}
              <div ref={terminalRef} className="h-0 overflow-hidden" />
            </div>

            {/* One-Click Tools */}
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/60">
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  One-Click Tools
                  {!isConnected && <span className="text-xs text-slate-600 font-normal ml-1">(connect to VPS first)</span>}
                </h2>

                {/* Category filter */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <button onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${!selectedCategory ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-transparent hover:text-slate-300'}`}>
                    All
                  </button>
                  {toolCategories.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-transparent hover:text-slate-300'}`}>
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <input type="text" placeholder="Search tools..." value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="p-3 space-y-4 max-h-[500px] overflow-y-auto">
                {filteredTools.map((cat) => (
                  <div key={cat.id}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span>{cat.icon}</span> {cat.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.tools.map((tool) => (
                        <button key={tool.id}
                          onClick={() => {
                            if (!isConnected) return
                            setConfirmTool(tool)
                            setToolInputs({})
                          }}
                          disabled={!isConnected}
                          className={`group flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${isConnected ? 'border-slate-800/60 hover:border-emerald-500/30 hover:bg-slate-800/40 cursor-pointer' : 'border-slate-800/30 opacity-50 cursor-not-allowed'}`}>
                          <span className="text-lg flex-shrink-0 mt-0.5">{tool.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">{tool.name}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{tool.description}</p>
                          </div>
                          {isConnected && (
                            <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Terminal Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[60] bg-[#0B1222] flex flex-col">
          {/* Fullscreen header bar */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/95 border-b border-slate-800/40 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
                {activeHost ? `${activeHost.username}@${activeHost.host}` : 'terminal'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Clipboard actions */}
              <button onClick={openSelectText}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-medium transition-colors" title="Select & Copy">
                Select & Copy
              </button>
              <button onClick={pasteClipboard}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-medium transition-colors" title="Paste">
                Paste
              </button>
              <button onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1" title="Close fullscreen">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          {/* Fullscreen terminal body */}
          <div ref={fullscreenTermRef} className="flex-1 min-h-0 overflow-hidden" />
          {/* Floating keyboard toggle button */}
          {!showKeyboard && (
            <button onClick={() => setShowKeyboard(true)}
              className="fixed bottom-4 right-4 z-[70] w-12 h-12 rounded-full bg-emerald-500/80 hover:bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              title="Show keyboard toolbar">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="14" rx="2" strokeWidth={2}/><path strokeWidth={2} d="M6 8h1M10 8h1M14 8h1M18 8h1M6 12h1M18 12h1M9 12h6" strokeLinecap="round"/><path strokeWidth={2} d="M8 16h8" strokeLinecap="round"/></svg>
            </button>
          )}
          {/* Keyboard toolbar - Termius-style rows */}
          {showKeyboard && (
          <div className="bg-slate-900/95 border-t border-slate-800/40 flex-shrink-0">
            {/* Row 1: Menu + Ctrl toggle + special keys + extra symbols */}
            <div className="flex items-center gap-1 px-1.5 py-1 overflow-x-auto">
              <button onClick={sendMenuCommand}
                className="px-3 py-2 rounded-lg bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-300 text-xs font-bold whitespace-nowrap transition-colors active:bg-cyan-500/30 flex-shrink-0">
                menu
              </button>
              <button onClick={toggleCtrl}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${ctrlActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
                Ctrl
              </button>
              <button onClick={() => sendSpecialKey('Esc')}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium whitespace-nowrap transition-colors active:bg-emerald-500/30 flex-shrink-0">
                Esc
              </button>
              <button onClick={() => sendSpecialKey('Tab')}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium whitespace-nowrap transition-colors active:bg-emerald-500/30 flex-shrink-0">
                Tab
              </button>
              <button onClick={() => sendSpecialKey('-')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                -
              </button>
              <button onClick={() => sendSpecialKey('/')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                /
              </button>
              <button onClick={() => sendSpecialKey('|')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                |
              </button>
              <button onClick={() => sendSpecialKey('\\')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                \
              </button>
              <button onClick={() => sendSpecialKey('~')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                ~
              </button>
              <button onClick={() => sendSpecialKey('_')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                _
              </button>
              <button onClick={() => sendSpecialKey(':')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                :
              </button>
              <button onClick={() => sendSpecialKey(';')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                ;
              </button>
              <button onClick={() => sendSpecialKey('@')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                @
              </button>
              <button onClick={() => sendSpecialKey('&')}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors active:bg-emerald-500/30 flex-shrink-0">
                &amp;
              </button>
              {/* Close keyboard button */}
              <button onClick={() => setShowKeyboard(false)}
                className="px-2.5 py-2 rounded-lg bg-red-900/50 hover:bg-red-800/50 text-red-300 text-xs font-bold transition-colors active:bg-red-500/30 flex-shrink-0 ml-auto"
                title="Hide keyboard">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Row 2: Arrow keys */}
            <div className="flex items-center justify-center gap-1 px-1.5 pb-1.5">
              <button onClick={() => sendSpecialKey('Left')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors active:bg-emerald-500/30 flex-shrink-0">
                &#x2190;
              </button>
              <button onClick={() => sendSpecialKey('Up')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors active:bg-emerald-500/30 flex-shrink-0">
                &#x2191;
              </button>
              <button onClick={() => sendSpecialKey('Down')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors active:bg-emerald-500/30 flex-shrink-0">
                &#x2193;
              </button>
              <button onClick={() => sendSpecialKey('Right')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors active:bg-emerald-500/30 flex-shrink-0">
                &#x2192;
              </button>
            </div>
          </div>
          )}

          {/* Paste Input Dialog (fallback for HTTP) */}
          {showPasteInput && (
            <div className="absolute inset-0 z-10 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm text-slate-300 mb-2 font-medium">Paste text here:</p>
                <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                  autoFocus rows={3} placeholder="Long-press and paste here..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono resize-none" />
                <div className="flex gap-2 mt-3">
                  <button onClick={submitPaste}
                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 transition-colors">
                    Send to Terminal
                  </button>
                  <button onClick={() => { setShowPasteInput(false); setPasteText('') }}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Select Text Overlay - shows terminal buffer as selectable text */}
          {showSelectText && (
            <div className="absolute inset-0 z-10 bg-black/90 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800/40">
                <p className="text-xs text-slate-400 font-medium">Long-press to select text, then tap Copy</p>
                <button onClick={() => setShowSelectText(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <textarea id="select-text-area" readOnly value={selectBuffer}
                className="flex-1 w-full px-3 py-2 bg-[#0B1222] text-emerald-400 text-xs font-mono resize-none focus:outline-none select-text"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }} />
              <div className="flex gap-2 px-3 py-2 bg-slate-900 border-t border-slate-800/40">
                <button onClick={() => { copySelectBuffer(); setShowSelectText(false) }}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 transition-colors">
                  Copy Selected
                </button>
                <button onClick={() => setShowSelectText(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool Confirmation Modal */}
      {confirmTool && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setConfirmTool(null); setToolMode('install') }}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{confirmTool.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{confirmTool.name}</h3>
                <p className="text-sm text-slate-400">{toolMode === 'uninstall' && confirmTool.uninstallDescription ? confirmTool.uninstallDescription : confirmTool.description}</p>
              </div>
            </div>

            {/* Install / Uninstall toggle */}
            {confirmTool.uninstallScript && (
              <div className="flex bg-slate-800 rounded-lg p-0.5 mb-4">
                <button onClick={() => setToolMode('install')}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${toolMode === 'install' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>
                  Install / Execute
                </button>
                <button onClick={() => setToolMode('uninstall')}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${toolMode === 'uninstall' ? 'bg-red-500/20 text-red-400' : 'text-slate-500'}`}>
                  Uninstall / Revert
                </button>
              </div>
            )}

            {toolMode === 'install' && confirmTool.requiresInput && (
              <div className="space-y-3 mb-4">
                {confirmTool.requiresInput.map((input) => (
                  <div key={input.key}>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">{input.label} {input.options && <span className="normal-case tracking-normal text-slate-600">(tap to choose)</span>}</label>
                    {input.options ? (
                      <select
                        value={toolInputs[input.key] || input.options[0] || ''}
                        onChange={(e) => setToolInputs({ ...toolInputs, [input.key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer">
                        {input.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" placeholder={input.placeholder}
                        value={toolInputs[input.key] || ''}
                        onChange={(e) => setToolInputs({ ...toolInputs, [input.key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {toolMode === 'install' && confirmTool.warning && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/30 mb-4">
                <p className="text-xs text-red-400 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span><strong>Warning:</strong> {confirmTool.warning}</span>
                </p>
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 overflow-x-auto">
              <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
                <code>{(() => {
                  if (toolMode === 'uninstall' && confirmTool.uninstallScript) {
                    return confirmTool.uninstallScript
                  }
                  let s = confirmTool.script
                  if (confirmTool.requiresInput) {
                    for (const input of confirmTool.requiresInput) {
                      s = s.replace(input.key, toolInputs[input.key] || input.options?.[0] || input.placeholder)
                    }
                  }
                  return s
                })()}</code>
              </pre>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-900/30 mb-4">
              <p className="text-[11px] text-cyan-400 flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Will auto-exit any running menu/script before executing this command.</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => {
                if (toolMode === 'uninstall' && confirmTool.uninstallScript) {
                  executeCommand(confirmTool.uninstallScript)
                } else {
                  let script = confirmTool.script
                  if (confirmTool.requiresInput) {
                    for (const input of confirmTool.requiresInput) {
                      script = script.replace(input.key, toolInputs[input.key] || input.options?.[0] || '')
                    }
                  }
                  executeCommand(script)
                }
                setToolMode('install')
              }}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all ${toolMode === 'uninstall' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950'}`}>
                {toolMode === 'uninstall' ? 'Confirm Uninstall' : 'Confirm & Execute'}
              </button>
              <button onClick={() => { setConfirmTool(null); setToolMode('install') }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm font-semibold hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
