import {
  Bike,
  BookOpen,
  Briefcase,
  BusFront,
  CalendarCheck,
  CalendarClock,
  Car,
  Carrot,
  CircleEllipsis,
  Clapperboard,
  Coffee,
  Cpu,
  CupSoda,
  Dumbbell,
  FlaskConical,
  Gauge,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Laptop,
  ListChecks,
  MoonStar,
  NotebookPen,
  PackageOpen,
  PawPrint,
  PieChart,
  PiggyBank,
  Plane,
  ReceiptText,
  Router,
  Shapes,
  ShoppingBasket,
  Smartphone,
  Snowflake,
  Sparkles,
  SprayCan,
  Star,
  Sun,
  Sunrise,
  Tablet,
  Tag,
  Target,
  UtensilsCrossed,
  Wallet,
  Wifi,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  Bike,
  BookOpen,
  Briefcase,
  BusFront,
  CalendarCheck,
  CalendarClock,
  Car,
  Carrot,
  CircleEllipsis,
  Clapperboard,
  Coffee,
  Cpu,
  CupSoda,
  Dumbbell,
  FlaskConical,
  Gauge,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Laptop,
  ListChecks,
  MoonStar,
  NotebookPen,
  PackageOpen,
  PawPrint,
  PieChart,
  PiggyBank,
  Plane,
  ReceiptText,
  Router,
  Shapes,
  ShoppingBasket,
  Smartphone,
  Snowflake,
  Sparkles,
  SprayCan,
  Star,
  Sun,
  Sunrise,
  Tablet,
  Tag,
  Target,
  UtensilsCrossed,
  Wallet,
  Wifi,
}

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Tag
  return <Icon {...props} />
}

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 rounded-[10px]',
  md: 'h-10 w-10 rounded-[13px]',
  lg: 'h-12 w-12 rounded-2xl',
}

const iconSizes = { sm: 15, md: 18, lg: 22 }

export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center border', sizeClasses[size], className)}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 11%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
      }}
      aria-hidden="true"
    >
      <DynamicIcon name={icon} size={iconSizes[size]} strokeWidth={1.9} />
    </span>
  )
}

interface IconTileProps extends CategoryIconProps {
  icon: string
}

export function IconTile({ icon, color, size = 'md', className }: IconTileProps) {
  return <CategoryIcon icon={icon} color={color} size={size} className={className} />
}
