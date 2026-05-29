import { useEffect, useState } from 'react'
import { Monitor, Apple } from 'lucide-react'

// Simple Linux icon since lucide-react might not have a dedicated one easily discoverable by name 'Linux' or 'Tux'
function LinuxIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0V4a2 2 0 0 0-2-2z" />
      <path d="M12 6c-3 0-5 2-5 5v3c0 2 1.5 3 3 4 .5.5 1 1 1 2 0 1.5-1.5 2-3 2h8c-1.5 0-3-.5-3-2 0-1 .5-1.5 1-2 1.5-1 3-2 3-4v-3c0-3-2-5-5-5z" />
      <path d="M8 11.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
      <path d="M16 11.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    </svg>
  )
}

const DOWNLOAD_LINKS = {
  windows: 'https://github.com/baroflix/baroflix-desktop/releases/download/0.1/win-baroflix.Setup.0.1.0.exe',
  mac: 'https://github.com/baroflix/baroflix-desktop/releases/download/0.1/mac-arm64-baroflix.Setup.0.1.0.dmg',
  linux: 'https://github.com/baroflix/baroflix-desktop/releases/download/0.1/linux-baroflix.Setup.0.1.0.tar.gz',
}

type OS = 'windows' | 'mac' | 'linux' | 'unknown'

function detectOS(): OS {
  const ua = window.navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('linux')) return 'linux'
  return 'unknown'
}

export function DownloadPage() {
  const [os, setOs] = useState<OS>('unknown')

  useEffect(() => {
    setOs(detectOS())
  }, [])

  const mainDownload = os === 'unknown' ? 'windows' : os

  const getOsName = (o: OS) => {
    if (o === 'windows') return 'Windows'
    if (o === 'mac') return 'macOS'
    if (o === 'linux') return 'Linux'
    return 'Windows'
  }

  const PrimaryIcon = mainDownload === 'windows' ? Monitor : mainDownload === 'mac' ? Apple : LinuxIcon

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Get Baroflix Desktop
          </h1>
          <p className="text-lg text-white/60">
            Enjoy a better, native experience with hardware acceleration, volume boost, and Discord Rich Presence.
          </p>
        </div>

        <div className="pt-8 space-y-6">
          <a
            href={DOWNLOAD_LINKS[mainDownload]}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 8px 32px var(--accent-dim)',
            }}
          >
            <PrimaryIcon className="w-6 h-6" />
            Download for {getOsName(mainDownload)}
          </a>

          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-white/40 mb-4 font-medium uppercase tracking-wider">Other platforms</p>
            <div className="flex flex-col gap-3">
              {(['windows', 'mac', 'linux'] as const).filter(o => o !== mainDownload).map(o => {
                const Icon = o === 'windows' ? Monitor : o === 'mac' ? Apple : LinuxIcon
                return (
                  <a
                    key={o}
                    href={DOWNLOAD_LINKS[o]}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/80 hover:text-white font-medium"
                  >
                    <Icon className="w-5 h-5" />
                    Download for {getOsName(o)}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
