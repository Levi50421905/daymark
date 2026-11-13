import type {
  CurrencyCode,
  DashboardWidget,
  DeviceType,
  InventoryCategory,
  MealType,
  Priority,
  ReviewPeriod,
  ShoppingCategory,
  SubscriptionCycle,
  WidgetId,
} from '@/types/domain'

export const APP_NAME = 'Daymark'
export const APP_VERSION = '1.0.0'
export const SCHEMA_VERSION = 1
export const STORAGE_DB = 'daymark'
export const STORAGE_STORE = 'app-state'
export const STORAGE_KEY = 'daymark.app'

export const CURRENCIES: Array<{
  code: CurrencyCode
  label: string
  symbol: string
  locale: string
  decimals: number
}> = [
  { code: 'IDR', label: 'Rupiah Indonesia', symbol: 'Rp', locale: 'id-ID', decimals: 0 },
  { code: 'USD', label: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2 },
  { code: 'EUR', label: 'Euro', symbol: '€', locale: 'de-DE', decimals: 2 },
  { code: 'GBP', label: 'Pound Sterling', symbol: '£', locale: 'en-GB', decimals: 2 },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', decimals: 2 },
  { code: 'MYR', label: 'Ringgit Malaysia', symbol: 'RM', locale: 'ms-MY', decimals: 2 },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', decimals: 0 },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', decimals: 2 },
]

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  IDR: 'Rp',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  MYR: 'RM',
  JPY: '¥',
  AUD: 'A$',
}

export const CATEGORY_COLORS = [
  '#F4A261',
  '#5FA8F5',
  '#2EC4B6',
  '#8B8FF7',
  '#EF7C9A',
  '#3BBFA3',
  '#F0B429',
  '#9AA8BC',
  '#FF8E72',
  '#57C7E8',
]

export interface CategoryPreset {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

export const DEFAULT_CATEGORIES: CategoryPreset[] = [
  { id: 'cat-food', name: 'Makanan', type: 'expense', color: '#F4A261', icon: 'UtensilsCrossed' },
  { id: 'cat-home', name: 'Kebutuhan Rumah', type: 'expense', color: '#5FA8F5', icon: 'House' },
  { id: 'cat-internet', name: 'Internet', type: 'expense', color: '#2EC4B6', icon: 'Wifi' },
  { id: 'cat-transport', name: 'Transportasi', type: 'expense', color: '#8B8FF7', icon: 'BusFront' },
  { id: 'cat-fun', name: 'Hiburan', type: 'expense', color: '#EF7C9A', icon: 'Clapperboard' },
  { id: 'cat-health', name: 'Kesehatan', type: 'expense', color: '#57C7E8', icon: 'HeartPulse' },
  { id: 'cat-saving', name: 'Tabungan', type: 'expense', color: '#3BBFA3', icon: 'PiggyBank' },
  { id: 'cat-other-expense', name: 'Lainnya', type: 'expense', color: '#9AA8BC', icon: 'Shapes' },
  { id: 'cat-salary', name: 'Gaji', type: 'income', color: '#3BBFA3', icon: 'Wallet' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', color: '#5FA8F5', icon: 'Laptop' },
  { id: 'cat-bonus', name: 'Bonus', type: 'income', color: '#F0B429', icon: 'Sparkles' },
  { id: 'cat-other-income', name: 'Lainnya', type: 'income', color: '#9AA8BC', icon: 'CircleEllipsis' },
]

/** Icon names a user can pick for their own category. Mapped in CategoryIcon. */
export const CATEGORY_ICON_CHOICES = [
  'UtensilsCrossed',
  'Coffee',
  'ShoppingBasket',
  'House',
  'Wifi',
  'BusFront',
  'Car',
  'Clapperboard',
  'HeartPulse',
  'PiggyBank',
  'Wallet',
  'Laptop',
  'Briefcase',
  'Gift',
  'Sparkles',
  'Shapes',
  'BookOpen',
  'Dumbbell',
  'Plane',
  'PawPrint',
  'Smartphone',
  'ReceiptText',
]

export const CHECKLIST_COLORS = ['#2EC4B6', '#5FA8F5', '#8B8FF7', '#F4A261', '#EF7C9A', '#F0B429']
export const GOAL_COLORS = ['#2EC4B6', '#5FA8F5', '#8B8FF7', '#F4A261', '#EF7C9A', '#3BBFA3']
export const GOAL_ICON_CHOICES = [
  'Target',
  'Plane',
  'Laptop',
  'House',
  'Car',
  'GraduationCap',
  'HeartPulse',
  'Gift',
  'PiggyBank',
  'Gem',
  'Bike',
  'Sun',
]

export const SHOPPING_CATEGORIES: Array<{
  value: ShoppingCategory
  color: string
  icon: string
}> = [
  { value: 'Makanan', color: '#F4A261', icon: 'UtensilsCrossed' },
  { value: 'Minuman', color: '#57C7E8', icon: 'Coffee' },
  { value: 'Rumah Tangga', color: '#5FA8F5', icon: 'House' },
  { value: 'Kesehatan', color: '#EF7C9A', icon: 'HeartPulse' },
  { value: 'Lainnya', color: '#9AA8BC', icon: 'Shapes' },
]

export const INVENTORY_CATEGORIES: Array<{
  value: InventoryCategory
  label: string
  shortLabel: string
  color: string
  icon: string
}> = [
  { value: 'frozen', label: 'Frozen Food', shortLabel: 'Frozen', color: '#57C7E8', icon: 'Snowflake' },
  {
    value: 'ingredients',
    label: 'Bahan Makanan',
    shortLabel: 'Bahan',
    color: '#F4A261',
    icon: 'Carrot',
  },
  {
    value: 'seasoning',
    label: 'Bahan Masak',
    shortLabel: 'Bumbu',
    color: '#F0B429',
    icon: 'FlaskConical',
  },
  { value: 'beverage', label: 'Minuman', shortLabel: 'Minuman', color: '#8B8FF7', icon: 'CupSoda' },
  {
    value: 'household',
    label: 'Perlengkapan Rumah Tangga',
    shortLabel: 'Rumah Tangga',
    color: '#5FA8F5',
    icon: 'SprayCan',
  },
]

export const INVENTORY_LOCATIONS = ['Freezer', 'Kulkas', 'Rak Dapur', 'Lemari Bumbu', 'Gudang', 'Lainnya']
export const INVENTORY_UNITS = ['pcs', 'pack', 'gram', 'kg', 'ml', 'liter', 'botol', 'kaleng', 'bungkus', 'butir']
export const SHOPPING_UNITS = ['pcs', 'pack', 'kg', 'gram', 'liter', 'ml', 'botol', 'bungkus', 'kaleng', 'ikat']

export const MEAL_META: Record<MealType, { label: string; shortLabel: string; time: string; icon: string }> = {
  breakfast: { label: 'Sarapan', shortLabel: 'Pagi', time: '06.00–09.00', icon: 'Sunrise' },
  lunch: { label: 'Makan Siang', shortLabel: 'Siang', time: '11.00–14.00', icon: 'Sun' },
  dinner: { label: 'Makan Malam', shortLabel: 'Malam', time: '17.00–20.00', icon: 'MoonStar' },
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; tone: 'sky' | 'amber' | 'rose' }
> = {
  low: { label: 'Rendah', color: '#57C7E8', tone: 'sky' },
  medium: { label: 'Sedang', color: '#F0B429', tone: 'amber' },
  high: { label: 'Tinggi', color: '#EF7C9A', tone: 'rose' },
}

export const TASK_CATEGORIES = ['Personal', 'Rumah', 'Kesehatan', 'Pekerjaan', 'Belajar', 'Keuangan', 'Sosial']

export const REVIEW_PERIOD_META: Record<
  ReviewPeriod,
  { label: string; adjective: string; icon: string; hint: string }
> = {
  daily: { label: 'Harian', adjective: 'hari ini', icon: 'Sun', hint: 'Tutup harimu dengan satu catatan kecil.' },
  weekly: {
    label: 'Mingguan',
    adjective: 'minggu ini',
    icon: 'CalendarRange',
    hint: 'Lihat ritme mingguan dan pilih satu perbaikan.',
  },
  monthly: {
    label: 'Bulanan',
    adjective: 'bulan ini',
    icon: 'CalendarDays',
    hint: 'Zoom out, rayakan progres, dan atur arah bulan depan.',
  },
}

export const DEVICE_META: Record<DeviceType, { label: string; icon: string }> = {
  phone: { label: 'Smartphone', icon: 'Smartphone' },
  tablet: { label: 'Tablet', icon: 'Tablet' },
  laptop: { label: 'Laptop', icon: 'Laptop' },
  router: { label: 'Router / MiFi', icon: 'Router' },
  other: { label: 'Perangkat Lain', icon: 'Cpu' },
}

export const SUBSCRIPTION_CYCLE_META: Record<SubscriptionCycle, { label: string; short: string }> = {
  weekly: { label: 'Setiap minggu', short: 'minggu' },
  monthly: { label: 'Setiap bulan', short: 'bulan' },
  yearly: { label: 'Setiap tahun', short: 'tahun' },
}

export const WIDGET_META: Record<WidgetId, { title: string; description: string; icon: string }> = {
  finance: {
    title: 'Ringkasan keuangan',
    description: 'Saldo, pemasukan, pengeluaran, dan sisa anggaran bulan ini.',
    icon: 'Wallet',
  },
  spending: {
    title: 'Distribusi pengeluaran',
    description: 'Ke mana uangmu pergi bulan ini, per kategori.',
    icon: 'PieChart',
  },
  budget: {
    title: 'Anggaran bulan ini',
    description: 'Progress anggaran dan pengingat kategori yang hampir penuh.',
    icon: 'Gauge',
  },
  recent: {
    title: 'Transaksi terbaru',
    description: 'Lima transaksi terakhir yang baru kamu catat.',
    icon: 'ReceiptText',
  },
  goals: {
    title: 'Target tabungan',
    description: 'Progres tujuan finansial yang sedang kamu kejar.',
    icon: 'Target',
  },
  shopping: {
    title: 'Daftar belanja',
    description: 'Daftar aktif, item yang sudah dibeli, dan estimasi totalnya.',
    icon: 'ShoppingBasket',
  },
  inventory: {
    title: 'Stok makanan',
    description: 'Peringatan stok menipis, habis, dan mendekati kedaluwarsa.',
    icon: 'PackageOpen',
  },
  tasks: {
    title: 'Aktivitas & checklist',
    description: 'Tugas hari ini, prioritas, dan progress checklist.',
    icon: 'ListChecks',
  },
  upcoming: {
    title: 'Jadwal terdekat',
    description: 'Deadline, langganan, dan hal yang perlu perhatian.',
    icon: 'CalendarClock',
  },
  review: {
    title: 'Evaluasi terakhir',
    description: 'Ringkasan refleksi terakhir dan ajakan untuk review baru.',
    icon: 'NotebookPen',
  },
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'finance', visible: true },
  { id: 'spending', visible: true },
  { id: 'budget', visible: true },
  { id: 'recent', visible: true },
  { id: 'goals', visible: true },
  { id: 'shopping', visible: true },
  { id: 'inventory', visible: true },
  { id: 'tasks', visible: true },
  { id: 'upcoming', visible: true },
  { id: 'review', visible: true },
]

export const CHART_COLORS = [
  '#2EC4B6',
  '#5FA8F5',
  '#8B8FF7',
  '#F4A261',
  '#EF7C9A',
  '#F0B429',
  '#57C7E8',
  '#3BBFA3',
  '#9AA8BC',
]

export const PIE_COLORS = [
  '#2EC4B6',
  '#5FA8F5',
  '#8B8FF7',
  '#F4A261',
  '#EF7C9A',
  '#F0B429',
  '#57C7E8',
  '#3BBFA3',
  '#9AA8BC',
]
