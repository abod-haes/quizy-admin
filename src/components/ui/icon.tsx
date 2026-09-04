import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

/**
 * Canonical Quizy icon namespace.
 *
 * Shared UI and page-level actions should consume icons from here instead of
 * importing individual action icons directly from lucide-react. This keeps
 * action meaning, naming and future icon changes consistent across the admin.
 */
export const Icon = {
  add: Plus,
  edit: Edit3,
  delete: Trash2,
  search: Search,
  filter: Filter,
  upload: Upload,
  download: Download,
  refresh: RefreshCw,
  loading: Loader2,
  view: Eye,
  hide: EyeOff,
  close: X,
  check: Check,
  success: CircleCheck,
  warning: CircleAlert,
  error: CircleX,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
} as const

export type IconName = keyof typeof Icon
