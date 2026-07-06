'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, FileBarChart, FolderOpen, ShoppingCart,
  Users, UserPlus, Package, UsersRound, ClipboardList, Activity,
  FilePlus, Plus, X, MapPin, ChevronDown, ChevronRight,
} from 'lucide-react'
import { badgesApi } from '@/lib/api/services'
import { useUI } from '@/lib/ui-context'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  role: 'admin' | 'manager' | 'sales' | 'cfo'
  user?: any
  mobileOpen: boolean
  onMobileClose: () => void
}

// Map a nav href to the badge key from /api/badges
const BADGE_KEY: Record<string, string> = {
  '/dashboard/admin/customer-requests':      'customer_requests',
  '/dashboard/admin/orders':                 'pending_orders',
  '/dashboard/manager/quotations-pending':   'pending_quotations',
  '/dashboard/manager/orders-pending':       'pending_orders',
}

const SEEN_KEY = 'zuugroup_badge_seen'

interface NavItem { href: string; label: string; icon: any }
interface NavGroup { id: string; label: string; items: NavItem[] }

const NAV: Record<string, NavGroup[]> = {
  admin: [
    { id: 'main', label: 'sidebar.group.main', items: [
      { href: '/dashboard/admin', label: 'sidebar.dashboard', icon: LayoutDashboard },
      { href: '/dashboard/admin/reports', label: 'sidebar.reports', icon: FileBarChart },
    ]},
    { id: 'docs', label: 'sidebar.group.docs', items: [
      { href: '/dashboard/admin/customer-requests', label: 'sidebar.customer_requests', icon: ClipboardList },
      { href: '/dashboard/admin/orders', label: 'sidebar.orders', icon: ShoppingCart },
    ]},
    { id: 'master', label: 'sidebar.group.master', items: [
      { href: '/dashboard/admin/customers', label: 'sidebar.manage_customers', icon: UserPlus },
      { href: '/dashboard/admin/products', label: 'sidebar.manage_products', icon: Package },
    ]},
    { id: 'org', label: 'sidebar.group.org', items: [
      { href: '/dashboard/admin/users', label: 'sidebar.manage_users', icon: Users },
      { href: '/dashboard/admin/teams', label: 'sidebar.manage_teams', icon: UsersRound },
      { href: '/dashboard/admin/zones', label: 'sidebar.zones', icon: MapPin },
    ]},
    { id: 'system', label: 'sidebar.group.system', items: [
      { href: '/dashboard/admin/activity-logs', label: 'sidebar.activity_logs', icon: Activity },
    ]},
  ],
  manager: [
    { id: 'main', label: 'sidebar.group.main', items: [
      { href: '/dashboard/manager', label: 'sidebar.dashboard', icon: LayoutDashboard },
      { href: '/dashboard/manager/reports', label: 'sidebar.reports_team', icon: FileBarChart },
    ]},
    { id: 'pending', label: 'sidebar.group.pending', items: [
      { href: '/dashboard/manager/quotations-pending', label: 'sidebar.quotations_pending', icon: FileText },
      { href: '/dashboard/manager/orders-pending', label: 'sidebar.orders_pending', icon: ShoppingCart },
    ]},
    { id: 'create', label: 'sidebar.group.create', items: [
      { href: '/dashboard/manager/create-quotation', label: 'sidebar.create_quotation', icon: FilePlus },
      { href: '/dashboard/manager/create-order', label: 'sidebar.create_order', icon: Plus },
      { href: '/dashboard/manager/request-customer', label: 'sidebar.request_customer', icon: ClipboardList },
    ]},
    { id: 'docs', label: 'sidebar.group.docs', items: [
      { href: '/dashboard/manager/my-documents', label: 'sidebar.my_documents', icon: FolderOpen },
      { href: '/dashboard/manager/team-documents', label: 'sidebar.team_documents', icon: FolderOpen },
    ]},
    { id: 'master', label: 'sidebar.group.master', items: [
      { href: '/dashboard/manager/customers', label: 'sidebar.info_customers', icon: UserPlus },
      { href: '/dashboard/manager/products', label: 'sidebar.info_products', icon: Package },
    ]},
    { id: 'team', label: 'sidebar.group.team', items: [
      { href: '/dashboard/manager/team-members', label: 'sidebar.team_members', icon: UsersRound },
      { href: '/dashboard/manager/zones', label: 'sidebar.zones', icon: MapPin },
    ]},
  ],
  sales: [
    { id: 'docs', label: 'sidebar.group.docs', items: [
      { href: '/dashboard/sales', label: 'sidebar.my_documents', icon: FolderOpen },
    ]},
    { id: 'create', label: 'sidebar.group.create', items: [
      { href: '/dashboard/sales/create-quotation', label: 'sidebar.create_quotation', icon: FilePlus },
      { href: '/dashboard/sales/create-order', label: 'sidebar.create_order', icon: Plus },
      { href: '/dashboard/sales/request-customer', label: 'sidebar.request_customer', icon: ClipboardList },
    ]},
    { id: 'master', label: 'sidebar.group.master', items: [
      { href: '/dashboard/sales/customers', label: 'sidebar.info_customers', icon: UserPlus },
      { href: '/dashboard/sales/products', label: 'sidebar.info_products', icon: Package },
    ]},
  ],
  cfo: [
    { id: 'main', label: 'sidebar.group.main', items: [
      { href: '/dashboard/cfo', label: 'sidebar.dashboard', icon: LayoutDashboard },
      { href: '/dashboard/cfo/reports', label: 'sidebar.reports', icon: FileBarChart },
    ]},
    { id: 'master', label: 'sidebar.group.all_data', items: [
      { href: '/dashboard/cfo/customers', label: 'sidebar.all_customers', icon: UserPlus },
      { href: '/dashboard/cfo/products', label: 'sidebar.all_products', icon: Package },
      { href: '/dashboard/cfo/users', label: 'sidebar.all_users', icon: Users },
      { href: '/dashboard/cfo/teams', label: 'sidebar.all_teams', icon: UsersRound },
    ]},
  ],
}

const GROUP_STATE_KEY = 'zuugroup_sidebar_groups'

export default function Sidebar({ role, mobileOpen, onMobileClose }: Props) {
  const { sidebarCollapsed: collapsed } = useUI()
  const { t } = useLanguage()
  const pathname = usePathname()
  const groups = NAV[role] ?? []
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [seen, setSeen] = useState<Record<string, number>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // Restore group expand state. Default: all open.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUP_STATE_KEY)
      if (raw) {
        setOpenGroups(JSON.parse(raw))
      } else {
        const defaults: Record<string, boolean> = {}
        groups.forEach((g) => { defaults[g.id] = true })
        setOpenGroups(defaults)
      }
    } catch {
      const defaults: Record<string, boolean> = {}
      groups.forEach((g) => { defaults[g.id] = true })
      setOpenGroups(defaults)
    }
  }, [role]) // eslint-disable-line

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !(prev[id] ?? true) }
      try { localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  // Load badge counts + poll every 20s
  useEffect(() => {
    const load = () => badgesApi.get().then(setBadges).catch(() => { /* ignore */ })
    load()
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [])

  // Restore "seen" counts from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      if (raw) setSeen(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  // When user visits a path, mark its current badge count as "seen"
  useEffect(() => {
    const key = BADGE_KEY[pathname]
    if (!key) return
    const current = badges[key] ?? 0
    if ((seen[pathname] ?? -1) !== current) {
      const next = { ...seen, [pathname]: current }
      setSeen(next)
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    }
  }, [pathname, badges]) // eslint-disable-line

  const hasUnseen = (href: string): { show: boolean; count: number } => {
    const key = BADGE_KEY[href]
    if (!key) return { show: false, count: 0 }
    const current = badges[key] ?? 0
    const seenCount = seen[href] ?? 0
    return { show: current > seenCount && current > 0, count: current }
  }

  // Close mobile drawer on route change
  useEffect(() => { onMobileClose() }, [pathname]) // eslint-disable-line

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          bg-white border-r border-gray-200 flex flex-col transition-all duration-200
          fixed lg:relative inset-y-0 left-0 z-50
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Logo / Header (toggle button lives in TopBar) */}
        <div className="border-b border-gray-100">
          {collapsed ? (
            <div className="flex justify-center py-4">
              <img src="/images/logo.png" alt="ZUUGROUP" className="w-9 h-9 object-contain" />
            </div>
          ) : (
            <div className="p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/images/logo.png" alt="ZUUGROUP" className="w-9 h-9 object-contain shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-[#2563EB] leading-tight">ZUUGROUP</h1>
                  <p className="text-xs text-gray-500 truncate">{t(`role.${role}`)}</p>
                </div>
              </div>
              {/* Mobile close — keep only on mobile drawer */}
              <button
                onClick={onMobileClose}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg shrink-0 text-gray-500"
                aria-label={t('sidebar.close_menu')}
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Nav (collapsible groups) */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {groups.map((group) => {
            const isOpen = openGroups[group.id] ?? true
            // Aggregate unseen badge counts across group's items
            const groupUnseenCount = group.items.reduce((sum, it) => {
              const u = hasUnseen(it.href)
              return sum + (u.show ? u.count : 0)
            }, 0)
            return (
              <div key={group.id}>
                {/* Group header (hidden when collapsed) */}
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                  >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span className="flex-1 text-left">{t(group.label)}</span>
                    {!isOpen && groupUnseenCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                        {groupUnseenCount > 9 ? '9+' : groupUnseenCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Group items */}
                {(collapsed || isOpen) && (
                  <div className={`${collapsed ? '' : 'mt-0.5'} space-y-0.5`}>
                    {group.items.map((item) => {
                      const active = pathname === item.href
                      const Icon = item.icon
                      const { show: hasDot, count } = hasUnseen(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`relative flex items-center gap-3 ${collapsed ? 'px-2.5' : 'px-3'} py-2 rounded-lg text-sm transition ${
                            active
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          title={collapsed ? `${t(item.label)}${hasDot ? ` (${count} ${t('sidebar.new_count')})` : ''}` : undefined}
                        >
                          {active && !collapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-600 rounded-r" />}
                          <span className="relative shrink-0 inline-flex">
                            <Icon size={17} />
                            {hasDot && (
                              <span className="absolute -top-1 -left-1 min-w-[14px] h-[14px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                {count > 9 ? '9+' : count}
                              </span>
                            )}
                          </span>
                          {!collapsed && (
                            <span className="flex-1 truncate">{t(item.label)}</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

      </aside>
    </>
  )
}
