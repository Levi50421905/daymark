import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export default function NotFoundPage() {
  return (
    <div className="surface-card mt-10">
      <EmptyState
        icon={Compass}
        title="Halaman tidak ditemukan"
        description="Tautan yang kamu buka mungkin sudah berpindah. Kembali ke Overview untuk melanjutkan."
        action={
          <Link to="/">
            <Button>Kembali ke Overview</Button>
          </Link>
        }
      />
    </div>
  )
}
