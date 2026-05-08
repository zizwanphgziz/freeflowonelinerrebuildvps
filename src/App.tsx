import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface OSVersion {
  version: string
  codename?: string
  script: string
}

interface OSEntry {
  id: string
  name: string
  icon: string
  color: string
  category: 'linux' | 'windows'
  description: string
  versions: OSVersion[]
}

const osData: OSEntry[] = [
  {
    id: 'debian',
    name: 'Debian',
    icon: '\u{1F300}',
    color: '#A80030',
    category: 'linux',
    description: 'The universal operating system. Rock-solid stability for servers.',
    versions: [
      { version: '13', codename: 'Trixie', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 13 && reboot' },
      { version: '12', codename: 'Bookworm', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 12 && reboot' },
      { version: '11', codename: 'Bullseye', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 11 && reboot' },
      { version: '10', codename: 'Buster', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 10 && reboot' },
      { version: '9', codename: 'Stretch', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 9 && reboot' },
    ],
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    icon: '\u{1F7E0}',
    color: '#E95420',
    category: 'linux',
    description: 'The most popular Linux distribution. Great for cloud and VPS.',
    versions: [
      { version: '26.04', codename: 'Resolute Raccoon', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 26.04 && reboot' },
      { version: '24.04', codename: 'Noble Numbat', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 24.04 && reboot' },
      { version: '22.04', codename: 'Jammy Jellyfish', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 22.04 && reboot' },
      { version: '20.04', codename: 'Focal Fossa', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 20.04 && reboot' },
      { version: '18.04', codename: 'Bionic Beaver', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 18.04 && reboot' },
    ],
  },
  {
    id: 'centos',
    name: 'CentOS',
    icon: '\u{1F7E3}',
    color: '#932279',
    category: 'linux',
    description: 'Community-driven enterprise Linux. CentOS Stream is the current release.',
    versions: [
      { version: '9 Stream', codename: 'Stream', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) centos 9 && reboot' },
      { version: '8 Stream', codename: 'Stream', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) centos 8 && reboot' },
      { version: '7', codename: 'Final', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) centos 7 && reboot' },
    ],
  },
  {
    id: 'almalinux',
    name: 'AlmaLinux',
    icon: '\u{1F535}',
    color: '#0F4266',
    category: 'linux',
    description: 'Enterprise-grade, CentOS replacement. 1:1 binary compatible with RHEL.',
    versions: [
      { version: '10', codename: 'Purple Manul', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alma 10 && reboot' },
      { version: '9', codename: 'Emerald Puma', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alma 9 && reboot' },
      { version: '8', codename: 'Cerulean Leopard', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alma 8 && reboot' },
    ],
  },
  {
    id: 'rocky',
    name: 'Rocky Linux',
    icon: '\u{1F7E2}',
    color: '#10B981',
    category: 'linux',
    description: 'Enterprise Linux, born from the CentOS community. Bug-for-bug RHEL compatible.',
    versions: [
      { version: '10', codename: 'Obsidian Owl', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) rocky 10 && reboot' },
      { version: '9', codename: 'Blue Onyx', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) rocky 9 && reboot' },
      { version: '8', codename: 'Green Obsidian', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) rocky 8 && reboot' },
    ],
  },
  {
    id: 'fedora',
    name: 'Fedora',
    icon: '\u{1F3A9}',
    color: '#3C6EB4',
    category: 'linux',
    description: 'Cutting-edge Linux from Red Hat. Latest packages and technologies.',
    versions: [
      { version: '44', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) fedora 44 && reboot' },
      { version: '43', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) fedora 43 && reboot' },
      { version: '42', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) fedora 42 && reboot' },
      { version: '41', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) fedora 41 && reboot' },
      { version: '40', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) fedora 40 && reboot' },
    ],
  },
  {
    id: 'arch',
    name: 'Arch Linux',
    icon: '\u{1F3D4}\u{FE0F}',
    color: '#1793D1',
    category: 'linux',
    description: 'Lightweight, rolling-release distro. For the power user.',
    versions: [
      { version: 'Latest', codename: 'Rolling', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) arch && reboot' },
    ],
  },
  {
    id: 'opensuse',
    name: 'openSUSE',
    icon: '\u{1F98E}',
    color: '#73BA25',
    category: 'linux',
    description: 'Stable and versatile Linux distro with YaST management tools.',
    versions: [
      { version: 'Tumbleweed', codename: 'Rolling', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) opensuse tumbleweed && reboot' },
      { version: '15.6', codename: 'Leap', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) opensuse 15.6 && reboot' },
    ],
  },
  {
    id: 'alpine',
    name: 'Alpine Linux',
    icon: '\u{26F0}\u{FE0F}',
    color: '#0D597F',
    category: 'linux',
    description: 'Security-oriented, lightweight distro. Ideal for containers and minimal VPS.',
    versions: [
      { version: '3.23', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alpine 3.23 && reboot' },
      { version: '3.22', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alpine 3.22 && reboot' },
      { version: '3.21', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alpine 3.21 && reboot' },
      { version: '3.20', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alpine 3.20 && reboot' },
    ],
  },
  {
    id: 'oracle',
    name: 'Oracle Linux',
    icon: '\u{1F534}',
    color: '#C74634',
    category: 'linux',
    description: 'Enterprise Linux with Oracle support. RHEL compatible with Ksplice.',
    versions: [
      { version: '10', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) oracle 10 && reboot' },
      { version: '9', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) oracle 9 && reboot' },
      { version: '8', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) oracle 8 && reboot' },
    ],
  },
  {
    id: 'gentoo',
    name: 'Gentoo',
    icon: '\u{1F427}',
    color: '#54487A',
    category: 'linux',
    description: 'Source-based distro. Ultimate customization and performance tuning.',
    versions: [
      { version: 'Latest', codename: 'Rolling', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) gentoo && reboot' },
    ],
  },
  {
    id: 'nixos',
    name: 'NixOS',
    icon: '\u{2744}\u{FE0F}',
    color: '#5277C3',
    category: 'linux',
    description: 'Declarative, reproducible Linux distro powered by the Nix package manager.',
    versions: [
      { version: '24.11', codename: 'Vicuna', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) nixos 24.11 && reboot' },
      { version: '24.05', codename: 'Uakari', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) nixos 24.05 && reboot' },
    ],
  },
  {
    id: 'kali',
    name: 'Kali Linux',
    icon: '\u{1F409}',
    color: '#557C94',
    category: 'linux',
    description: 'Penetration testing and security research distribution.',
    versions: [
      { version: 'Latest', codename: 'Rolling', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) kali && reboot' },
    ],
  },
  {
    id: 'anolis',
    name: 'Anolis OS',
    icon: '\u{1F41C}',
    color: '#1E90FF',
    category: 'linux',
    description: 'Cloud-native Linux by Alibaba Cloud. Enterprise-grade with CentOS compatibility.',
    versions: [
      { version: '23', codename: 'Innovation', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) anolis 23 && reboot' },
      { version: '8', codename: 'Stable', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) anolis 8 && reboot' },
      { version: '7', codename: 'Classic', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) anolis 7 && reboot' },
    ],
  },
  {
    id: 'opencloudos',
    name: 'OpenCloudOS',
    icon: '\u{2601}\u{FE0F}',
    color: '#FF6600',
    category: 'linux',
    description: 'Community-driven cloud OS by Tencent. Built for cloud-native workloads.',
    versions: [
      { version: '9', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) opencloudos 9 && reboot' },
      { version: '8', script: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) opencloudos 8 && reboot' },
    ],
  },
  {
    id: 'windows-server-2022',
    name: 'Windows Server 2022',
    icon: '\u{1FA9F}',
    color: '#0078D4',
    category: 'windows',
    description: 'Latest Windows Server with advanced security and hybrid capabilities.',
    versions: [
      { version: 'Standard', codename: 'LTSC', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows Server 2022 SERVERSTANDARDCORE' && reboot" },
      { version: 'Datacenter', codename: 'LTSC', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows Server 2022 SERVERDATACENTERCORE' && reboot" },
    ],
  },
  {
    id: 'windows-server-2019',
    name: 'Windows Server 2019',
    icon: '\u{1FA9F}',
    color: '#00A4EF',
    category: 'windows',
    description: 'Mature Windows Server release. Widely used in production.',
    versions: [
      { version: 'Standard', codename: 'LTSC', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows Server 2019 SERVERSTANDARDCORE' && reboot" },
      { version: 'Datacenter', codename: 'LTSC', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows Server 2019 SERVERDATACENTERCORE' && reboot" },
    ],
  },
  {
    id: 'windows-server-2016',
    name: 'Windows Server 2016',
    icon: '\u{1FA9F}',
    color: '#00BCF2',
    category: 'windows',
    description: 'Legacy Windows Server. Still in extended support.',
    versions: [
      { version: 'Standard', codename: 'LTSC', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows Server 2016 SERVERSTANDARDCORE' && reboot" },
      { version: 'Datacenter', codename: 'LTSC', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows Server 2016 SERVERDATACENTERCORE' && reboot" },
    ],
  },
  {
    id: 'windows-11',
    name: 'Windows 11',
    icon: '\u{1FA9F}',
    color: '#0078D4',
    category: 'windows',
    description: 'Latest Windows desktop OS. Modern UI with enhanced productivity features.',
    versions: [
      { version: 'Pro', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows 11 Pro' && reboot" },
      { version: 'Enterprise', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows 11 Enterprise' && reboot" },
    ],
  },
  {
    id: 'windows-10',
    name: 'Windows 10',
    icon: '\u{1FA9F}',
    color: '#00A4EF',
    category: 'windows',
    description: 'Widely deployed Windows desktop OS. Stable and well-supported.',
    versions: [
      { version: 'Pro', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows 10 Pro' && reboot" },
      { version: 'Enterprise LTSC', script: "bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) windows --image-name 'Windows 10 Enterprise LTSC' && reboot" },
    ],
  },
]

function FreeflowLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 118" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14F5C8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow)">
        <path d="M25 35 Q45 25, 55 45 T85 55" stroke="url(#logoGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M20 55 Q40 45, 55 59 T90 65" stroke="url(#logoGrad)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M28 72 Q48 62, 60 75 T88 78" stroke="url(#logoGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
      </g>
      <text x="105" y="76" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" fontWeight="800" fontSize="48" letterSpacing="-1">
        <tspan fill="#F8FAFC">FREE</tspan>
        <tspan fill="url(#logoGrad)">FLOW</tspan>
      </text>
      <text x="108" y="95" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" fontWeight="500" fontSize="13" fill="#94A3B8" letterSpacing="3">
        ONE-LINER VPS REBUILDS
      </text>
    </svg>
  )
}

function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 10,
    }))
  )

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'linear-gradient(135deg, #14F5C8, #0EA5E9)',
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.1; }
          50% { opacity: 0.3; }
          100% { transform: translateY(-30px) translateX(20px); opacity: 0.1; }
        }
      `}</style>
    </div>
  )
}

function WindowsLogo({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || 'w-8 h-8'}>
      <rect x="2" y="2" width="38" height="38" rx="4" fill={color} opacity="0.95" />
      <rect x="48" y="2" width="38" height="38" rx="4" fill={color} opacity="0.8" />
      <rect x="2" y="48" width="38" height="38" rx="4" fill={color} opacity="0.8" />
      <rect x="48" y="48" width="38" height="38" rx="4" fill={color} opacity="0.65" />
    </svg>
  )
}

function OSIcon({ os, className }: { os: OSEntry; className?: string }) {
  if (os.category === 'windows') {
    return <WindowsLogo color={os.color} className={className || 'w-8 h-8'} />
  }
  return <span className="text-3xl">{os.icon}</span>
}

function App() {
  const [selectedOS, setSelectedOS] = useState<OSEntry | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<OSVersion | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'linux' | 'windows'>('linux')
  const [showModal, setShowModal] = useState(false)

  const filteredOS = osData.filter(
    (os) =>
      os.category === activeTab &&
      (os.name.toLowerCase().includes(search.toLowerCase()) ||
        os.versions.some((v) => v.version.toLowerCase().includes(search.toLowerCase())) ||
        os.versions.some((v) => (v.codename || '').toLowerCase().includes(search.toLowerCase())))
  )

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    if (window.history.state?.modal) {
      window.history.back()
    }
  }, [])

  const handleSelectOS = (os: OSEntry) => {
    setSelectedOS(os)
    setSelectedVersion(os.versions[0])
    setShowModal(true)
    window.history.pushState({ modal: true }, '')
  }

  useEffect(() => {
    const onPopState = () => {
      setShowModal(false)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      <ParticleField />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <a href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <FreeflowLogo className="h-14 w-auto drop-shadow-lg" />
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#scripts" className="text-slate-300 hover:text-emerald-400 transition-colors">Scripts</a>
            <a href="#how" className="text-slate-300 hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#faq" className="text-slate-300 hover:text-emerald-400 transition-colors">FAQ</a>
            <a href="https://github.com/zizwanphgziz/freeflowonelinerrebuildvps" target="_blank" rel="noopener noreferrer"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          One Command. Fresh OS. Zero Hassle.
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
          <span className="text-slate-100">Rebuild Your VPS</span>
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            In One Line
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Pre-configured one-liner scripts for every major OS. Each script auto-installs
          dependencies (wget, curl, gawk) and starts the rebuild instantly. No extra setup needed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#scripts" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-base hover:shadow-xl hover:shadow-emerald-500/20 transition-all hover:scale-105">
            Browse Scripts
          </a>
          <a href="#how" className="px-8 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-base hover:bg-slate-800/50 transition-all">
            How It Works
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '\u{26A1}', title: 'Zero Pre-Setup', desc: 'Each script handles dependency installation automatically. Just paste & run.' },
            { icon: '\u{1F512}', title: 'Verified Scripts', desc: 'Scripts sourced from trusted, open-source reinstall projects. Audit the code yourself.' },
            { icon: '\u{1F30D}', title: 'All Major OS', desc: 'Linux distros, Windows Server, and desktop editions. Every version covered.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm hover:border-emerald-500/30 transition-all group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCRIPTS */}
      <section id="scripts" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Operating System</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Select an OS below, pick your version, and get a ready-to-run one-liner.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex bg-slate-900/60 rounded-xl p-1 border border-slate-800/60">
            <button onClick={() => setActiveTab('linux')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'linux' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              Linux
            </button>
            <button onClick={() => setActiveTab('windows')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'windows' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              Windows
            </button>
          </div>
          <div className="relative w-full sm:w-80">
            <input type="text" placeholder="Search OS or version..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all" />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOS.map((os) => (
            <button key={os.id} onClick={() => handleSelectOS(os)}
              className="group relative p-5 rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-sm hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all text-left hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="flex items-start gap-3">
                <OSIcon os={os} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">{os.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{os.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {os.versions.map((v) => (
                      <span key={v.version} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
                        {v.version}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, ${os.color}08 0%, transparent 70%)` }} />
            </button>
          ))}
        </div>

        {filteredOS.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-4">{'\u{1F50D}'}</div>
            <p className="text-lg font-medium">No OS found matching &quot;{search}&quot;</p>
            <p className="text-sm mt-2">Try a different search term</p>
          </div>
        )}
      </section>

      {/* MODAL */}
      {showModal && selectedOS && selectedVersion && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={closeModal}>
          <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-8">
            <div className="bg-slate-900 border border-slate-700/60 rounded-3xl max-w-2xl w-full p-0 shadow-2xl shadow-black/40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800/60 flex items-center justify-between gap-3"
                style={{ background: `linear-gradient(135deg, ${selectedOS.color}15 0%, transparent 60%)` }}>
                <button onClick={closeModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <OSIcon os={selectedOS} />
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-100 truncate">{selectedOS.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">{selectedOS.description}</p>
                  </div>
                </div>
                <button onClick={closeModal}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            <div className="px-4 sm:px-6 pt-5 pb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Select Version</label>
              <div className="flex flex-wrap gap-2">
                {selectedOS.versions.map((v) => (
                  <button key={v.version} onClick={() => setSelectedVersion(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedVersion.version === v.version
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50'}`}>
                    {v.version}
                    {v.codename && <span className={`ml-1.5 text-xs ${selectedVersion.version === v.version ? 'text-slate-800' : 'text-slate-500'}`}>{v.codename}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-6 pt-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">One-Liner Script</label>
              <div className="relative group">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 pr-14 overflow-x-auto">
                  <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
                    <code>{selectedVersion.script}</code>
                  </pre>
                </div>
                <button onClick={() => handleCopy(selectedVersion.script)}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
                  title="Copy to clipboard">
                  {copied ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800/60">
                <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to use
                </h4>
                <ol className="text-sm text-slate-400 space-y-1.5 list-decimal list-inside">
                  <li>SSH into your VPS as <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs">root</code></li>
                  <li>Copy the script above and paste it into your terminal</li>
                  <li>Press Enter and wait for the rebuild to complete</li>
                  <li>Your VPS will reboot into the new OS automatically</li>
                </ol>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-red-950/30 border border-red-900/30">
                <p className="text-xs text-red-400 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span><strong>Warning:</strong> This will completely erase all data on your VPS and reinstall the operating system. Make sure you have backed up any important data before proceeding.</span>
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            How It{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Three simple steps to rebuild your VPS with any operating system.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Pick Your OS', desc: 'Browse our collection of Linux distros and Windows editions. Choose your preferred version.', icon: '\u{1F3AF}' },
            { step: '02', title: 'Copy the Script', desc: 'Each script includes automatic dependency setup (curl, wget, gawk). One click to copy.', icon: '\u{1F4CB}' },
            { step: '03', title: 'Run & Reboot', desc: 'Paste into your VPS terminal as root. The script handles everything and reboots into your new OS.', icon: '\u{1F680}' },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="p-6 rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-sm hover:border-emerald-500/30 transition-all group">
                <div className="text-5xl font-black bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 bg-clip-text text-transparent mb-4">{item.step}</div>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK REFERENCE */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="p-8 rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Quick{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Reference</span>
            </h2>
            <p className="text-slate-400">Most popular rebuild commands at a glance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Debian 12', cmd: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) debian 12 && reboot' },
              { label: 'Ubuntu 24.04', cmd: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) ubuntu 24.04 && reboot' },
              { label: 'CentOS 9 Stream', cmd: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) centos 9 && reboot' },
              { label: 'AlmaLinux 9', cmd: 'bash <(curl -fsSL https://raw.githubusercontent.com/bin456789/reinstall/main/reinstall.sh) alma 9 && reboot' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 group">
                <span className="text-xs font-bold text-slate-500 w-28 flex-shrink-0">{item.label}</span>
                <code className="text-xs text-emerald-400 font-mono flex-1 truncate">{item.cmd}</code>
                <button onClick={() => handleCopy(item.cmd)}
                  className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors flex-shrink-0"
                  title={`Copy ${item.label} command`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Frequently{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Asked</span>
          </h2>
        </div>
        <div className="space-y-4">
          {[
            { q: 'Will this erase all data on my VPS?', a: 'Yes! These scripts completely wipe the current OS and install a fresh one. Always back up your data before running any rebuild script.' },
            { q: 'Do I need to install curl/wget first?', a: 'No. The one-liner scripts use bash process substitution with curl to fetch and execute the reinstall script. curl comes pre-installed on virtually all VPS images.' },
            { q: 'Does this work on any VPS provider?', a: 'These scripts work on most KVM/Xen-based VPS providers. They may not work on OpenVZ or LXC containers. Compatible with providers like Vultr, DigitalOcean, Linode, Hetzner, OVH, and more.' },
            { q: 'How long does the rebuild take?', a: 'Typically 5-15 minutes depending on your VPS specs and network speed. The VPS will reboot automatically when done.' },
            { q: 'Can I set a custom root password?', a: 'Yes! Most scripts support a --password flag. Check the GitHub repo documentation for advanced options.' },
            { q: 'Are Windows scripts free to use?', a: 'The scripts themselves are free and open source. However, you will need a valid Windows license key to activate Windows after installation.' },
          ].map((item, i) => (
            <details key={i} className="group p-5 rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-sm hover:border-emerald-500/20 transition-all">
              <summary className="cursor-pointer list-none flex items-center justify-between text-base font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                {item.q}
                <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <FreeflowLogo className="h-10 w-auto" />
            <p className="text-sm text-slate-500">
              Scripts powered by{' '}
              <a href="https://github.com/bin456789/reinstall" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">bin456789/reinstall</a>
              {' '}&mdash; Open source, community driven.
            </p>
            <a href="https://github.com/zizwanphgziz/freeflowonelinerrebuildvps" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
