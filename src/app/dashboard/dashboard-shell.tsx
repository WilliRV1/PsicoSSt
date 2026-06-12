"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Logo } from "@/components/psicosst/logo"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Building2,
    ClipboardList,
    BarChart3,
    Users,
    ChevronLeft,
    ChevronRight,
    Settings,
    LogOut,
    Bell,
    User,
    Shield,
    Menu,
    X,
    AlertTriangle,
    PenLine,
    Clock,
    Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
    id: string
    type: "warning" | "info" | "urgent"
    title: string
    description: string
    href: string
    time?: string
}

interface DashboardShellProps {
    children: React.ReactNode
    user: {
        fullName: string
        licenseNumber: string
        isAdmin: boolean
    }
}

export function DashboardShell({ children, user }: DashboardShellProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [notifLoaded, setNotifLoaded] = useState(false)
    const [creditBalance, setCreditBalance] = useState<number | null>(null)
    const pathname = usePathname()

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    // Fetch notifications
    useEffect(() => {
        fetch("/api/notifications")
            .then((r) => r.ok ? r.json() : { data: [] })
            .then((d) => { setNotifications(d.data || []); setNotifLoaded(true) })
            .catch(() => setNotifLoaded(true))
    }, [])

    // Fetch credit balance
    useEffect(() => {
        fetch("/api/credits")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => { if (d) setCreditBalance(d.balance) })
            .catch(() => {})
    }, [pathname])

    const initials = user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    const navItems = [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Guía Rápida", href: "/dashboard/tutorial", icon: ClipboardList },
        { label: "Empresas", href: "/dashboard/organizations", icon: Building2 },
        { label: "Trabajadores", href: "/dashboard/workers", icon: Users },
        { label: "Evaluaciones", href: "/dashboard/assessments", icon: ClipboardList },
        { label: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
        ...(user.isAdmin
            ? [{ label: "Panel Admin", href: "/dashboard/admin", icon: Shield }]
            : []),
        { label: "Configuración", href: "/dashboard/settings", icon: Settings },
    ]

    const notifIcon = (type: string) => {
        if (type === "urgent") return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
        if (type === "warning") return <Clock className="h-4 w-4 text-amber-500 shrink-0" />
        return <PenLine className="h-4 w-4 text-blue-500 shrink-0" />
    }

    const sidebarContent = (
        <>
            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Navegacion principal">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/")
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={collapsed && !mobileOpen ? label : undefined}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                collapsed && !mobileOpen && "justify-center",
                            )}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                            {(!collapsed || mobileOpen) && <span>{label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom: profile */}
            <div className="border-t border-sidebar-border p-3">
                <Link
                    href="/dashboard/profile"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/dashboard/profile"
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && !mobileOpen && "justify-center",
                    )}
                    title={collapsed && !mobileOpen ? "Mi Perfil" : undefined}
                >
                    <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary/30 text-[10px] font-bold text-primary">
                        {initials}
                    </div>
                    {(!collapsed || mobileOpen) && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-none">{user.fullName}</p>
                            <p className="truncate text-xs text-sidebar-foreground/50 mt-0.5">Mi Perfil</p>
                        </div>
                    )}
                </Link>
            </div>
        </>
    )

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar - Desktop */}
            <aside
                className={cn(
                    "relative hidden lg:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
                    collapsed ? "w-16" : "w-60",
                )}
            >
                {/* Logo */}
                <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-5")}>
                    <Logo iconOnly={collapsed} light />
                </div>

                {sidebarContent}

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors"
                    aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                </button>
            </aside>

            {/* Sidebar - Mobile */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 lg:hidden",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                {/* Mobile logo + close */}
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
                    <Logo light />
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <X className="h-5 w-5 text-sidebar-foreground/70" />
                    </button>
                </div>

                {sidebarContent}
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted transition-colors lg:hidden"
                            aria-label="Abrir menú"
                        >
                            <Menu className="h-5 w-5 text-foreground" />
                        </button>
                        <h1 className="text-lg font-semibold text-foreground">
                            {navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.label ?? "PsicoSST"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Credit balance */}
                        <Link
                            href="/dashboard/credits"
                            className={cn(
                                "hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                                creditBalance !== null && creditBalance <= 0
                                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                    : creditBalance !== null && creditBalance <= 5
                                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "border-border bg-background text-foreground hover:bg-muted"
                            )}
                            title="Créditos disponibles"
                        >
                            <Coins className="h-4 w-4" />
                            <span className="font-semibold">{creditBalance ?? "—"}</span>
                            <span className="hidden md:inline text-xs text-muted-foreground">créditos</span>
                        </Link>

                        {/* Notifications */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
                                    <Bell className="h-[18px] w-[18px]" />
                                    {notifications.length > 0 && (
                                        <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <div className="px-3 py-2 border-b border-border">
                                    <p className="text-sm font-semibold text-foreground">Notificaciones</p>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="px-3 py-6 text-center">
                                        <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Sin notificaciones nuevas</p>
                                    </div>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.map((notif) => (
                                            <DropdownMenuItem key={notif.id} asChild>
                                                <Link href={notif.href} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer">
                                                    {notifIcon(notif.type)}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-foreground leading-tight">{notif.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.description}</p>
                                                    </div>
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {initials}
                                    </div>
                                    <span className="hidden text-sm font-medium sm:block">{user.fullName}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/profile" className="flex items-center gap-2">
                                        <User className="h-4 w-4" /> Mi Perfil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" /> Configuracion
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4" /> Cerrar sesion
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6" id="main-content">
                    {children}
                </main>
            </div>
        </div>
    )
}
