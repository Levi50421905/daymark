import { useParams } from 'react-router-dom'
import { ShoppingDetailPage } from '@/features/shopping/ShoppingDetailPage'
import { ShoppingIndexPage } from '@/features/shopping/ShoppingIndexPage'

export default function ShoppingPage() {
  const { listId } = useParams<{ listId?: string }>()

  if (listId) return <ShoppingDetailPage key={listId} listId={listId} />
  return <ShoppingIndexPage />
}
