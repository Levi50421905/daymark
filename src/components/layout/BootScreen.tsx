import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CloudOff, RefreshCw, ShieldAlert } from 'lucide-react'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export function BootSplash() {
  return (
    <div className="hero-gradient flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="rounded-[26px] shadow-[0_30px_80px_-30px_rgba(15,169,184,0.65)]"
      >
        <LogoMark size={76} />
      </motion.div>
      <div className="text-center">
        <p className="text-xl font-extrabold tracking-[-0.04em] text-ink">Daymark</p>
        <p className="mt-1 text-xs font-medium text-ink-3">Menyiapkan ruang harianmu…</p>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-brand/70"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.15, repeat: Infinity, delay: index * 0.16, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}

interface BootErrorProps {
  error: string
  onRetry: () => void
  onContinue: () => void
}

export function BootError({ error, onRetry, onContinue }: BootErrorProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card w-full max-w-md p-6 sm:p-8"
      >
        <div className="mb-5 flex items-center gap-3">
          <LogoMark size={42} />
          <div>
            <p className="text-lg font-extrabold tracking-tight text-ink">Daymark</p>
            <p className="text-[0.6875rem] font-medium text-ink-3">Personal life planner</p>
          </div>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <ShieldAlert size={22} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink">Penyimpanan lokal tidak bisa dibuka</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">
          Data lama tidak dihapus. Browser mungkin membatasi IndexedDB pada mode privat atau pengaturan
          situs. Kamu bisa mencoba lagi, atau lanjut dalam mode sementara.
        </p>
        <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-xs leading-relaxed text-ink-3">
          {error}
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onRetry} icon={RefreshCw} className="flex-1">
            Coba lagi
          </Button>
          <Button onClick={onContinue} variant="secondary" icon={CloudOff} className="flex-1">
            Mode sementara
          </Button>
        </div>
        <p className="mt-4 text-center text-[0.625rem] leading-relaxed text-ink-3">
          Mode sementara tidak menyimpan data setelah tab ditutup. Ekspor backup sebelum menutup tab.
        </p>
        <Link
          to="/"
          className="mt-2 block text-center text-[0.625rem] font-semibold text-brand hover:underline"
        >
          Kembali ke aplikasi
        </Link>
      </motion.div>
    </div>
  )
}
