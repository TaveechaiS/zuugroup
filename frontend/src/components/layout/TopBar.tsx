'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, ExternalLink, LogOut, Globe } from 'lucide-react'
import { notificationsApi } from '@/lib/api/services'
import { currentUser, logout } from '@/lib/api/auth'
import { useUI } from '@/lib/ui-context'
import { useLanguage } from '@/contexts/LanguageContext'

const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการทีม', sales: 'พนักงานขาย', cfo: 'ผู้บริหาร',
}

const LANG_LABELS: Record<string, string> = { th: 'ไทย', en: 'English' }

interface Props { title: string }

// Convert a notification's entity → route based on the current user's role.
function buildHref(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  role: string | undefined,
): string | null {
  if (!entityType || !entityId || !role) return null

  const map: Record<string, Record<string, string>> = {
    quotation: {
      admin: `/dashboard/sales/quotations/${entityId}`,    // sales route, admin can view via layout
      manager: `/dashboard/manager/quotations-pending/${entityId}`,
      sales: `/dashboard/sales/quotations/${entityId}`,
      cfo: `/dashboard/sales/quotations/${entityId}`,
    },
    order: {
      admin: `/dashboard/admin/orders/${entityId}`,
      manager: `/dashboard/manager/orders-pending/${entityId}`,
      sales: `/dashboard/sales/orders/${entityId}`,
      cfo: `/dashboard/sales/orders/${entityId}`,
    },
    customer_request: {
      admin: `/dashboard/admin/customer-requests/${entityId}`,
      manager: `/dashboard/admin/customer-requests/${entityId}`,
      sales: `/dashboard/sales/request-customer`,
      cfo: `/dashboard/admin/customer-requests/${entityId}`,
    },
    user: {
      admin: `/dashboard/admin/users`,
      manager: `/dashboard/manager`,
      sales: `/dashboard/sales`,
      cfo: `/dashboard/cfo/users`,
    },
    customer: {
      admin: `/dashboard/admin/customers`,
      manager: `/dashboard/manager/customers`,
      sales: `/dashboard/sales/customers`,
      cfo: `/dashboard/cfo/customers`,
    },
  }
  return map[entityType]?.[role] ?? null
}

export default function TopBar({ title }: Props) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [role, setRole] = useState<string | undefined>(undefined)
  const [user, setUser] = useState<any>(null)
  const { openMobileSidebar, sidebarCollapsed, toggleSidebar } = useUI()
  const { lang, setLang } = useLanguage()

  useEffect(() => {
    const u = currentUser()
    if (u) setUser(u)
    if (u?.role) setRole(u.role)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const loadNotifications = async () => {
    try { setNotifications(await notificationsApi.list()) } catch { /* ignore */ }
  }

  useEffect(() => {
    loadNotifications()
    // Poll more often (15s) so bell updates feel responsive
    const id = setInterval(loadNotifications, 15000)
    return () => clearInterval(id)
  }, [])

  // Refresh whenever the dropdown is opened
  useEffect(() => { if (showNotif) loadNotifications() }, [showNotif])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAllRead = async () => {
    await notificationsApi.markAllRead()
    loadNotifications()
  }

  /** Click a notification → mark read + navigate to the related entity. */
  const handleNotifClick = async (n: any) => {
    if (!n.is_read) {
      try { await notificationsApi.markRead(n.id) } catch { /* ignore */ }
    }
    const href = buildHref(n.related_entity_type, n.related_entity_id, role)
    setShowNotif(false)
    if (href) router.push(href)
    else loadNotifications()
  }

  const typeColor = (t: string) => {
    switch (t) {
      case 'success': return 'bg-green-50 border-l-4 border-green-400'
      case 'warning': return 'bg-yellow-50 border-l-4 border-yellow-400'
      case 'error':   return 'bg-red-50 border-l-4 border-red-400'
      default:        return 'bg-blue-50 border-l-4 border-blue-400'
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
      {/* Hamburger (mobile only) */}
      <button
        onClick={openMobileSidebar}
        className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg shrink-0"
        aria-label="เปิดเมนู"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* Desktop sidebar toggle (before title) */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 shrink-0"
        aria-label={sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
        title={sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate flex-1 lg:flex-initial">{title}</h2>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg hover:bg-gray-100"
            aria-label="การแจ้งเตือน"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
            <div className="absolute right-0 top-12 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">อ่านทั้งหมด</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">ไม่มีการแจ้งเตือน</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => {
                    const href = buildHref(n.related_entity_type, n.related_entity_id, role)
                    const clickable = !!href
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 group ${!n.is_read ? typeColor(n.type) : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{n.title}</p>
                              {clickable && (
                                <ExternalLink size={12} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 break-words">{n.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-gray-400">
                                {new Date(n.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {clickable && <p className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">กดเพื่อดู →</p>}
                            </div>
                          </div>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            </>
          )}
        </div>

        <button
          onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition text-gray-600"
          aria-label="เปลี่ยนภาษา"
          title="เปลี่ยนภาษา"
        >
          <Globe size={18} />
          <span className="hidden sm:inline text-xs font-medium">{LANG_LABELS[lang]}</span>
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUser(!showUser)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
              aria-label="เมนูผู้ใช้"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight min-w-0">
                <span className="text-xs font-medium text-gray-900 truncate max-w-[140px]">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-[10px] text-gray-500 truncate max-w-[140px]">{user.email}</span>
              </div>
            </button>

            {showUser && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUser(false)} />
                <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {role && (
                        <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                          {ROLE_LABELS[role] ?? role}
                        </p>
                      )}
                    </div>
                  </div>
                  {(role === 'sales' || role === 'manager') && user.team?.name && (
                    <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-600">
                      ทีม: <span className="font-medium text-gray-900">{user.team.name}</span>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
