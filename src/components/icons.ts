import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Activity,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Clock,
  Calendar,
  MoreVertical,
  MoreHorizontal,
  LogOut,
  User,
  Shield,
  FileBadge,
  Sparkles,
  Command,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ShoppingCart
} from 'lucide-react';

export const Icons = {
  // Navigation & Features
  dashboard: LayoutDashboard,
  company: Building2,
  worker: Users,
  report: FileText,
  intervention: Activity,
  analytics: BarChart3,
  settings: Settings,
  shoppingCart: ShoppingCart,
  
  // Directions
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,

  // Actions
  search: Search,
  filter: Filter,
  add: Plus,
  delete: Trash2,
  edit: Edit2,
  view: Eye,
  download: Download,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,

  // States & Alerts
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle2,
  info: Info,
  alert: AlertCircle,
  
  // Misc
  time: Clock,
  date: Calendar,
  logout: LogOut,
  user: User,
  shield: Shield,
  certificate: FileBadge,
  
  // UI & Special
  ai: Sparkles, // For DecisionCards
  command: Command, // For Command Palette
};

export type Icon = keyof typeof Icons;
