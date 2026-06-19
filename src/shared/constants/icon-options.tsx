import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  CircleHelp,
  FileText,
  Flag,
  Globe,
  Handshake,
  Heart,
  Image,
  Info,
  Layers,
  Lightbulb,
  MapPin,
  Megaphone,
  MessageSquare,
  Newspaper,
  Rocket,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react'

export type SharedIconOption = {
  name: string
  icon: LucideIcon
}

export const SHARED_ICON_OPTIONS: SharedIconOption[] = [
  { name: 'bullhorn', icon: Megaphone },
  { name: 'calendar', icon: Calendar },
  { name: 'megaphone', icon: Megaphone },
  { name: 'bell', icon: Bell },
  { name: 'newspaper', icon: Newspaper },
  { name: 'file-text', icon: FileText },
  { name: 'message-square', icon: MessageSquare },
  { name: 'info', icon: Info },
  { name: 'lightbulb', icon: Lightbulb },
  { name: 'sparkles', icon: Sparkles },
  { name: 'target', icon: Target },
  { name: 'rocket', icon: Rocket },
  { name: 'star', icon: Star },
  { name: 'heart', icon: Heart },
  { name: 'users', icon: Users },
  { name: 'handshake', icon: Handshake },
  { name: 'briefcase', icon: Briefcase },
  { name: 'book-open', icon: BookOpen },
  { name: 'layers', icon: Layers },
  { name: 'globe', icon: Globe },
  { name: 'map-pin', icon: MapPin },
  { name: 'image', icon: Image },
  { name: 'flag', icon: Flag },
]

export const SHARED_ICON_BY_NAME = SHARED_ICON_OPTIONS.reduce<Record<string, LucideIcon>>((acc, option) => {
  acc[option.name] = option.icon
  return acc
}, { unknown: CircleHelp })
